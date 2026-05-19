import { resolveServiceImageUrl } from "@/lib/service-display";
import type { OrderDTO, ServiceDTO } from "@/lib/types";

export type CreateServicePayload = {
  userId: string;
  name: string;
  description: string;
  location: string;
  priceCents: number;
  latitude: number;
  longitude: number;
  imageUrl?: string;
};

export function backendInternalOrigin(): string {
  const raw = process.env.BACKEND_INTERNAL_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  return "http://127.0.0.1:3001";
}

/** Same-origin `/backend` proxy in the browser; direct internal URL on the server. */
export function backendApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    return `/backend${normalized}`;
  }
  return `${backendInternalOrigin()}${normalized}`;
}

export async function fetchServices(): Promise<ServiceDTO[]> {
  const origin = backendInternalOrigin();
  const response = await fetch(`${origin}/services`, {
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Failed to load services (${response.status})`);
  }

  const rows = (await response.json()) as ServiceDTO[];
  return rows.map(normalizeServiceDto);
}

export function normalizeServiceDto(row: ServiceDTO): ServiceDTO {
  const userId = row.user_id ?? row.provider_id ?? "";
  const rating =
    row.rating ??
    (row.avg_rating !== null && row.avg_rating !== undefined ? row.avg_rating : null);

  return {
    ...row,
    user_id: userId,
    provider_id: row.provider_id ?? userId,
    description: row.description ?? "",
    location: row.location ?? "",
    rating,
    image_url: resolveServiceImageUrl(row.image_url),
    category: row.category ?? null,
  };
}

export async function uploadServiceImage(file: File): Promise<{ image_url: string }> {
  const form = new FormData();
  form.append("image", file);

  const response = await fetch(backendApiUrl("/services/upload"), {
    method: "POST",
    body: form,
  });

  let bodyUnknown: unknown;
  try {
    bodyUnknown = await response.json();
  } catch {
    bodyUnknown = null;
  }

  if (!response.ok) {
    const message =
      bodyUnknown !== null &&
      typeof bodyUnknown === "object" &&
      "error" in bodyUnknown &&
      typeof (bodyUnknown as { error: unknown }).error === "string"
        ? (bodyUnknown as { error: string }).error
        : `Image upload failed (${response.status})`;
    throw new Error(message);
  }

  const body = bodyUnknown as { image_url?: string };
  if (!body.image_url?.trim()) {
    throw new Error("Upload did not return an image_url.");
  }
  return { image_url: body.image_url.trim() };
}

export async function createService(
  payload: CreateServicePayload,
): Promise<ServiceDTO> {
  const response = await fetch(backendApiUrl("/services"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      user_id: payload.userId,
      name: payload.name,
      description: payload.description,
      location: payload.location,
      price_cents: payload.priceCents,
      latitude: payload.latitude,
      longitude: payload.longitude,
      image_url: payload.imageUrl,
    }),
  });

  let bodyUnknown: unknown;
  try {
    bodyUnknown = await response.json();
  } catch {
    bodyUnknown = null;
  }

  if (!response.ok) {
    const message =
      bodyUnknown !== null &&
      typeof bodyUnknown === "object" &&
      "error" in bodyUnknown &&
      typeof (bodyUnknown as { error: unknown }).error === "string"
        ? (bodyUnknown as { error: string }).error
        : `Could not create service (${response.status})`;
    throw new Error(message);
  }

  return normalizeServiceDto(bodyUnknown as ServiceDTO);
}

export async function postOrder(payload: {
  userId: string;
  serviceId: string;
  quantity: number;
}): Promise<OrderDTO> {
  const response = await fetch(backendApiUrl("/orders"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      userId: payload.userId,
      serviceId: payload.serviceId,
      quantity: payload.quantity,
    }),
  });

  let bodyUnknown: unknown;
  try {
    bodyUnknown = await response.json();
  } catch {
    bodyUnknown = null;
  }

  if (!response.ok) {
    const message =
      bodyUnknown !== null &&
      typeof bodyUnknown === "object" &&
      "error" in bodyUnknown &&
      typeof (bodyUnknown as { error: unknown }).error === "string"
        ? (bodyUnknown as { error: string }).error
        : `Order failed (${response.status})`;
    throw new Error(message);
  }

  return bodyUnknown as OrderDTO;
}
