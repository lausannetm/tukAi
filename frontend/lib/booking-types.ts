import type { ServiceCategoryId } from "@/lib/service-categories";

export type PendingBookingDraft = {
  serviceId: string;
  serviceName: string;
  servicePriceCents: number;
  providerLabel: string;
  categoryId: ServiceCategoryId;
  bookingDate: string;
  bookingTime: string;
  message: string;
};
