export type ServiceDTO = {
  id: string;
  /** Listing owner; may be absent on older API payloads. */
  provider_id?: string;
  provider_label?: string;
  name: string;
  description: string | null;
  price_cents: number;
  created_at: string;
  latitude: number;
  longitude: number;
  avg_rating: number | null;
  review_count: number;
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
