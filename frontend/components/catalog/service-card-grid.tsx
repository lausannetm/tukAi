"use client";

import { ServiceCard } from "@/components/catalog/service-card";
import { serviceCatalogPath, type ServiceCategoryId } from "@/lib/service-categories";
import type { ServiceDTO } from "@/lib/types";

export function ServiceCardGrid(props: {
  categoryId: ServiceCategoryId;
  services: ServiceDTO[];
  highlightServiceId?: string;
}): JSX.Element {
  if (props.services.length === 0) {
    return (
      <p className="catalog-service-grid__empty text-color-secondary m-0">
        No services in this category yet.
      </p>
    );
  }

  return (
    <div className="catalog-service-grid" role="list">
      {props.services.map((service) => (
        <div key={service.id} className="catalog-service-grid__item" role="listitem">
          <ServiceCard
            service={service}
            href={serviceCatalogPath(props.categoryId, service.id)}
            highlighted={
              props.highlightServiceId !== undefined &&
              service.id === props.highlightServiceId
            }
          />
        </div>
      ))}
    </div>
  );
}
