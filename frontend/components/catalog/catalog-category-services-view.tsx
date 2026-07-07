"use client";

import Link from "next/link";
import { Message } from "primereact/message";
import { useEffect, useMemo, useState } from "react";
import { ServiceCardGrid } from "@/components/catalog/service-card-grid";
import type { ServiceDTO } from "@/lib/types";
import {
  filterServicesByCategory,
  getCategoryBySlug,
  type ServiceCategoryId,
} from "@/lib/service-categories";

const AI_SUGGESTION_STORAGE_KEY = "aiSearchSuggestion";

type AiSuggestionStorage = {
  matchIds?: string[];
  items?: Array<{ serviceId?: string; reason?: string }>;
  serviceId?: string;
  reason?: string;
};

function readAiSuggestionMessage(
  suggestedServiceIds: string[],
): string | null {
  if (suggestedServiceIds.length === 0) {
    return null;
  }
  try {
    const raw =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem(AI_SUGGESTION_STORAGE_KEY)
        : null;
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AiSuggestionStorage;
    const matchIds =
      parsed.matchIds ??
      (parsed.serviceId ? [parsed.serviceId] : suggestedServiceIds);
    const idsMatch =
      matchIds.length === suggestedServiceIds.length &&
      matchIds.every((id, index) => id === suggestedServiceIds[index]);
    if (!idsMatch) {
      return null;
    }
    if (Array.isArray(parsed.items) && parsed.items.length > 0) {
      if (parsed.items.length === 1) {
        const reason = parsed.items[0]?.reason;
        return typeof reason === "string" ? reason : null;
      }
      return `Found ${parsed.items.length} services matching your search.`;
    }
    return typeof parsed.reason === "string" ? parsed.reason : null;
  } catch {
    return null;
  }
}

export function CatalogCategoryServicesView(props: {
  categoryId: ServiceCategoryId;
  services: ServiceDTO[];
  loadError: string | null;
  suggestedServiceIds?: string[];
  highlightServiceIds?: string[];
}): JSX.Element {
  const category = getCategoryBySlug(props.categoryId);
  const [aiReason, setAiReason] = useState<string | null>(null);
  const suggestedServiceIds = props.suggestedServiceIds ?? [];
  const highlightServiceIds =
    props.highlightServiceIds ?? suggestedServiceIds;

  const filteredServices = useMemo(() => {
    const categoryServices = filterServicesByCategory(
      props.services,
      props.categoryId,
    );
    if (suggestedServiceIds.length === 0) {
      return categoryServices;
    }
    const byId = new Map(categoryServices.map((service) => [service.id, service]));
    const suggested = suggestedServiceIds.flatMap((id) => {
      const service = byId.get(id);
      return service ? [service] : [];
    });
    if (suggested.length > 0) {
      return suggested;
    }
    return categoryServices;
  }, [props.services, props.categoryId, suggestedServiceIds]);

  useEffect(() => {
    if (suggestedServiceIds.length === 0) {
      setAiReason(null);
      return;
    }
    const reason = readAiSuggestionMessage(suggestedServiceIds);
    if (reason) {
      setAiReason(reason);
      window.sessionStorage.removeItem(AI_SUGGESTION_STORAGE_KEY);
    }
  }, [suggestedServiceIds]);

  return (
    <div className="flex-grow-1 surface-ground">
      <div className="grid p-3 sm:p-4 md:p-5">
        <div className="col-12 xl:col-10 xl:col-offset-1">
          <header className="mb-4 md:mb-5">
            <Link
              href="/catalog"
              className="text-sm text-primary font-medium no-underline mb-2 inline-block"
            >
              ← All categories
            </Link>
            <h1 className="mt-0 mb-2 text-2xl md:text-3xl font-semibold text-color">
              {category?.label ?? props.categoryId}
            </h1>
          </header>

          {props.loadError ? (
            <Message
              severity="error"
              text={props.loadError}
              className="mb-3 w-full border-round-lg"
            />
          ) : null}

          {aiReason && suggestedServiceIds.length > 0 ? (
            <Message
              severity="success"
              text={aiReason}
              className="mb-3 w-full border-round-lg"
            />
          ) : null}

          <section className="catalog-services-section" aria-label="Services">
            <ServiceCardGrid
              categoryId={props.categoryId}
              services={filteredServices}
              highlightServiceIds={highlightServiceIds}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
