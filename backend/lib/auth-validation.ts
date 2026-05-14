const EMAIL_MAX = 320;
const NAME_MAX = 200;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return uuidRegex.test(value);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseRegisterBody(raw: unknown): {
  ok: true;
  email: string;
  password: string;
  fullName: string | null;
} | {
  ok: false;
  error: string;
} {
  if (raw === null || typeof raw !== "object") {
    return { ok: false, error: "JSON body is required" };
  }
  const obj = raw as Record<string, unknown>;
  const emailRaw =
    typeof obj.email === "string" ? normalizeEmail(obj.email) : "";
  const password = typeof obj.password === "string" ? obj.password : "";
  const fullNameRaw =
    typeof obj.fullName === "string"
      ? obj.fullName.trim()
      : typeof obj.full_name === "string"
        ? obj.full_name.trim()
        : "";

  if (!emailRaw || !emailRaw.includes("@")) {
    return { ok: false, error: "A valid email is required" };
  }
  if (emailRaw.length > EMAIL_MAX) {
    return { ok: false, error: "Email is too long" };
  }
  if (password.length < PASSWORD_MIN) {
    return {
      ok: false,
      error: `Password must be at least ${PASSWORD_MIN} characters`,
    };
  }
  if (password.length > PASSWORD_MAX) {
    return { ok: false, error: "Password is too long" };
  }
  const fullName =
    fullNameRaw.length === 0
      ? null
      : fullNameRaw.length > NAME_MAX
        ? fullNameRaw.slice(0, NAME_MAX)
        : fullNameRaw;

  return { ok: true, email: emailRaw, password, fullName };
}

export function parseLoginBody(raw: unknown): {
  ok: true;
  email: string;
  password: string;
} | {
  ok: false;
  error: string;
} {
  if (raw === null || typeof raw !== "object") {
    return { ok: false, error: "JSON body is required" };
  }
  const obj = raw as Record<string, unknown>;
  const email =
    typeof obj.email === "string" ? normalizeEmail(obj.email) : "";
  const password = typeof obj.password === "string" ? obj.password : "";
  if (!email || !password) {
    return { ok: false, error: "email and password are required" };
  }
  return { ok: true, email, password };
}

export function bearerTokenFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match?.[1]) {
    return null;
  }
  return match[1].trim();
}
