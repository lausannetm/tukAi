"use client";

import { CategoryGrid } from "@/components/catalog/category-grid";

export function CatalogCategoriesView(): JSX.Element {
  return (
    <div className="flex-grow-1 surface-ground">
      <div className="grid p-3 sm:p-4 md:p-5">
        <div className="col-12 xl:col-10 xl:col-offset-1">
          <header className="mb-4 md:mb-5 text-center">
            <h1 className="my-8 text-9xl md:text-3xl font-semibold text-color">
              Which service category would you choose?
            </h1>
          </header>
          <CategoryGrid />
        </div>
      </div>
    </div>
  );
}
