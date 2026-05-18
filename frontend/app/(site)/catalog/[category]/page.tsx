import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogCategoryServicesView } from "@/components/catalog/catalog-category-services-view";
import { filterServicesByQuery, loadCatalogContext } from "@/lib/catalog-load";
import {
  getCategoryBySlug,
  isServiceCategoryId,
  type ServiceCategoryId,
} from "@/lib/service-categories";

type CatalogCategoryRouteProps = {
  params: Promise<{ category: string }>;
  searchParams?: Promise<{ q?: string; suggested?: string }>;
};

export async function generateMetadata(
  props: CatalogCategoryRouteProps,
): Promise<Metadata> {
  const { category } = await props.params;
  const meta = getCategoryBySlug(category);
  return {
    title: meta?.label ?? "Catalog",
    description: meta ? `${meta.label} services` : "Browse services",
  };
}

export default async function CatalogCategoryRoute(
  props: CatalogCategoryRouteProps,
): Promise<JSX.Element> {
  const { category: categorySlug } = await props.params;
  if (!isServiceCategoryId(categorySlug)) {
    notFound();
  }

  const categoryId: ServiceCategoryId = categorySlug;
  const sp = (await props.searchParams) ?? {};
  const q = sp.q;
  const suggestedRaw = sp.suggested?.trim() ?? "";

  const ctx = await loadCatalogContext();
  const filtered = filterServicesByQuery(ctx.services, q);
  const suggestedRow =
    suggestedRaw.length > 0
      ? ctx.services.find((s) => s.id === suggestedRaw)
      : undefined;
  const servicesForTable =
    suggestedRow && !filtered.some((s) => s.id === suggestedRow.id)
      ? [...filtered, suggestedRow]
      : filtered;

  return (
    <CatalogCategoryServicesView
      categoryId={categoryId}
      services={servicesForTable}
      loadError={ctx.loadError}
      suggestedServiceId={suggestedRow?.id}
      highlightServiceId={suggestedRow?.id}
    />
  );
}
