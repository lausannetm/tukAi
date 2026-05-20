import { parseDateIso } from "@/lib/booking-slots";

export function formatBookingDateLabel(dateIso: string): string {
  const date = parseDateIso(dateIso);
  if (!date) {
    return dateIso;
  }
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
