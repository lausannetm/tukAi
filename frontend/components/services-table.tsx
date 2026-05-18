"use client";

import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import type { ServiceDTO } from "@/lib/types";

function priceBody(row: ServiceDTO): string {
  return `${(row.price_cents / 100).toFixed(2)} €`;
}

function descriptionBody(row: ServiceDTO): string {
  return row.description ?? "—";
}

function locationBody(row: ServiceDTO): string {
  return row.location?.trim() || "—";
}

function ratingBody(row: ServiceDTO): string {
  if (row.rating === null || row.rating === undefined) {
    return "—";
  }
  return `${row.rating.toFixed(2)} (${row.review_count})`;
}

export function ServicesTable(props: {
  services: ServiceDTO[];
  highlightServiceId?: string;
}): JSX.Element {
  return (
    <DataTable
      value={props.services}
      responsiveLayout="stack"
      breakpoint="768px"
      stripedRows
      emptyMessage="No services available."
      size="small"
      rowClassName={(row: ServiceDTO): string | undefined =>
        props.highlightServiceId && row.id === props.highlightServiceId
          ? "surface-highlight"
          : undefined
      }
    >
      <Column field="name" header="Name" sortable />
      <Column field="provider_label" header="Seller" sortable />
      <Column header="Location" body={locationBody} sortable sortField="location" />
      <Column header="Description" body={descriptionBody} />
      <Column header="Rating" body={ratingBody} sortable sortField="rating" />
      <Column header="Price" body={priceBody} sortable sortField="price_cents" />
      <Column
        header="ID"
        body={(row: ServiceDTO): JSX.Element => (
          <code className="text-sm" style={{ wordBreak: "break-all" }}>
            {row.id}
          </code>
        )}
      />
    </DataTable>
  );
}
