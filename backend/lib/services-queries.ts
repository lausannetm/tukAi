import { query } from "@/lib/db";
import { effectiveServiceImageUrl } from "@/lib/service-image-storage";
import { inferServiceCategory } from "@/lib/service-categories";
import { toIsoTimestamp } from "@/lib/iso-timestamp";

export type EnrichedServiceRow = {
  id: string;
  provider_id: string;
  /** Display name for the listing owner (full name, email, or id). */
  provider_label: string;
  name: string;
  description: string | null;
  price_cents: number;
  location: string;
  listing_rating: string | null;
  image_url: string | null;
  created_at: Date | string;
  latitude: number;
  longitude: number;
  avg_rating: string | null;
  review_count: string;
};

let listingColumnsExistenceConfirmed = false;

async function servicesTableHasListingColumns(): Promise<boolean> {
  if (listingColumnsExistenceConfirmed) {
    return true;
  }
  const rows = await query<{ col: string }>(
    `SELECT column_name AS col
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'services'
       AND column_name IN ('location', 'latitude', 'longitude')`
  );
  const names = new Set(rows.map((r) => r.col));
  const has = names.has("location") && names.has("latitude") && names.has("longitude");
  if (has) {
    listingColumnsExistenceConfirmed = true;
  }
  return has;
}

/** Clears the listing-columns memo (e.g. after tests or schema changes). */
export function resetServicesListingColumnCache(): void {
  listingColumnsExistenceConfirmed = false;
}

export async function queryEnrichedServices(options?: {
  providerId?: string;
}): Promise<EnrichedServiceRow[]> {
  const providerId = options?.providerId?.trim();
  const hasListing = await servicesTableHasListingColumns();

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

  const providerFilter = providerId ? `WHERE s.provider_id = $1::uuid` : "";
  const params = providerId ? [providerId] : [];

  if (hasListing) {
    return query<EnrichedServiceRow>(
      `SELECT
         s.id,
         s.provider_id,
         ${providerLabel},
         s.name,
         s.description,
         s.price_cents,
         s.location,
         s.rating::text AS listing_rating,
         s.image_url,
         s.created_at,
         s.latitude,
         s.longitude,
         stats.avg_rating,
         COALESCE(stats.review_count, '0') AS review_count
       FROM services s
       INNER JOIN users pu ON pu.id = s.provider_id
       LEFT JOIN ${reviewAgg} ON stats.service_id = s.id
       ${providerFilter}
       ORDER BY s.created_at ASC`,
      params
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
       ''::text AS location,
       NULL::text AS listing_rating,
       NULL::text AS image_url,
       s.created_at,
       0::double precision AS latitude,
       0::double precision AS longitude,
       stats.avg_rating,
       COALESCE(stats.review_count, '0') AS review_count
     FROM services s
     INNER JOIN users pu ON pu.id = s.provider_id
     LEFT JOIN ${reviewAgg} ON stats.service_id = s.id
     ${providerFilter}
     ORDER BY s.created_at ASC`,
    params
  );
}

export type ServiceJsonBody = {
  id: string;
  user_id: string;
  provider_id: string;
  provider_label: string;
  name: string;
  description: string;
  price_cents: number;
  location: string;
  rating: number | null;
  image_url: string | null;
  created_at: string;
  latitude: number;
  longitude: number;
  avg_rating: number | null;
  review_count: number;
  category: string | null;
};

function parseOptionalRating(value: string | null): number | null {
  if (value === null || value === "") {
    return null;
  }
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function resolveServiceRating(
  avgRating: string | null,
  listingRating: string | null
): number | null {
  const fromReviews = parseOptionalRating(avgRating);
  if (fromReviews !== null) {
    return fromReviews;
  }
  return parseOptionalRating(listingRating);
}

export function serviceJsonFromEnrichedRow(row: EnrichedServiceRow): ServiceJsonBody {
  const avgRating = parseOptionalRating(row.avg_rating);
  const rating = resolveServiceRating(row.avg_rating, row.listing_rating);

  return {
    id: row.id,
    user_id: row.provider_id,
    provider_id: row.provider_id,
    provider_label: row.provider_label,
    name: row.name,
    description: row.description ?? "",
    price_cents: row.price_cents,
    location: row.location,
    rating,
    image_url: effectiveServiceImageUrl(row.image_url),
    created_at: toIsoTimestamp(row.created_at),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    avg_rating: avgRating,
    review_count: Number.parseInt(row.review_count, 10),
    category: inferServiceCategory({
      name: row.name,
      description: row.description,
    }),
  };
}
