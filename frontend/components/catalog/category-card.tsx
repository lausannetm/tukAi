"use client";

import Link from "next/link";
import type { CatalogCategory } from "@/lib/service-categories";
import {
  categoryCatalogPath,
  isBrandedCategoryImage,
} from "@/lib/service-categories";

export function CategoryCard(props: {
  category: CatalogCategory;
  active?: boolean;
}): JSX.Element {
  const { category, active = false } = props;

  return (
    <Link
      href={categoryCatalogPath(category.id)}
      className={`catalog-category-card no-underline ${
        active ? "catalog-category-card--selected" : ""
      }`}
      aria-label={category.label}
      aria-current={active ? "page" : undefined}
    >
      <div className="catalog-category-card__image-wrap">
        <img
          src={category.imageUrl}
          alt=""
          className={`catalog-category-card__image${
            isBrandedCategoryImage(category.imageUrl)
              ? " catalog-category-card__image--contain"
              : ""
          }`}
          loading="lazy"
          decoding="async"
        />
      </div>    </Link>
  );
}
