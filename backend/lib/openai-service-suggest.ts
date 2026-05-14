export type CatalogItemForAi = {
  id: string;
  name: string;
  description: string | null;
  avg_rating: number | null;
  review_count: number;
  /** Kilometers from the user; omitted when location unknown. */
  distance_km: number | null;
};

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

export function parseServicePickJson(
  content: string
): { service_id: string | null; reason: string } | null {
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
    const serviceIdRaw = o.service_id;
    const reasonRaw = o.reason;
    const service_id =
      serviceIdRaw === null
        ? null
        : typeof serviceIdRaw === "string"
          ? serviceIdRaw
          : null;
    const reason = typeof reasonRaw === "string" ? reasonRaw : "";
    return { service_id, reason: reason || "Suggested by AI." };
  } catch {
    return null;
  }
}

export async function suggestServiceWithOpenAI(params: {
  apiKey: string;
  userQuery: string;
  userLatitude: number | null;
  userLongitude: number | null;
  items: CatalogItemForAi[];
}): Promise<{ service_id: string | null; reason: string }> {
  const system = `You help customers pick one service from a fixed catalog.
Respond with a single JSON object (no markdown fences) with exactly:
- "service_id": string UUID copied exactly from the catalog entry you choose, or null only if nothing is a reasonable match
- "reason": one concise sentence for the customer in plain language

Ranking: first semantic fit to the customer's search, then prefer higher avg_rating, then prefer smaller distance_km when distances are provided.`;

  const userPayload = {
    search: params.userQuery,
    user_location:
      params.userLatitude !== null && params.userLongitude !== null
        ? {
            latitude: params.userLatitude,
            longitude: params.userLongitude,
          }
        : null,
    catalog: params.items,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
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

export function normalizeServicePick(
  pick: { service_id: string | null; reason: string },
  validIds: ReadonlySet<string>
): { service_id: string | null; reason: string } {
  if (pick.service_id === null) {
    return pick;
  }
  if (!validIds.has(pick.service_id)) {
    return {
      service_id: null,
      reason:
        pick.reason ||
        "We could not confirm a catalog match; try browsing all services.",
    };
  }
  return pick;
}
