import type { Metadata } from "next";
import { CatalogCategoriesView } from "@/components/catalog/catalog-categories-view";

export const metadata: Metadata = {
  title: "Catalog",
  description: "Browse service categories",
};

export default function CatalogRoute(): JSX.Element {
  return <CatalogCategoriesView />;
}
