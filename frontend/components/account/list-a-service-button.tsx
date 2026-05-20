"use client";

import { useRouter } from "next/navigation";
import { Button } from "primereact/button";

export function ListAServiceButton(): JSX.Element {
  const router = useRouter();

  return (
    <Button
      type="button"
      label="List a service"
      icon="pi pi-plus"
      className="my-services-panel__cta w-full"
      onClick={() => router.push("/list-service")}
    />
  );
}
