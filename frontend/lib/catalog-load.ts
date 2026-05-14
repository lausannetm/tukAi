import { fetchServices } from "@/lib/api";
import { backendPublicOrigin } from "@/lib/public-backend";
import type { ServiceDTO } from "@/lib/types";

export type CatalogLoadResult = {
  services: ServiceDTO[];
  loadError: string | null;
  publicOrigin: string;
  swaggerUrl: string;
};

export async function loadCatalogContext(): Promise<CatalogLoadResult> {
  let services: ServiceDTO[] = [];
  let loadError: string | null = null;

  try {
    services = await fetchServices();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load services.";
  }

  const publicOrigin = backendPublicOrigin();
  const swaggerUrl = `${publicOrigin}/api-docs`;

  return { services, loadError, publicOrigin, swaggerUrl };
}

export function filterServicesByQuery(
  services: ServiceDTO[],
  query: string | undefined
): ServiceDTO[] {
  const q = query?.trim().toLowerCase();
  if (!q) {
    return services;
  }
  return services.filter((s) => {
    const name = s.name.toLowerCase();
    const desc = (s.description ?? "").toLowerCase();
    return name.includes(q) || desc.includes(q);
  });
}
