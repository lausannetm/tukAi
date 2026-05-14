import type { AuthMeResponse, AuthTokenResponse } from "@/lib/auth-types";
import { backendPublicOrigin } from "@/lib/public-backend";

/**
 * Call the REST API from the browser (cross-origin). Requires backend CORS on `/auth/*`.
 * Use `NEXT_PUBLIC_BACKEND_PUBLIC_URL` (e.g. http://localhost:3001) — not the frontend port.
 */
function authApiBase(): string {
  return backendPublicOrigin();
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorMessage(body: unknown, fallback: string): string {
  if (
    body !== null &&
    typeof body === "object" &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "string"
  ) {
    return (body as { error: string }).error;
  }
  return fallback;
}

export async function postRegister(payload: {
  email: string;
  password: string;
  fullName?: string;
}): Promise<{ ok: true; data: AuthTokenResponse } | { ok: false; error: string }> {
  const response = await fetch(`${authApiBase()}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName?.trim() || undefined,
    }),
  });
  const body = await parseJson(response);
  if (!response.ok) {
    return {
      ok: false,
      error: errorMessage(body, `Registration failed (${response.status})`),
    };
  }
  const rawData = body as AuthTokenResponse;
  const data: AuthTokenResponse = {
    ...rawData,
    confirmationEmailSent:
      typeof rawData.confirmationEmailSent === "boolean"
        ? rawData.confirmationEmailSent
        : false,
  };
  return { ok: true, data };
}

export async function postLogin(payload: {
  email: string;
  password: string;
}): Promise<{ ok: true; data: AuthTokenResponse } | { ok: false; error: string }> {
  const response = await fetch(`${authApiBase()}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  });
  const body = await parseJson(response);
  if (!response.ok) {
    return {
      ok: false,
      error: errorMessage(body, `Login failed (${response.status})`),
    };
  }
  return { ok: true, data: body as AuthTokenResponse };
}

export async function fetchAuthMe(token: string): Promise<
  | { ok: true; data: AuthMeResponse }
  | { ok: false; error: string }
> {
  const response = await fetch(`${authApiBase()}/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const body = await parseJson(response);
  if (!response.ok) {
    return {
      ok: false,
      error: errorMessage(body, `Could not load profile (${response.status})`),
    };
  }
  return { ok: true, data: body as AuthMeResponse };
}

export type ConfirmEmailResponse = { ok: true; email: string };

export async function getConfirmEmail(token: string): Promise<
  | { ok: true; data: ConfirmEmailResponse }
  | { ok: false; error: string }
> {
  const q = new URLSearchParams({ token });
  const response = await fetch(
    `${authApiBase()}/auth/confirm-email?${q.toString()}`,
    { method: "GET" }
  );
  const body = await parseJson(response);
  if (!response.ok) {
    return {
      ok: false,
      error: errorMessage(
        body,
        `Email confirmation failed (${response.status})`
      ),
    };
  }
  return { ok: true, data: body as ConfirmEmailResponse };
}
