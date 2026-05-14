"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "primereact/button";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import { postRegister } from "@/lib/auth-api";

export function RegisterForm(): JSX.Element {
  const router = useRouter();
  const toastRef = useRef<Toast>(null);
  const redirectTimerRef = useRef<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** PrimeToast defaults to `appendTo="self"`; portaling to body avoids clipping under shell/layout. */
  const [toastAppendTo, setToastAppendTo] = useState<HTMLElement | "self">("self");

  useEffect(() => {
    setToastAppendTo(document.body);
  }, []);

  useEffect(() => {
    return (): void => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setError(null);
    setPendingRedirect(false);
    void (async (): Promise<void> => {
      setSubmitting(true);
      try {
        const result = await postRegister({
          email: email.trim(),
          password,
          fullName: fullName.trim() || undefined,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (result.data.confirmationEmailSent) {
          setPendingRedirect(true);
          toastRef.current?.show({
            severity: "success",
            summary: "Confirmation email sent",
            detail:
              "Confirmation email is sent. You can log in after you confirm your email.",
            life: 10000,
          });
          redirectTimerRef.current = window.setTimeout(() => {
            redirectTimerRef.current = null;
            router.push("/login");
          }, 4000);
          return;
        }
        setPendingRedirect(true);
        toastRef.current?.show({
          severity: "warn",
          summary: "Account created — email not sent",
          detail:
            "Start MailHog (`docker compose up -d mailhog`) or set SMTP_HOST=127.0.0.1 and SMTP_PORT=1025. You can log in only after you confirm your email.",
          life: 10000,
        });
        redirectTimerRef.current = window.setTimeout(() => {
          redirectTimerRef.current = null;
          router.push("/login");
        }, 5000);
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="surface-card border-round-xl shadow-2 p-4 sm:p-5 max-w-md mx-auto w-full"
    >
      <Toast ref={toastRef} position="top-center" appendTo={toastAppendTo} />
      <h1 className="mt-0 mb-4 text-2xl font-semibold text-color">Create account</h1>

      <div className="flex flex-column gap-4">
        <div className="field">
          <FloatLabel>
            <InputText
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              disabled={submitting}
              required
            />
            <label htmlFor="register-email">Email</label>
          </FloatLabel>
        </div>

        <div className="field">
          <FloatLabel>
            <InputText
              id="register-full-name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full"
              disabled={submitting}
            />
            <label htmlFor="register-full-name">Full name (optional)</label>
          </FloatLabel>
        </div>

        <div className="field">
          <FloatLabel>
            <Password
              inputId="register-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              inputClassName="w-full"
              toggleMask
              disabled={submitting}
              autoComplete="new-password"
              required
            />
            <label htmlFor="register-password">Password (min. 8 characters)</label>
          </FloatLabel>
        </div>

        {error ? (
          <Message severity="error" text={error} className="w-full border-round-lg" />
        ) : null}

        <Button
          type="submit"
          label={submitting ? "Creating account…" : "Register"}
          icon="pi pi-user-plus"
          disabled={submitting || pendingRedirect}
          loading={submitting}
          className="w-full"
        />

        <p className="m-0 text-sm text-color-secondary text-center">
          Already have an account?{" "}
          <Link href="/login" className="font-medium no-underline">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
