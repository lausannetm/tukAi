import { query } from "@/lib/db";
import { toIsoTimestamp } from "@/lib/iso-timestamp";

export type EnrichedServiceRow = {
  id: string;
  provider_id: string;
  /** Display name for the listing owner (full name, email, or id). */
  provider_label: string;
  name: string;
  description: string | null;
  price_cents: number;
  created_at: Date | string;
  latitude: number;
  longitude: number;
  avg_rating: string | null;
  review_count: string;
};

let geoColumnsExistenceConfirmed = false;

async function servicesTableHasGeoColumns(): Promise<boolean> {
  if (geoColumnsExistenceConfirmed) {
    return true;
  }
  const rows = await query<{ col: string }>(
    `SELECT column_name AS col
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'services'
       AND column_name IN ('latitude', 'longitude')`
  );
  const names = new Set(rows.map((r) => r.col));
  const has = names.has("latitude") && names.has("longitude");
  if (has) {
    geoColumnsExistenceConfirmed = true;
  }
  return has;
}

/** Clears the “geo columns exist” memo (e.g. after tests or unusual schema changes). */
export function resetServicesGeoColumnCache(): void {
  geoColumnsExistenceConfirmed = false;
}

export async function queryEnrichedServices(): Promise<EnrichedServiceRow[]> {
  const hasGeo = await servicesTableHasGeoColumns();

  const reviewAgg = `(
     SELECT
       service_id,
       ROUND(AVG(rating)::numeric, 2)::text AS avg_rating,
       COUNT(*)::text AS review_count
     FROM reviews
     GROUP BY service_id
   ) stats`;

  const providerLabel = `COALESCE(
     NULLIF(BTRIM(pu.full_name), ''),
     pu.email,
     pu.id::text
   ) AS provider_label`;

  if (hasGeo) {
    return query<EnrichedServiceRow>(
      `SELECT
         s.id,
         s.provider_id,
         ${providerLabel},
         s.name,
         s.description,
         s.price_cents,
         s.created_at,
         s.latitude,
         s.longitude,
         stats.avg_rating,
         COALESCE(stats.review_count, '0') AS review_count
       FROM services s
       INNER JOIN users pu ON pu.id = s.provider_id
       LEFT JOIN ${reviewAgg} ON stats.service_id = s.id
       ORDER BY s.created_at ASC`
    );
  }

  return query<EnrichedServiceRow>(
    `SELECT
       s.id,
       s.provider_id,
       ${providerLabel},
       s.name,
       s.description,
       s.price_cents,
       s.created_at,
       0::double precision AS latitude,
       0::double precision AS longitude,
       stats.avg_rating,
       COALESCE(stats.review_count, '0') AS review_count
     FROM services s
     INNER JOIN users pu ON pu.id = s.provider_id
     LEFT JOIN ${reviewAgg} ON stats.service_id = s.id
     ORDER BY s.created_at ASC`
  );
}

export type ServiceJsonBody = {
  id: string;
  provider_id: string;
  provider_label: string;
  name: string;
  description: string | null;
  price_cents: number;
  created_at: string;
  latitude: number;
  longitude: number;
  avg_rating: number | null;
  review_count: number;
};

export function serviceJsonFromEnrichedRow(row: EnrichedServiceRow): ServiceJsonBody {
  return {
    id: row.id,
    provider_id: row.provider_id,
    provider_label: row.provider_label,
    name: row.name,
    description: row.description,
    price_cents: row.price_cents,
    created_at: toIsoTimestamp(row.created_at),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    avg_rating:
      row.avg_rating !== null && row.avg_rating !== ""
        ? Number.parseFloat(row.avg_rating)
        : null,
    review_count: Number.parseInt(row.review_count, 10),
  };
}
