import type { Metadata } from "next";
import { CreateServiceForm } from "@/components/services/create-service-form";

export const metadata: Metadata = {
  title: "List a service",
  description: "Add a service you offer with a photo, price, and location",
};

export default function ListServicePage(): JSX.Element {
  return (
    <div className="flex-grow-1 surface-ground px-3 sm:px-4 py-6 max-w-screen-md mx-auto">
      <header className="mb-4">
        <h1 className="mt-0 mb-2 text-2xl md:text-3xl font-semibold text-color">
          List a service
        </h1>
        <p className="text-color-secondary m-0 line-height-3">
          Every listing needs a photo. Upload an image, then fill in the details for
          your offer.
        </p>
      </header>
      <CreateServiceForm />
    </div>
  );
}
