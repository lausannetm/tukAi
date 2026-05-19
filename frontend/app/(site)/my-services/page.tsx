import type { Metadata } from "next";
import { MyServicesView } from "@/components/account/my-services-view";

export const metadata: Metadata = {
  title: "My services",
  description: "Services you have listed on TukAI",
};

export default function MyServicesPage(): JSX.Element {
  return (
    <div className="flex-grow-1 surface-ground px-3 sm:px-4 py-6 max-w-screen-md mx-auto">
      <header className="mb-4">
        <h1 className="mt-0 mb-2 text-2xl md:text-3xl font-semibold text-color">
          My services
        </h1>
        <p className="text-color-secondary m-0 line-height-3">
          Services you offer on the platform.
        </p>
      </header>
      <MyServicesView />
    </div>
  );
}
