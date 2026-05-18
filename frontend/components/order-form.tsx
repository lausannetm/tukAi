"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { FloatLabel } from "primereact/floatlabel";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { readStoredUser } from "@/lib/auth-storage";
import type { SubmitOrderFn } from "@/lib/submit-order-fn";
import type { ServiceDTO } from "@/lib/types";

type ServiceOption = { label: string; value: string };

export function OrderForm(props: {
  services: ServiceDTO[];
  demoUserId: string;
  submitOrderForm: SubmitOrderFn;
  initialServiceId?: string;
}): JSX.Element {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [userId, setUserId] = useState(props.demoUserId);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [usingStoredUser, setUsingStoredUser] = useState(false);

  useEffect(() => {
    const stored = readStoredUser();
    if (stored) {
      setUserId(stored.id);
      setUsingStoredUser(true);
    }
  }, []);

  const purchasableServices = useMemo(() => {
    const uid = userId.trim().toLowerCase();
    if (!uid) {
      return props.services;
    }
    return props.services.filter((s) => {
      const pid = s.provider_id?.trim().toLowerCase();
      if (!pid) {
        return true;
      }
      return pid !== uid;
    });
  }, [props.services, userId]);

  const options: ServiceOption[] = useMemo(
    () =>
      purchasableServices.map((service) => {
        const seller =
          service.provider_label?.trim() || service.provider_id || "Seller";
        return {
          label: `${service.name} — ${(service.price_cents / 100).toFixed(2)} € (${seller})`,
          value: service.id,
        };
      }),
    [purchasableServices]
  );

  useEffect(() => {
    if (purchasableServices.length === 0) {
      setServiceId(null);
      return;
    }
    const preferredId = props.initialServiceId?.trim();
    if (
      preferredId &&
      purchasableServices.some((s) => s.id === preferredId) &&
      serviceId !== preferredId
    ) {
      setServiceId(preferredId);
      return;
    }
    if (serviceId === null) {
      setServiceId(purchasableServices[0].id);
      return;
    }
    if (!purchasableServices.some((s) => s.id === serviceId)) {
      setServiceId(purchasableServices[0].id);
    }
  }, [purchasableServices, serviceId, props.initialServiceId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setResult(null);
    const formData = new FormData();
    formData.set("userId", userId.trim());
    formData.set("serviceId", serviceId ?? "");
    formData.set("quantity", String(quantity));

    startTransition(() => {
      void (async (): Promise<void> => {
        const response = await props.submitOrderForm(formData);
        if (response.ok) {
          setResult(
            `Order ${response.order.id} created (${response.order.quantity}×).`
          );
        } else {
          setResult(response.error);
        }
      })();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid formgrid p-fluid gap-3">
      <div className="field col-12 md:col-6">
        <FloatLabel>
          <InputText
            id="userId"
            name="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            disabled={pending}
            className="w-full"
            style={{ fontFamily: "ui-monospace, monospace" }}
          />
          <label htmlFor="userId">User ID (UUID)</label>
        </FloatLabel>
        <small className="text-color-secondary block mt-2">
          {usingStoredUser
            ? "Using your logged-in account ID. You can override the UUID if needed. Your own listings are hidden from the service list."
            : "Seeded demo user from the database script. Your own listings are hidden from the service list."}
        </small>
      </div>

      <div className="field col-12 md:col-6">
        <FloatLabel>
          <Dropdown
            inputId="serviceId"
            name="serviceId"
            value={serviceId}
            onChange={(e) => setServiceId(e.value as string | null)}
            options={options}
            optionLabel="label"
            optionValue="value"
            placeholder="Select a service"
            disabled={pending || options.length === 0}
            className="w-full"
            filter={options.length > 6}
          />
          <label htmlFor="serviceId">Service</label>
        </FloatLabel>
      </div>

      <div className="field col-12 sm:col-6 md:col-4">
        <FloatLabel>
          <InputNumber
            inputId="quantity"
            name="quantity"
            value={quantity}
            onValueChange={(e) => setQuantity(e.value ?? 1)}
            min={1}
            step={1}
            showButtons
            disabled={pending}
            className="w-full"
            useGrouping={false}
          />
          <label htmlFor="quantity">Quantity</label>
        </FloatLabel>
      </div>

      <div className="col-12 flex flex-column sm:flex-row gap-2 align-items-stretch sm:align-items-center">
        <Button
          type="submit"
          label={pending ? "Submitting…" : "Place order"}
          icon="pi pi-shopping-cart"
          disabled={pending || options.length === 0}
          loading={pending}
        />
      </div>

      {result ? (
        <div className="col-12">
          <Message
            severity={result.startsWith("Order ") ? "success" : "error"}
            text={result}
            className="w-full border-round-lg"
          />
        </div>
      ) : null}
    </form>
  );
}
