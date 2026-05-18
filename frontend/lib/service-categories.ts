import type { ServiceDTO } from "@/lib/types";

export type ServiceCategoryId =
  | "all"
  | "renovation"
  | "photography"
  | "beauty"
  | "catering"
  | "it"
  | "chefs"
  | "fun";

export type CatalogCategory = {
  id: ServiceCategoryId;
  label: string;
  imageUrl: string;
};

function localCategoryImage(categoryId: ServiceCategoryId): string {
  return `/images/categories/${categoryId}.png`;
}

export function categoryCatalogPath(categoryId: ServiceCategoryId): string {
  return `/catalog/${categoryId}`;
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  { id: "all", label: "All", imageUrl: localCategoryImage("all") },
  {
    id: "renovation",
    label: "Construction / Renovation",
    imageUrl: localCategoryImage("renovation"),
  },
  {
    id: "photography",
    label: "Photography",
    imageUrl: localCategoryImage("photography"),
  },
  {
    id: "beauty",
    label: "Beauty / Wellness",
    imageUrl: localCategoryImage("beauty"),
  },
  {
    id: "catering",
    label: "Catering",
    imageUrl: localCategoryImage("catering"),
  },
  { id: "it", label: "IT", imageUrl: localCategoryImage("it") },
  {
    id: "chefs",
    label: "Chefs",
    imageUrl: localCategoryImage("chefs"),
  },
  { id: "fun", label: "Fun", imageUrl: localCategoryImage("fun") },
];

/** Category cards that use full artwork from `/public/images/categories/`. */
export function isBrandedCategoryImage(imageUrl: string): boolean {
  return imageUrl.startsWith("/images/categories/");
}

const CATEGORY_IDS = new Set(
  CATALOG_CATEGORIES.map((c) => c.id)
);

export function isServiceCategoryId(value: string): value is ServiceCategoryId {
  return CATEGORY_IDS.has(value as ServiceCategoryId);
}

export function getCategoryBySlug(
  slug: string
): CatalogCategory | undefined {
  return CATALOG_CATEGORIES.find((c) => c.id === slug);
}

export function inferServiceCategory(
  service: ServiceDTO
): Exclude<ServiceCategoryId, "all"> | null {
  const text = `${service.name} ${service.description ?? ""}`.toLowerCase();
  const categoryLine = (service.description ?? "").match(
    /category:\s*([^.\n]+)/i
  )?.[1];
  const hint = (categoryLine ?? text).toLowerCase();

  if (
    hint.includes("renovation") ||
    hint.includes("construction") ||
    hint.includes("plaster")
  ) {
    return "renovation";
  }
  if (hint.includes("photograph") || hint.includes("photo")) {
    return "photography";
  }
  if (
    hint.includes("beauty") ||
    hint.includes("wellness") ||
    hint.includes("salon") ||
    hint.includes("makeup") ||
    hint.includes("spa") ||
    hint.includes("massage") ||
    hint.includes("yoga")
  ) {
    return "beauty";
  }
  if (hint.includes("cater") || hint.includes("banquet")) {
    return "catering";
  }
  if (
    hint.includes("api") ||
    hint.includes("llm") ||
    hint.includes("vision") ||
    hint.includes("speech") ||
    hint.includes("software") ||
    hint.includes(" it ")
  ) {
    return "it";
  }
  if (hint.includes("chef") || hint.includes("cook") || hint.includes("meal")) {
    return "chefs";
  }
  if (hint.includes("fun") || hint.includes("event") || hint.includes("party")) {
    return "fun";
  }

  return null;
}

export function filterServicesByCategory(
  services: ServiceDTO[],
  categoryId: ServiceCategoryId
): ServiceDTO[] {
  if (categoryId === "all") {
    return services;
  }
  return services.filter((s) => inferServiceCategory(s) === categoryId);
}
