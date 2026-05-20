"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { useEffect, useMemo, useState } from "react";
import { readStoredUser } from "@/lib/auth-storage";
import { formatBookingDateLabel } from "@/lib/booking-format";
import { writePendingBooking } from "@/lib/booking-storage";
import {
  availableTimeSlotsForDay,
  startOfToday,
  toDateIso,
} from "@/lib/booking-slots";
import type { ServiceCategoryId } from "@/lib/service-categories";
import type { ServiceDTO } from "@/lib/types";

const MAX_BOOKING_DAYS_AHEAD = 90;

export function ServiceBookingDialog(props: {
  visible: boolean;
  onHide: () => void;
  service: ServiceDTO;
  categoryId: ServiceCategoryId;
}): JSX.Element {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

  const today = useMemo(() => startOfToday(), []);
  const maxDate = useMemo(() => {
    const end = new Date(today);
    end.setDate(end.getDate() + MAX_BOOKING_DAYS_AHEAD);
    return end;
  }, [today]);

  const providerLabel =
    props.service.provider_label?.trim() ||
    props.service.provider_id ||
    "the provider";

  const dateIso = selectedDate ? toDateIso(selectedDate) : null;
  const timeSlots = dateIso
    ? availableTimeSlotsForDay(props.service.id, dateIso)
    : [];

  useEffect(() => {
    if (!props.visible) {
      return;
    }
    const user = readStoredUser();
    setLoggedInUserId(user?.id ?? null);
    setSelectedDate(today);
    setSelectedTime(null);
    setMessage("");
  }, [props.visible, today]);

  useEffect(() => {
    setSelectedTime(null);
  }, [dateIso]);

  const canProceed =
    loggedInUserId !== null && dateIso !== null && selectedTime !== null;

  const handleBook = (): void => {
    if (!loggedInUserId || !dateIso || !selectedTime) {
      return;
    }
    writePendingBooking({
      serviceId: props.service.id,
      serviceName: props.service.name,
      servicePriceCents: props.service.price_cents,
      providerLabel,
      categoryId: props.categoryId,
      bookingDate: dateIso,
      bookingTime: selectedTime,
      message: message.trim(),
    });
    props.onHide();
    router.push("/payment");
  };

  return (
    <Dialog
      header={`Book: ${props.service.name}`}
      visible={props.visible}
      onHide={props.onHide}
      className="service-booking-dialog"
      style={{ width: "min(100vw - 2rem, 40rem)" }}
      modal
      dismissableMask
      blockScroll
    >
      <div className="service-booking-dialog__body flex flex-column gap-4">
        {loggedInUserId === null ? (
          <div className="flex flex-column gap-2">
            <Message
              severity="warn"
              text="Log in to book this service."
              className="w-full border-round-lg"
            />
            <Link href="/login" className="text-primary font-medium no-underline text-sm">
              Go to login
            </Link>
          </div>
        ) : null}

        <p className="m-0 text-sm text-color-secondary line-height-3">
          Message for <span className="font-medium text-color">{providerLabel}</span>{" "}
          about your booking.
        </p>

        <div className="service-booking-dialog__calendar">
          <label className="block text-sm font-medium text-color mb-2">Date</label>
          <Calendar
            value={selectedDate}
            onChange={(e) => setSelectedDate((e.value as Date | null) ?? null)}
            inline
            minDate={today}
            maxDate={maxDate}
            disabled={loggedInUserId === null}
            className="w-full"
          />
          {dateIso ? (
            <p className="m-0 mt-2 text-sm text-color-secondary">
              {formatBookingDateLabel(dateIso)}
            </p>
          ) : null}
        </div>

        {dateIso ? (
          <div>
            <label className="block text-sm font-medium text-color mb-2">
              Available times
            </label>
            <div
              className="service-booking-dialog__slots flex flex-wrap gap-2"
              role="listbox"
              aria-label="Available time slots"
            >
              {timeSlots.map((slot) => {
                const selected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={loggedInUserId === null}
                    className={
                      selected
                        ? "service-booking-dialog__slot service-booking-dialog__slot--selected"
                        : "service-booking-dialog__slot"
                    }
                    onClick={() => setSelectedTime(slot)}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="field m-0">
          <label htmlFor="booking-message" className="block text-sm font-medium text-color mb-2">
            Message to provider
          </label>
          <InputTextarea
            id="booking-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={500}
            disabled={loggedInUserId === null}
            className="w-full"
            placeholder="Introduce yourself or describe what you need…"
            autoResize
          />
        </div>

        <div className="flex flex-column sm:flex-row gap-2 justify-content-end">
          <Button
            type="button"
            label="Cancel"
            severity="secondary"
            outlined
            onClick={props.onHide}
          />
          <Button
            type="button"
            label="Book"
            icon="pi pi-arrow-right"
            iconPos="right"
            disabled={!canProceed}
            onClick={handleBook}
          />
        </div>
      </div>
    </Dialog>
  );
}
