import { query } from "@/lib/db";

export type EnrichedServiceRow = {
  id: string;
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

  if (hasGeo) {
    return query<EnrichedServiceRow>(
      `SELECT
         s.id,
         s.name,
         s.description,
         s.price_cents,
         s.created_at,
         s.latitude,
         s.longitude,
         ROUND(AVG(r.rating)::numeric, 2)::text AS avg_rating,
         COUNT(r.id)::text AS review_count
       FROM services s
       LEFT JOIN reviews r ON r.service_id = s.id
       GROUP BY s.id
       ORDER BY s.created_at ASC`
    );
  }

  return query<EnrichedServiceRow>(
    `SELECT
       s.id,
       s.name,
       s.description,
       s.price_cents,
       s.created_at,
       0::double precision AS latitude,
       0::double precision AS longitude,
       ROUND(AVG(r.rating)::numeric, 2)::text AS avg_rating,
       COUNT(r.id)::text AS review_count
     FROM services s
     LEFT JOIN reviews r ON r.service_id = s.id
     GROUP BY s.id
     ORDER BY s.created_at ASC`
  );
}
