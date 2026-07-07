import { haversineKm } from "@/lib/haversine";
import {
  sortServicePicks,
  type CatalogItemForAi,
  type ServicePick,
  type ServicesPickResponse,
} from "@/lib/openai-service-suggest";
import type { EnrichedServiceRow } from "@/lib/services-queries";
import { inferServiceCategory } from "@/lib/service-categories";

/**
 * When true, `/services/suggest` skips OpenAI and picks locally (zero API spend).
 *
 * - Explicit: `OPENAI_MOCK_SUGGEST=1|true|yes` (or `0|false|no` to force off).
 * - `next dev` only: if `OPENAI_API_KEY` is unset, mock is on automatically (no flag needed).
 * - `next start` / Docker: mock only when the flag is set; host shell env from `npm run dev`
 *   does not apply to the container — use the project root `.env` for Compose.
 */
export function isOpenAiMockSuggestEnabled(): boolean {
  const v = process.env.OPENAI_MOCK_SUGGEST?.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") {
    return true;
  }
  if (v === "0" || v === "false" || v === "no") {
    return false;
  }
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  if (process.env.NODE_ENV === "development" && !hasApiKey) {
    return true;
  }
  return false;
}

const BROAD_CATEGORY_PATTERNS: Array<{
  category: Exclude<ReturnType<typeof inferServiceCategory>, null>;
  pattern: RegExp;
}> = [
  {
    category: "it",
    pattern:
      /\b(it|computer|computers|tech|laptop|pc|компют|информатик|техник)\b/i,
  },
  {
    category: "beauty",
    pattern:
      /\b(beauty|beautiful|spa|wellness|relax|pamper|massage|manicure|pedicure|facial|skincare|salon|yoga|красота|поглез|салон|спа|маникюр)\b/i,
  },
  {
    category: "renovation",
    pattern:
      /\b(renovation|repair|handyman|construction|plumber|electrician|майстор|ремонт|строител)\b/i,
  },
  {
    category: "photography",
    pattern: /\b(photo|photograph|photography|фотограф|снимк|сватб)\b/i,
  },
  {
    category: "catering",
    pattern: /\b(cater|catering|banquet|food service|кетъринг|банкет)\b/i,
  },
  {
    category: "chefs",
    pattern: /\b(chef|cook|personal chef|готвач|шеф)\b/i,
  },
  {
    category: "fun",
    pattern: /\b(entertain|party|event|dj|fun|забавлен|парти)\b/i,
  },
];

function catalogItemsFromRows(
  rows: EnrichedServiceRow[],
  userLat: number | null,
  userLng: number | null,
): CatalogItemForAi[] {
  return rows.map((row) => {
    const avgRating =
      row.avg_rating !== null && row.avg_rating !== ""
        ? Number.parseFloat(row.avg_rating)
        : null;
    const reviewCount = Number.parseInt(row.review_count, 10);
    const lat = Number(row.latitude);
    const lng = Number(row.longitude);
    let distance_km: number | null = null;
    if (userLat !== null && userLng !== null) {
      distance_km =
        Math.round(haversineKm(userLat, userLng, lat, lng) * 10) / 10;
    }
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: inferServiceCategory({
        name: row.name,
        description: row.description,
      }),
      avg_rating: Number.isFinite(avgRating ?? NaN) ? avgRating : null,
      review_count: Number.isFinite(reviewCount) ? reviewCount : 0,
      distance_km,
    };
  });
}

function inferBroadCategory(query: string): string | null {
  for (const entry of BROAD_CATEGORY_PATTERNS) {
    if (entry.pattern.test(query)) {
      return entry.category;
    }
  }
  if (query.includes("me time") || query.includes("feel good")) {
    return "beauty";
  }
  return null;
}

function pickReason(mode: "broad" | "specific" | "fallback"): string {
  if (mode === "broad") {
    return "Demo / mock mode (no OpenAI): matched a broad category request.";
  }
  if (mode === "specific") {
    return "Demo / mock mode (no OpenAI): matched using name, description, and intent.";
  }
  return "Demo / mock mode (no OpenAI): showing the best local matches instead.";
}

/**
 * Heuristic match: category-wide picks, token overlap, then local distance/rating sort.
 * Same response contract as the LLM path so the UI behaves identically.
 */
export function pickServiceMock(params: {
  query: string;
  userLat: number | null;
  userLng: number | null;
  rows: EnrichedServiceRow[];
}): ServicesPickResponse {
  if (params.rows.length === 0) {
    return { services: [] };
  }

  const q = params.query.trim().toLowerCase();
  const items = catalogItemsFromRows(
    params.rows,
    params.userLat,
    params.userLng,
  );
  const broadCategory = inferBroadCategory(q);
  if (broadCategory) {
    const picks: ServicePick[] = items
      .filter((item) => item.category === broadCategory)
      .map((item) => ({
        service_id: item.id,
        reason: pickReason("broad"),
      }));
    if (picks.length > 0) {
      return { services: sortServicePicks(picks, items) };
    }
  }

  const words = q
    .split(/[\s/.,;:!?\-_+]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2);

  const scored = params.rows.map((row) => {
    const nameLower = row.name.toLowerCase();
    const descLower = (row.description ?? "").toLowerCase();
    let score = 0;

    if (q.length >= 2) {
      if (nameLower.includes(q)) {
        score += 120;
      } else if (descLower.includes(q)) {
        score += 75;
      }
    }

    for (const w of words) {
      if (nameLower.includes(w)) {
        score += 45;
      } else if (descLower.includes(w)) {
        score += 28;
      }
    }

    const beautyQuery =
      /\b(beauty|beautiful|spa|wellness|relax|pamper|massage|manicure|pedicure|facial|skincare|salon|yoga)\b/.test(
        q,
      ) || q.includes("me time") || q.includes("feel good");
    const beautyService =
      descLower.includes("beauty") ||
      descLower.includes("wellness") ||
      descLower.includes("spa") ||
      nameLower.includes("spa") ||
      nameLower.includes("beauty");
    if (beautyQuery && beautyService) {
      score += 90;
    }

    return { row, score };
  });

  const matches = scored.filter((entry) => entry.score > 0);
  if (matches.length > 0) {
    const picks: ServicePick[] = matches.map((entry) => ({
      service_id: entry.row.id,
      reason: pickReason("specific"),
    }));
    return { services: sortServicePicks(picks, items) };
  }

  const fallbackPick: ServicePick = {
    service_id: params.rows[0]!.id,
    reason: pickReason("fallback"),
  };
  return { services: sortServicePicks([fallbackPick], items) };
}
