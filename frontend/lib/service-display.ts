import {
  inferServiceCategory,
  localCategoryImage,
  type ServiceCategoryId,
} from "@/lib/service-categories";
import { backendPublicOrigin } from "@/lib/public-backend";
import type { ServiceDTO } from "@/lib/types";

export function formatServicePrice(priceCents: number): string {
  const euros = priceCents / 100;
  const formatted = Number.isInteger(euros)
    ? String(euros)
    : euros.toFixed(2).replace(/0$/, "").replace(/\.$/, "");
  return `From € ${formatted}`;
}

export function formatServiceRating(rating: number | null): string | null {
  if (rating === null || rating === undefined) {
    return null;
  }
  return rating.toFixed(2);
}

/** Resolves DB image_url to a browser-loadable URL. */
export function resolveServiceImageUrl(imageUrl: string | null | undefined): string {
  const value = imageUrl?.trim() ?? "";
  if (!value) {
    return localCategoryImage("all");
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (value.startsWith("/uploads/")) {
    return `${backendPublicOrigin()}${value}`;
  }
  return value;
}

export function serviceCardImageUrl(service: ServiceDTO): string {
  if (service.image_url?.trim()) {
    return resolveServiceImageUrl(service.image_url);
  }
  const category = inferServiceCategory(service);
  const categoryId: ServiceCategoryId = category ?? "all";
  return localCategoryImage(categoryId);
}

export function serviceDisplayLocation(service: ServiceDTO): string {
  const fromField = service.location?.trim();
  if (fromField) {
    return fromField;
  }
  const match = service.description.match(/Based in ([^.\n]+)/i);
  return match?.[1]?.trim() ?? "Location not set";
}
