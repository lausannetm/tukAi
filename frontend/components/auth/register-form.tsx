"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "primereact/button";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Password } from "primereact/password";
import { postRegister } from "@/lib/auth-api";
import { writeAuthSession } from "@/lib/auth-storage";

type RegisterNotice = { severity: "success" | "warn"; text: string };

export function RegisterForm(): JSX.Element {
  const router = useRouter();
  const redirectTimerRef = useRef<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<RegisterNotice | null>(null);

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
    setNotice(null);
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
        writeAuthSession(result.data.token, result.data.user);
        if (result.data.confirmationEmailSent) {
          setNotice({
            severity: "success",
            text: "We sent a confirmation email. In local Docker, open MailHog at http://localhost:8025 and click the link in the message.",
          });
          redirectTimerRef.current = window.setTimeout(() => {
            redirectTimerRef.current = null;
            router.push("/");
          }, 4000);
          return;
        }
        setNotice({
          severity: "warn",
          text: "Account created, but the confirmation email could not be sent. Start MailHog (`docker compose up -d mailhog`) or set SMTP_HOST=127.0.0.1 and SMTP_PORT=1025, then register again if you need the message.",
        });
        redirectTimerRef.current = window.setTimeout(() => {
          redirectTimerRef.current = null;
          router.push("/");
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

        {notice ? (
          <Message
            severity={notice.severity}
            text={notice.text}
            className="w-full border-round-lg"
          />
        ) : null}

        <Button
          type="submit"
          label={submitting ? "Creating account…" : "Register"}
          icon="pi pi-user-plus"
          disabled={submitting || notice !== null}
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
