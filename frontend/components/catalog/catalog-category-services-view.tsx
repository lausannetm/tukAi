"use client";

import Link from "next/link";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { useEffect, useMemo, useState } from "react";
import { ServicesTable } from "@/components/services-table";
import type { ServiceDTO } from "@/lib/types";
import {
  filterServicesByCategory,
  getCategoryBySlug,
  type ServiceCategoryId,
} from "@/lib/service-categories";

const AI_SUGGESTION_STORAGE_KEY = "aiSearchSuggestion";

export function CatalogCategoryServicesView(props: {
  categoryId: ServiceCategoryId;
  services: ServiceDTO[];
  loadError: string | null;
  suggestedServiceId?: string;
  highlightServiceId?: string;
}): JSX.Element {
  const category = getCategoryBySlug(props.categoryId);
  const [aiReason, setAiReason] = useState<string | null>(null);

  const filteredServices = useMemo(
    () => filterServicesByCategory(props.services, props.categoryId),
    [props.services, props.categoryId],
  );

  useEffect(() => {
    if (!props.suggestedServiceId) {
      setAiReason(null);
      return;
    }
    try {
      const raw =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(AI_SUGGESTION_STORAGE_KEY)
          : null;
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as { serviceId?: string; reason?: string };
      if (
        parsed.serviceId === props.suggestedServiceId &&
        typeof parsed.reason === "string"
      ) {
        setAiReason(parsed.reason);
        window.sessionStorage.removeItem(AI_SUGGESTION_STORAGE_KEY);
      }
    } catch {
      /* ignore malformed storage */
    }
  }, [props.suggestedServiceId]);

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

          {aiReason && props.suggestedServiceId ? (
            <Message
              severity="success"
              text={aiReason}
              className="mb-3 w-full border-round-lg"
            />
          ) : null}

          <Card
            title="Services"
            className="shadow-3 mb-3 md:mb-4 border-round-lg"
          >
            <ServicesTable
              services={filteredServices}
              highlightServiceId={props.highlightServiceId}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
