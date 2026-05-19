export type ServiceDTO = {
  id: string;
  /** Creator of the listing. */
  user_id: string;
  /** @deprecated Use user_id. Kept for older payloads. */
  provider_id?: string;
  provider_label?: string;
  name: string;
  description: string;
  price_cents: number;
  location: string;
  /** Review average when present, otherwise optional listing rating. */
  rating: number | null;
  image_url: string;
  created_at: string;
  latitude: number;
  longitude: number;
  avg_rating: number | null;
  review_count: number;
  /** Catalog category slug from the API (parsed from description). */
  category?: string | null;
};

export type AiServiceSuggestResponse = {
  service: ServiceDTO | null;
  reason: string;
};

export type OrderDTO = {
  id: string;
  user_id: string;
  service_id: string;
  status: string;
  quantity: number;
  created_at: string;
};
