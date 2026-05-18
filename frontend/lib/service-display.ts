import { backendPublicOrigin } from "@/lib/public-backend";
import type { ServiceDTO } from "@/lib/types";

/** Shown when the listing owner did not upload a photo. */
export const DEFAULT_SERVICE_IMAGE_PATH = "/images/services/default.png";

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

export function isUserUploadedServiceImage(imageUrl: string): boolean {
  return imageUrl.trim().startsWith("/uploads/services/");
}

/** Resolves stored image_url to a browser-loadable URL. */
export function resolveServiceImageUrl(imageUrl: string | null | undefined): string {
  const value = imageUrl?.trim() ?? "";

  if (isUserUploadedServiceImage(value)) {
    return `${backendPublicOrigin()}${value}`;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/images/services/")) {
    return value;
  }

  return DEFAULT_SERVICE_IMAGE_PATH;
}

export function serviceCardImageUrl(service: ServiceDTO): string {
  return resolveServiceImageUrl(service.image_url);
}

export function serviceDisplayLocation(service: ServiceDTO): string {
  const fromField = service.location?.trim();
  if (fromField) {
    return fromField;
  }
  const match = service.description.match(/Based in ([^.\n]+)/i);
  return match?.[1]?.trim() ?? "Location not set";
}
