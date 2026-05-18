"use client";

import Link from "next/link";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { useEffect, useState } from "react";
import type { ServiceDTO } from "@/lib/types";
import type { SubmitOrderFn } from "@/lib/submit-order-fn";
import { OrderForm } from "@/components/order-form";
import { ServicesTable } from "@/components/services-table";

const AI_SUGGESTION_STORAGE_KEY = "aiSearchSuggestion";

export function CatalogPage(props: {
  services: ServiceDTO[];
  loadError: string | null;
  swaggerUrl: string;
  publicOrigin: string;
  demoUserId: string;
  submitOrderForm: SubmitOrderFn;
  showServices?: boolean;
  showOrderForm?: boolean;
  suggestedServiceId?: string;
  highlightServiceId?: string;
  initialServiceId?: string;
}): JSX.Element {
  const showServices = props.showServices ?? true;
  const showOrderForm = props.showOrderForm ?? true;
  const [aiReason, setAiReason] = useState<string | null>(null);

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
          <Card className="shadow-3 mb-3 md:mb-4 border-round-lg">
            <div className="flex flex-column gap-2 pb-3 border-bottom-1 surface-border">
              <h1 className="m-0 text-2xl md:text-3xl font-bold">
                AI services catalog
              </h1>
              <p className="text-color-secondary m-0 text-sm md:text-base line-height-3">
                Data from{" "}
                <code className="text-sm border-round px-2 py-1 surface-100 border-1 surface-border">
                  {props.publicOrigin}
                </code>
                . OpenAPI is available in{" "}
                <Link href={props.swaggerUrl} className="font-semibold">
                  Swagger UI
                </Link>
                .
              </p>
            </div>
          </Card>

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

          {showServices ? (
            <Card
              title="Services"
              className="shadow-3 mb-3 md:mb-4 border-round-lg"
            >
              <ServicesTable
                services={props.services}
                highlightServiceId={props.highlightServiceId}
              />
            </Card>
          ) : null}

          {showOrderForm ? (
            <Card
              title="Place an order"
              className="shadow-3 border-round-lg mb-6"
            >
              <OrderForm
                services={props.services}
                demoUserId={props.demoUserId}
                submitOrderForm={props.submitOrderForm}
                initialServiceId={props.initialServiceId}
              />
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
