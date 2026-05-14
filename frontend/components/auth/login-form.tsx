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
import { postLogin } from "@/lib/auth-api";
import { writeAuthSession } from "@/lib/auth-storage";

export function LoginForm(): JSX.Element {
  const router = useRouter();
  const toastRef = useRef<Toast>(null);
  const redirectTimerRef = useRef<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [postLoginNav, setPostLoginNav] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    setPostLoginNav(false);
    void (async (): Promise<void> => {
      setSubmitting(true);
      try {
        const result = await postLogin({
          email: email.trim(),
          password,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        writeAuthSession(result.data.token, result.data.user);
        const displayName = result.data.user.full_name?.trim();
        setPostLoginNav(true);
        toastRef.current?.show({
          severity: "success",
          summary: "Signed in",
          detail: displayName
            ? `Welcome back, ${displayName}.`
            : "Welcome back. Redirecting to the home page.",
          life: 4000,
        });
        redirectTimerRef.current = window.setTimeout(() => {
          redirectTimerRef.current = null;
          router.push("/");
        }, 900);
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
      <h1 className="mt-0 mb-4 text-2xl font-semibold text-color">Log in</h1>

      <div className="flex flex-column gap-4">
        <div className="field">
          <FloatLabel>
            <InputText
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              disabled={submitting}
              required
            />
            <label htmlFor="login-email">Email</label>
          </FloatLabel>
        </div>

        <div className="field">
          <FloatLabel>
            <Password
              inputId="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              inputClassName="w-full"
              toggleMask
              feedback={false}
              disabled={submitting}
              autoComplete="current-password"
              required
            />
            <label htmlFor="login-password">Password</label>
          </FloatLabel>
        </div>

        {error ? (
          <Message severity="error" text={error} className="w-full border-round-lg" />
        ) : null}

        <div className="flex flex-column sm:flex-row gap-2 align-items-stretch">
          <Button
            type="submit"
            label={submitting ? "Signing in…" : "Sign in"}
            icon="pi pi-sign-in"
            disabled={submitting || postLoginNav}
            loading={submitting}
            className="w-full sm:flex-1"
          />
        </div>

        <p className="m-0 text-sm text-color-secondary text-center">
          No account?{" "}
          <Link href="/register" className="font-medium no-underline">
            Register
          </Link>
        </p>
      </div>
    </form>
  );
}
