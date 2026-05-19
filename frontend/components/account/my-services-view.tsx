"use client";

import Link from "next/link";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useState } from "react";
import {
  formatServicePrice,
  serviceCardImageUrl,
  serviceDisplayLocation,
} from "@/lib/service-display";
import { fetchAuthMe } from "@/lib/auth-api";
import { readStoredToken } from "@/lib/auth-storage";
import type { ServiceDTO } from "@/lib/types";

export function MyServicesView(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceDTO[]>([]);

  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      setError("Log in to view your services.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async (): Promise<void> => {
      const result = await fetchAuthMe(token);
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setError(result.error);
        setServices([]);
      } else {
        setError(null);
        setServices(result.data.services);
      }
      setLoading(false);
    })();

    return (): void => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-content-center py-6">
        <ProgressSpinner aria-label="Loading your services" />
      </div>
    );
  }

  if (error) {
    return (
      <Message severity="warn" text={error} className="w-full border-round-lg" />
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-column gap-3">
        <Message
          severity="info"
          text="You have not listed any services yet."
          className="w-full border-round-lg"
        />
        <Link href="/list-service" className="text-primary font-medium no-underline">
          List a service
        </Link>
      </div>
    );
  }

  return (
    <ul className="list-none m-0 p-0 flex flex-column gap-3">
      {services.map((service) => (
        <li
          key={service.id}
          className="surface-card border-1 surface-border border-round-lg p-3 flex gap-3"
        >
          <img
            src={serviceCardImageUrl(service)}
            alt=""
            width={80}
            height={80}
            className="border-round flex-shrink-0 object-cover"
            style={{ width: "5rem", height: "5rem" }}
            loading="lazy"
            decoding="async"
          />
          <div className="min-w-0">
            <h2 className="mt-0 mb-1 text-lg font-semibold text-color">{service.name}</h2>
            <p className="m-0 mb-1 text-sm text-color-secondary">
              {serviceDisplayLocation(service)}
            </p>
            <p className="m-0 text-sm font-medium text-color">
              {formatServicePrice(service.price_cents)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
