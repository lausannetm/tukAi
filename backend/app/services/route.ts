import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  queryEnrichedServices,
  serviceJsonFromEnrichedRow,
  type EnrichedServiceRow,
} from "@/lib/services-queries";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return uuidRegex.test(value);
}

function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export async function GET(): Promise<NextResponse> {
  try {
    const rows = await queryEnrichedServices();
    const body = rows.map(serviceJsonFromEnrichedRow);
    return NextResponse.json(body);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch services";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const raw: unknown = await request.json();
    const o = typeof raw === "object" && raw !== null ? raw : {};
    const rec = o as Record<string, unknown>;

    const providerId =
      typeof rec.providerId === "string"
        ? rec.providerId.trim()
        : typeof rec.provider_id === "string"
          ? rec.provider_id.trim()
          : "";
    const name =
      typeof rec.name === "string" ? rec.name.trim().slice(0, 500) : "";
    const description =
      typeof rec.description === "string" || rec.description === null
        ? rec.description === null
          ? null
          : rec.description.trim().slice(0, 8000)
        : null;
    const priceCentsRaw = rec.price_cents ?? rec.priceCents;
    const price_cents =
      typeof priceCentsRaw === "number" &&
      Number.isInteger(priceCentsRaw) &&
      priceCentsRaw >= 0
        ? priceCentsRaw
        : null;
    const latRaw = rec.latitude ?? rec.lat;
    const lngRaw = rec.longitude ?? rec.lng;
    const latitude = typeof latRaw === "number" && Number.isFinite(latRaw) ? latRaw : null;
    const longitude = typeof lngRaw === "number" && Number.isFinite(lngRaw) ? lngRaw : null;

    if (!providerId || !isUuid(providerId)) {
      return NextResponse.json(
        { error: "providerId is required and must be a UUID string." },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { error: "name is required and must be a non-empty string." },
        { status: 400 }
      );
    }
    if (price_cents === null) {
      return NextResponse.json(
        { error: "price_cents is required and must be a non-negative integer." },
        { status: 400 }
      );
    }
    if (latitude === null || longitude === null || !isValidLatLng(latitude, longitude)) {
      return NextResponse.json(
        {
          error:
            "latitude and longitude are required numbers in valid WGS84 ranges.",
        },
        { status: 400 }
      );
    }

    const inserted = await query<EnrichedServiceRow>(
      `INSERT INTO services (provider_id, name, description, price_cents, latitude, longitude)
       VALUES ($1::uuid, $2, $3, $4::integer, $5::double precision, $6::double precision)
       RETURNING
         id,
         provider_id,
         (
           SELECT COALESCE(NULLIF(BTRIM(u.full_name), ''), u.email, u.id::text)
           FROM users u
           WHERE u.id = provider_id
         ) AS provider_label,
         name,
         description,
         price_cents,
         created_at,
         latitude,
         longitude,
         NULL::text AS avg_rating,
         '0'::text AS review_count`,
      [providerId, name, description, price_cents, latitude, longitude]
    );
    const row = inserted[0];
    if (!row) {
      return NextResponse.json(
        { error: "Could not create service." },
        { status: 500 }
      );
    }

    return NextResponse.json(serviceJsonFromEnrichedRow(row), { status: 201 });
  } catch (err) {
    const code =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof (err as { code: unknown }).code === "string"
        ? (err as { code: string }).code
        : null;
    if (code === "23503") {
      return NextResponse.json(
        { error: "providerId does not match an existing user." },
        { status: 400 }
      );
    }
    const message =
      err instanceof Error ? err.message : "Failed to create service";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
