import type { ServiceDTO } from "@/lib/types";

export function serviceOwnerId(
  service: Pick<ServiceDTO, "user_id" | "provider_id">,
): string {
  return (service.user_id ?? service.provider_id ?? "").trim();
}

export function isServiceListedByUser(
  service: Pick<ServiceDTO, "user_id" | "provider_id">,
  userId: string | null | undefined,
): boolean {
  const ownerId = serviceOwnerId(service).toLowerCase();
  const viewerId = userId?.trim().toLowerCase() ?? "";
  return ownerId.length > 0 && viewerId.length > 0 && ownerId === viewerId;
}
