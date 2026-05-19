import type { Metadata } from "next";
import { UsedServicesView } from "@/components/account/used-services-view";

export const metadata: Metadata = {
  title: "Used services",
  description: "Services you have booked or ordered on TukAI",
};

export default function UsedServicesPage(): JSX.Element {
  return (
    <div className="flex-grow-1 surface-ground px-3 sm:px-4 py-6 max-w-screen-md mx-auto">
      <header className="mb-4">
        <h1 className="mt-0 mb-2 text-2xl md:text-3xl font-semibold text-color">
          Used services
        </h1>
        <p className="text-color-secondary m-0 line-height-3">
          Services you have booked through TukAI.
        </p>
      </header>
      <UsedServicesView />
    </div>
  );
}
