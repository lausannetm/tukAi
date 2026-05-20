import type { OrderDTO, OrderServiceSummary, ServiceDTO } from "@/lib/types";

export function orderServiceToServiceDto(
  order: OrderDTO,
  service: OrderServiceSummary,
): ServiceDTO {
  return {
    id: service.id,
    user_id: "",
    name: service.name,
    description: service.description,
    price_cents: service.price_cents,
    location: service.location,
    rating: null,
    image_url: service.image_url,
    created_at: order.created_at,
    latitude: 0,
    longitude: 0,
    avg_rating: null,
    review_count: 0,
  };
}
