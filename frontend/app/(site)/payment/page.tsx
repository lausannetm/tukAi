import type { Metadata } from "next";
import { PaymentConfirmationView } from "@/components/booking/payment-confirmation-view";

export const metadata: Metadata = {
  title: "Confirm booking",
  description: "Review and confirm your service booking",
};

export default function PaymentPage(): JSX.Element {
  return (
    <div className="flex-grow-1 surface-ground px-3 sm:px-4 py-6 max-w-screen-md mx-auto">
      <header className="mb-4">
        <h1 className="mt-0 mb-2 text-2xl md:text-3xl font-semibold text-color">
          Payment & confirmation
        </h1>
        <p className="text-color-secondary m-0 line-height-3">
          Review your booking details before confirming.
        </p>
      </header>
      <PaymentConfirmationView />
    </div>
  );
}
