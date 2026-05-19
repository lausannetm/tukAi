"use client";

import Link from "next/link";
import { Message } from "primereact/message";
import { readStoredToken } from "@/lib/auth-storage";
import { useEffect, useState } from "react";

export function UsedServicesView(): JSX.Element {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setLoggedIn(readStoredToken() !== null);
  }, []);

  if (loggedIn === null) {
    return <></>;
  }

  if (!loggedIn) {
    return (
      <Message
        severity="warn"
        text="Log in to view services you have used."
        className="w-full border-round-lg"
      />
    );
  }

  return (
    <div className="flex flex-column gap-3">
      <Message
        severity="info"
        text="Your order history will appear here once this section is connected to your account orders."
        className="w-full border-round-lg"
      />
      <Link href="/catalog" className="text-primary font-medium no-underline">
        Book a service
      </Link>
    </div>
  );
}
