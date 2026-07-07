import { NextResponse } from "next/server";
import { haversineKm } from "@/lib/haversine";
import {
  isOpenAiMockSuggestEnabled,
  pickServiceMock,
} from "@/lib/mock-service-suggest";
import {
  normalizeServicePick,
  sortServicePicks,
  suggestServiceWithOpenAI,
  type CatalogItemForAi,
  type ServicesPickResponse,
} from "@/lib/openai-service-suggest";
import {
  queryEnrichedServices,
  serviceJsonFromEnrichedRow,
} from "@/lib/services-queries";
import { inferServiceCategory } from "@/lib/service-categories";

type SuggestRequestBody = {
  query?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function buildCatalogItems(
  rows: Awaited<ReturnType<typeof queryEnrichedServices>>,
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

export async function POST(req: Request): Promise<NextResponse> {
  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const body = bodyUnknown as SuggestRequestBody;
  const rawQuery = typeof body.query === "string" ? body.query : "";
  const queryText = rawQuery.trim().slice(0, 500);
  if (!queryText) {
    return NextResponse.json(
      { error: "Field \"query\" is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  const latRaw = parseOptionalNumber(body.latitude);
  const lngRaw = parseOptionalNumber(body.longitude);
  const hasCoords = latRaw !== null && lngRaw !== null;
  const userLat = hasCoords && isValidLatLng(latRaw, lngRaw) ? latRaw : null;
  const userLng = hasCoords && isValidLatLng(latRaw, lngRaw) ? lngRaw : null;

  try {
    const rows = await queryEnrichedServices();
    if (rows.length === 0) {
      return NextResponse.json(
        { services: [], reason: "No services are available yet." },
        { status: 200 }
      );
    }

    const items = buildCatalogItems(rows, userLat, userLng);
    const validIds = new Set(items.map((item) => item.id));

    let pick: ServicesPickResponse;
    if (isOpenAiMockSuggestEnabled()) {
      pick = pickServiceMock({
        query: queryText,
        userLat,
        userLng,
        rows,
      });
    } else {
      const apiKey = process.env.OPENAI_API_KEY?.trim();
      if (!apiKey) {
        return NextResponse.json(
          {
            error:
              "OPENAI_API_KEY is not set. For a zero-cost demo set OPENAI_MOCK_SUGGEST=1 (project root .env for Docker Compose). Local next dev uses mock automatically when the key is empty.",
          },
          { status: 503 }
        );
      }

      const rawPick = await suggestServiceWithOpenAI({
        apiKey,
        userQuery: queryText,
        items,
      });
      pick = normalizeServicePick(rawPick, validIds);
    }

    const sorted = sortServicePicks(pick.services, items);
    const services = sorted.flatMap((entry) => {
      const row = rows.find((candidate) => candidate.id === entry.service_id);
      if (!row) {
        return [];
      }
      return [
        {
          service: serviceJsonFromEnrichedRow(row),
          reason: entry.reason,
        },
      ];
    });

    if (services.length === 0) {
      return NextResponse.json({
        services: [],
        reason: "No matching services were found in the catalog.",
      });
    }

    return NextResponse.json({ services });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI suggestion failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
