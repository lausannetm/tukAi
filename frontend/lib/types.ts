export type ServiceDTO = {
  id: string;
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
