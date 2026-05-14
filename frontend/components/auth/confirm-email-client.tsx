"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { getConfirmEmail } from "@/lib/auth-api";
import { writeAuthSession } from "@/lib/auth-storage";

function readConfirmTokenFromUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return (
    new URLSearchParams(window.location.search).get("token")?.trim() ?? ""
  );
}

export function ConfirmEmailClient(): JSX.Element {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle"
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const token = readConfirmTokenFromUrl();
    if (!token) {
      setStatus("err");
      setMessage("Missing token in the link. Use the link from your email.");
      return;
    }

    const ac = new AbortController();
    let cancelled = false;

    setStatus("loading");
    void (async (): Promise<void> => {
      try {
        const result = await getConfirmEmail(token, ac.signal);
        if (cancelled) {
          return;
        }
        if (!result.ok) {
          setStatus("err");
          setMessage(result.error);
          return;
        }
        writeAuthSession(result.data.token, result.data.user);
        setStatus("ok");
        setMessage(
          `Your email ${result.data.email} is confirmed. You are signed in — redirecting home…`
        );
        window.setTimeout(() => {
          if (!cancelled) {
            router.push("/");
          }
        }, 1200);
      } catch (err) {
        if (
          cancelled ||
          (err instanceof DOMException && err.name === "AbortError")
        ) {
          return;
        }
        setStatus("err");
        setMessage(
          err instanceof Error ? err.message : "Could not confirm email"
        );
      }
    })();

    return (): void => {
      cancelled = true;
      ac.abort();
    };
  }, [router]);

  return (
    <div className="surface-card border-round-xl shadow-2 p-4 sm:p-5 max-w-md mx-auto w-full">
      <h1 className="mt-0 mb-4 text-2xl font-semibold text-color">
        Email confirmation
      </h1>

      {status === "idle" || status === "loading" ? (
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
