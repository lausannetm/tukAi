export type ServiceCategoryId =
  | "all"
  | "renovation"
  | "photography"
  | "beauty"
  | "catering"
  | "it"
  | "chefs"
  | "fun";

export type ServiceForCategory = {
  name: string;
  description: string | null;
};

const CATEGORY_IDS = new Set<string>([
  "all",
  "renovation",
  "photography",
  "beauty",
  "catering",
  "it",
  "chefs",
  "fun",
]);

export function isServiceCategoryId(value: string): value is ServiceCategoryId {
  return CATEGORY_IDS.has(value);
}

/** Reads `Category: …` from a description and strips trailing `.` / price clauses. */
export function extractCategoryLabel(description: string | null): string | null {
  const match = (description ?? "").match(/category:\s*([^\n]+)/i);
  if (!match?.[1]) {
    return null;
  }

  let label = match[1].trim().toLowerCase();
  label = label.replace(/\.\s*price\b.*$/i, "").trim();
  label = label.replace(/[.,;]+$/, "").trim();
  return label.length > 0 ? label : null;
}

export function inferServiceCategory(
  service: ServiceForCategory,
): Exclude<ServiceCategoryId, "all"> | null {
  const text = `${service.name} ${service.description ?? ""}`.toLowerCase();
  const categoryLabel = extractCategoryLabel(service.description);

  if (categoryLabel) {
    const slugToken = categoryLabel.split(/[\s,/]+/)[0] ?? "";
    if (isServiceCategoryId(slugToken) && slugToken !== "all") {
      return slugToken;
    }
  }

  const hint = (categoryLabel ?? text).toLowerCase();

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
    hint === "it" ||
    /\bit\b/.test(hint) ||
    hint.includes("api") ||
    hint.includes("llm") ||
    hint.includes("vision") ||
    hint.includes("speech") ||
    hint.includes("software")
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
