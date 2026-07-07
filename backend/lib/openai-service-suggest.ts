import { isUuid } from "@/lib/auth-validation";

export type CatalogItemForAi = {
  id: string;
  name: string;
  description: string | null;
  /** Catalog category slug (e.g. beauty, renovation). */
  category: string | null;
  avg_rating: number | null;
  review_count: number;
  /** Kilometers from the user; omitted when location unknown. */
  distance_km: number | null;
};

export type ServicePick = {
  service_id: string;
  reason: string;
};

export type ServicesPickResponse = {
  services: ServicePick[];
};

export function openAiSuggestModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function extractJsonObject(content: string): string | null {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return trimmed.slice(start, end + 1);
}

export type RawServicePick = {
  service_id: string | null;
  reason: string;
};

export type RawServicesPickResponse = {
  services: RawServicePick[];
};

export function parseServicePickJson(content: string): RawServicesPickResponse | null {
  const jsonStr = extractJsonObject(content);
  if (!jsonStr) {
    return null;
  }
  try {
    const raw: unknown = JSON.parse(jsonStr);
    if (typeof raw !== "object" || raw === null) {
      return null;
    }
    const o = raw as Record<string, unknown>;
    const servicesRaw = o.services;
    if (!Array.isArray(servicesRaw)) {
      return null;
    }
    const services: RawServicePick[] = [];
    for (const entry of servicesRaw) {
      if (typeof entry !== "object" || entry === null) {
        continue;
      }
      const item = entry as Record<string, unknown>;
      const serviceIdRaw = item.service_id;
      const reasonRaw = item.reason;
      const service_id =
        serviceIdRaw === null
          ? null
          : typeof serviceIdRaw === "string"
            ? serviceIdRaw
            : null;
      const reason = typeof reasonRaw === "string" ? reasonRaw : "";
      services.push({ service_id, reason: reason || "Suggested by AI." });
    }
    return { services };
  } catch {
    return null;
  }
}

export function normalizeServicePick(
  pick: RawServicesPickResponse,
  validIds: ReadonlySet<string>,
): ServicesPickResponse {
  const services = pick.services.flatMap((entry) => {
    const id = entry.service_id;
    if (id === null || !isUuid(id) || !validIds.has(id)) {
      return [];
    }
    return [
      {
        service_id: id,
        reason: entry.reason || "Suggested by AI.",
      },
    ];
  });
  return { services };
}

export function sortServicePicks(
  picks: ServicePick[],
  items: readonly CatalogItemForAi[],
): ServicePick[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  return [...picks].sort((a, b) => {
    const left = itemById.get(a.service_id);
    const right = itemById.get(b.service_id);
    const leftDistance = left?.distance_km ?? Number.POSITIVE_INFINITY;
    const rightDistance = right?.distance_km ?? Number.POSITIVE_INFINITY;
    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }
    const leftRating = left?.avg_rating ?? Number.NEGATIVE_INFINITY;
    const rightRating = right?.avg_rating ?? Number.NEGATIVE_INFINITY;
    if (leftRating !== rightRating) {
      return rightRating - leftRating;
    }
    const leftReviews = left?.review_count ?? 0;
    const rightReviews = right?.review_count ?? 0;
    return rightReviews - leftReviews;
  });
}

export async function suggestServiceWithOpenAI(params: {
  apiKey: string;
  userQuery: string;
  items: CatalogItemForAi[];
}): Promise<RawServicesPickResponse> {
  const system = `Match catalog services to the user search. Understand natural language, intent, and synonyms. Use only service_id values from the catalog—never invent services. Broad query: return every service in the matching category. Specific query: return only matching services. Return every relevant match. Output JSON only, no markdown: {"services":[{"service_id":"<uuid>","reason":"<brief>"}]}`;

  const userPayload = {
    search: params.userQuery,
    catalog: params.items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
    })),
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: openAiSuggestModel(),
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: JSON.stringify(userPayload),
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `OpenAI request failed (${res.status}): ${text.slice(0, 280)}`
    );
  }

  const data = (await res.json()) as OpenAiChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty message.");
  }

  const parsed = parseServicePickJson(content);
  if (!parsed) {
    throw new Error("OpenAI returned JSON that could not be parsed.");
  }

  return parsed;
}
