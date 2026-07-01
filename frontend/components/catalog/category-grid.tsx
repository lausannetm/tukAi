"use client";

import { CategoryCard } from "@/components/catalog/category-card";
import {
  CATALOG_CATEGORIES,
  type ServiceCategoryId,
} from "@/lib/service-categories";

export function CategoryGrid(props: {
  activeCategoryId?: ServiceCategoryId;
  title?: string;
}): JSX.Element {
  return (
    <section className="catalog-category-grid" aria-label="Service categories">
      {props.title ? (
        <h1 className="catalog-category-grid__title">{props.title}</h1>
      ) : (
        <h2 className="sr-only">Categories</h2>
      )}
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
