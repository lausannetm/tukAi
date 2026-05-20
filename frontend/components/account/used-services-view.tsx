"use client";

import Link from "next/link";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useState } from "react";
import { fetchUserOrders } from "@/lib/api";
import { formatBookingDateLabel } from "@/lib/booking-format";
import { readStoredToken, readStoredUser } from "@/lib/auth-storage";
import { orderServiceToServiceDto } from "@/lib/order-display";
import {
  formatServicePrice,
  serviceCardImageUrl,
  serviceDisplayLocation,
} from "@/lib/service-display";
import { serviceDetailCatalogPath } from "@/lib/service-categories";
import type { OrderDTO } from "@/lib/types";

export function UsedServicesView(): JSX.Element {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderDTO[]>([]);

  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      setLoggedIn(false);
      return;
    }
    setLoggedIn(true);

    const user = readStoredUser();
    if (!user) {
      setError("Could not read your account. Try logging in again.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async (): Promise<void> => {
      try {
        const rows = await fetchUserOrders(user.id);
        if (!cancelled) {
          setError(null);
          setOrders(rows);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load used services.");
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return (): void => {
      cancelled = true;
    };
  }, []);

  if (loggedIn === null) {
    return <></>;
  }

  if (!loggedIn) {
    return (
      <Message
        severity="warn"
        text="Log in to view services you have used."
        className="w-full border-round-lg"
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-content-center py-6">
        <ProgressSpinner aria-label="Loading used services" />
      </div>
    );
  }

  if (error) {
    return (
      <Message severity="warn" text={error} className="w-full border-round-lg" />
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-column gap-3">
        <Message
          severity="info"
          text="You have not booked any services yet."
          className="w-full border-round-lg"
        />
        <Link href="/catalog" className="text-primary font-medium no-underline">
          Book a service
        </Link>
      </div>
    );
  }

  return (
    <ul className="list-none m-0 p-0 flex flex-column gap-3">
      {orders.map((order) => {
        const summary = order.service;
        if (!summary) {
          return null;
        }
        const service = orderServiceToServiceDto(order, summary);

        return (
          <li key={order.id}>
            <Link
              href={serviceDetailCatalogPath(service)}
              className="used-services-card surface-card border-1 surface-border border-round-lg p-3 flex gap-3 no-underline text-inherit"
              aria-label={`View ${service.name}`}
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
              <div className="min-w-0 flex-grow-1">
                <h2 className="mt-0 mb-1 text-lg font-semibold text-color">{service.name}</h2>
                <p className="m-0 mb-1 text-sm text-color-secondary">
                  {serviceDisplayLocation(service)}
                </p>
                {order.booking_date && order.booking_time ? (
                  <p className="m-0 mb-1 text-sm text-color">
                    {formatBookingDateLabel(order.booking_date)} · {order.booking_time}
                  </p>
                ) : null}
                {order.message_to_provider ? (
                  <p className="m-0 mb-1 text-sm text-color-secondary line-height-3 used-services-card__message">
                    {order.message_to_provider}
                  </p>
                ) : null}
                <p className="m-0 text-sm font-medium text-color">
                  {formatServicePrice(service.price_cents)}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
