import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogServiceDetailView } from "@/components/catalog/catalog-service-detail-view";
import { loadCatalogContext } from "@/lib/catalog-load";
import {
  filterServicesByCategory,
  getCategoryBySlug,
  isServiceCategoryId,
  type ServiceCategoryId,
} from "@/lib/service-categories";

type CatalogServiceRouteProps = {
  params: Promise<{ category: string; serviceId: string }>;
};

export async function generateMetadata(
  props: CatalogServiceRouteProps,
): Promise<Metadata> {
  const { category, serviceId } = await props.params;
  const meta = getCategoryBySlug(category);
  const ctx = await loadCatalogContext();
  const service = ctx.services.find((s) => s.id === serviceId);

  return {
    title: service?.name ?? meta?.label ?? "Service",
    description: service?.description ?? "Service details",
  };
}

export default async function CatalogServiceRoute(
  props: CatalogServiceRouteProps,
): Promise<JSX.Element> {
  const { category: categorySlug, serviceId } = await props.params;

  if (!isServiceCategoryId(categorySlug)) {
    notFound();
  }

  const categoryId: ServiceCategoryId = categorySlug;
  const ctx = await loadCatalogContext();
  const service = ctx.services.find((s) => s.id === serviceId);

  if (!service) {
    notFound();
  }

  if (categoryId !== "all") {
    const inCategory = filterServicesByCategory([service], categoryId);
    if (inCategory.length === 0) {
      notFound();
    }
  }

  return <CatalogServiceDetailView categoryId={categoryId} service={service} />;
}
