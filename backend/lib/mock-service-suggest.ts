import { haversineKm } from "@/lib/haversine";
import type { EnrichedServiceRow } from "@/lib/services-queries";

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

/**
 * Heuristic match: substring in name/description, token overlap, avg rating, distance.
 * Same response contract as the LLM path so the UI behaves identically.
 */
export function pickServiceMock(params: {
  query: string;
  userLat: number | null;
  userLng: number | null;
  rows: EnrichedServiceRow[];
}): { service_id: string | null; reason: string } {
  if (params.rows.length === 0) {
    return { service_id: null, reason: "No services in the catalog." };
  }

  const q = params.query.trim().toLowerCase();
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

    const avgRaw =
      row.avg_rating !== null && row.avg_rating !== ""
        ? Number.parseFloat(row.avg_rating)
        : 0;
    const avg = Number.isFinite(avgRaw) ? avgRaw : 0;
    score += avg * 12;

    const lat = Number(row.latitude);
    const lng = Number(row.longitude);
    if (params.userLat !== null && params.userLng !== null) {
      const d = haversineKm(params.userLat, params.userLng, lat, lng);
      score += Math.max(0, 40 - Math.min(d, 40));
    }

    return { row, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best) {
    return { service_id: null, reason: "No suggestion available." };
  }

  if (best.score <= 0) {
    const byRating = [...params.rows].sort((a, b) => {
      const ra =
        a.avg_rating !== null && a.avg_rating !== ""
          ? Number.parseFloat(a.avg_rating)
          : 0;
      const rb =
        b.avg_rating !== null && b.avg_rating !== ""
          ? Number.parseFloat(b.avg_rating)
          : 0;
      return rb - ra;
    });
    const row = byRating[0];
    return {
      service_id: row.id,
      reason:
        "Demo / mock mode (no OpenAI): no text overlap with your search—showing the highest-rated service instead.",
    };
  }

  return {
    service_id: best.row.id,
    reason:
      "Demo / mock mode (no OpenAI): matched using name, description, average rating, and distance.",
  };
}
