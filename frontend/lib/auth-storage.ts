import type { UserPublicDTO } from "@/lib/auth-types";

export const AUTH_TOKEN_KEY = "uglugai_jwt";
export const AUTH_USER_KEY = "uglugai_user";

export function readStoredUser(): UserPublicDTO | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "id" in parsed &&
      "email" in parsed &&
      typeof (parsed as { id: unknown }).id === "string" &&
      typeof (parsed as { email: unknown }).email === "string"
    ) {
      const u = parsed as UserPublicDTO;
      return {
        id: u.id,
        email: u.email,
        full_name:
          "full_name" in u &&
          (u.full_name === null || typeof u.full_name === "string")
            ? u.full_name
            : null,
        created_at:
          typeof u.created_at === "string" ? u.created_at : new Date().toISOString(),
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function readStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function writeAuthSession(token: string, user: UserPublicDTO): void {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}
