"use client";

import { useRouter } from "next/navigation";
import { Button } from "primereact/button";

export function BookAnotherServiceButton(): JSX.Element {
  const router = useRouter();

  return (
    <Button
      type="button"
      label="Book another service"
      icon="pi pi-arrow-right"
      iconPos="right"
      className="used-services-panel__cta w-full"
      onClick={() => router.push("/catalog")}
    />
  );
}
