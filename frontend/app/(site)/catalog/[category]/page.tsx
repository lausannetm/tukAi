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
    title: meta?.label ?? "Book a service",
    description: meta ? `${meta.label} services` : "Browse services",
  };
}

function parseSuggestedIds(raw: string): string[] {
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
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
  const suggestedIds = parseSuggestedIds(sp.suggested?.trim() ?? "");

  const ctx = await loadCatalogContext();
  const filtered = filterServicesByQuery(ctx.services, q);
  const suggestedRows = suggestedIds.flatMap((id) => {
    const row = ctx.services.find((service) => service.id === id);
    return row ? [row] : [];
  });
  const servicesForTable =
    suggestedRows.length > 0
      ? suggestedRows
      : filtered;

  return (
    <CatalogCategoryServicesView
      categoryId={categoryId}
      services={servicesForTable}
      loadError={ctx.loadError}
      suggestedServiceIds={suggestedRows.map((row) => row.id)}
      highlightServiceIds={suggestedRows.map((row) => row.id)}
    />
  );
}
