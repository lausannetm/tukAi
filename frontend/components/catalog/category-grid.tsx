"use client";

import { CategoryCard } from "@/components/catalog/category-card";
import {
  CATALOG_CATEGORIES,
  type ServiceCategoryId,
} from "@/lib/service-categories";

export function CategoryGrid(props: {
  activeCategoryId?: ServiceCategoryId;
}): JSX.Element {
  return (
    <section
      className="catalog-category-grid"
      aria-label="Service categories"
    >
      <h2 className="sr-only">Categories</h2>
      <div className="catalog-category-grid__inner">
        {CATALOG_CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            active={props.activeCategoryId === category.id}
          />
        ))}
      </div>
    </section>
  );
}
