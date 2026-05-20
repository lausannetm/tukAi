"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useState, useTransition } from "react";
import { postOrder } from "@/lib/api";
import { readStoredUser } from "@/lib/auth-storage";
import { formatBookingDateLabel } from "@/lib/booking-format";
import {
  clearPendingBooking,
  readPendingBooking,
} from "@/lib/booking-storage";
import { formatServicePrice } from "@/lib/service-display";
import { categoryCatalogPath } from "@/lib/service-categories";

export function PaymentConfirmationView(): JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState(readPendingBooking());

  useEffect(() => {
    const user = readStoredUser();
    setUserId(user?.id ?? null);
    setDraft(readPendingBooking());
    setReady(true);
  }, []);

  const handleConfirm = (): void => {
    if (!draft || !userId) {
      return;
    }
    setError(null);
    startTransition(() => {
      void (async (): Promise<void> => {
        try {
          await postOrder({
            userId,
            serviceId: draft.serviceId,
            quantity: 1,
            status: "confirmed",
            bookingDate: draft.bookingDate,
            bookingTime: draft.bookingTime,
            messageToProvider: draft.message,
          });
          clearPendingBooking();
          router.push("/used-services");
        } catch (e) {
          const message =
            e instanceof Error ? e.message : "Could not confirm booking.";
          setError(message);
        }
      })();
    });
  };

  if (!ready) {
    return (
      <div className="flex justify-content-center py-6">
        <ProgressSpinner aria-label="Loading booking" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex flex-column gap-3">
        <Message
          severity="warn"
          text="Log in to complete your booking."
          className="w-full border-round-lg"
        />
        <Link href="/login" className="text-primary font-medium no-underline">
          Log in
        </Link>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex flex-column gap-3">
        <Message
          severity="info"
          text="No booking in progress. Choose a service and pick a date and time."
          className="w-full border-round-lg"
        />
        <Link href="/catalog" className="text-primary font-medium no-underline">
          Browse catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="payment-confirmation surface-card border-1 surface-border border-round-lg p-4 md:p-5">
      <h2 className="mt-0 mb-4 text-xl font-semibold text-color">Confirm your booking</h2>

      <dl className="payment-confirmation__summary m-0 mb-4">
        <div className="payment-confirmation__row">
          <dt>Service</dt>
          <dd>{draft.serviceName}</dd>
        </div>
        <div className="payment-confirmation__row">
          <dt>Provider</dt>
          <dd>{draft.providerLabel}</dd>
        </div>
        <div className="payment-confirmation__row">
          <dt>Date</dt>
          <dd>{formatBookingDateLabel(draft.bookingDate)}</dd>
        </div>
        <div className="payment-confirmation__row">
          <dt>Time</dt>
          <dd>{draft.bookingTime}</dd>
        </div>
        <div className="payment-confirmation__row">
          <dt>Price</dt>
          <dd>{formatServicePrice(draft.servicePriceCents)}</dd>
        </div>
        <div className="payment-confirmation__row payment-confirmation__row--message">
          <dt>Your message</dt>
          <dd>{draft.message}</dd>
        </div>
      </dl>

      <p className="text-sm text-color-secondary m-0 mb-4 line-height-3">
        Review the details above. Confirming creates your booking and adds this service to
        Used services.
      </p>

      {error ? (
        <Message severity="error" text={error} className="w-full border-round-lg mb-3" />
      ) : null}

      <div className="flex flex-column sm:flex-row justify-content-between">
        <Button
          type="button"
          label="Back"
          severity="secondary"
          disabled={pending}
          onClick={() => router.push(categoryCatalogPath(draft.categoryId))}
          className="button-secondary"
        />
        <Button
          type="button"
          label={pending ? "Confirming…" : "Confirm"}
          icon="pi pi-check"
          loading={pending}
          disabled={pending}
          onClick={handleConfirm}
        />
      </div>
    </div>
  );
}
