import type { OrderDTO, ServiceDTO } from "@/lib/types";

export function backendInternalOrigin(): string {
  const raw = process.env.BACKEND_INTERNAL_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  return "http://127.0.0.1:3001";
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

function normalizeServiceDto(row: ServiceDTO): ServiceDTO {
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
    image_url: row.image_url ?? null,
  };
}

export async function postOrder(payload: {
  userId: string;
  serviceId: string;
  quantity: number;
}): Promise<OrderDTO> {
  const origin = backendInternalOrigin();
  const response = await fetch(`${origin}/orders`, {
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
