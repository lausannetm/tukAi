import type { PendingBookingDraft } from "@/lib/booking-types";

const PENDING_BOOKING_KEY = "tukai_pending_booking";

function isPendingBookingDraft(value: unknown): value is PendingBookingDraft {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.serviceId === "string" &&
    typeof row.serviceName === "string" &&
    typeof row.servicePriceCents === "number" &&
    typeof row.providerLabel === "string" &&
    typeof row.categoryId === "string" &&
    typeof row.bookingDate === "string" &&
    typeof row.bookingTime === "string" &&
    typeof row.message === "string"
  );
}

export function writePendingBooking(draft: PendingBookingDraft): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(draft));
}

export function readPendingBooking(): PendingBookingDraft | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.sessionStorage.getItem(PENDING_BOOKING_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return isPendingBookingDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingBooking(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(PENDING_BOOKING_KEY);
}
