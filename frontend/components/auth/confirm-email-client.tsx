"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { getConfirmEmail } from "@/lib/auth-api";

export function ConfirmEmailClient(): JSX.Element {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle"
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("err");
      setMessage("Missing token in the link. Use the link from your email.");
      return;
    }

    setStatus("loading");
    void (async (): Promise<void> => {
      const result = await getConfirmEmail(token);
      if (!result.ok) {
        setStatus("err");
        setMessage(result.error);
        return;
      }
      setStatus("ok");
      setMessage(`Your email ${result.data.email} is confirmed.`);
    })();
  }, [token]);

  return (
    <div className="surface-card border-round-xl shadow-2 p-4 sm:p-5 max-w-md mx-auto w-full">
      <h1 className="mt-0 mb-4 text-2xl font-semibold text-color">
        Email confirmation
      </h1>

      {status === "loading" ? (
        <p className="text-color-secondary m-0">Confirming…</p>
      ) : null}

      {status === "ok" ? (
        <Message
          severity="success"
          text={message}
          className="w-full border-round-lg mb-3"
        />
      ) : null}

      {status === "err" ? (
        <Message
          severity="error"
          text={message}
          className="w-full border-round-lg mb-3"
        />
      ) : null}

      <Link href="/login" className="no-underline">
        <Button
          type="button"
          label="Go to log in"
          icon="pi pi-sign-in"
          className="w-full sm:w-auto"
        />
      </Link>
    </div>
  );
}
