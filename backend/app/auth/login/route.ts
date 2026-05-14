import { NextResponse } from "next/server";
import { signAccessToken } from "@/lib/auth-jwt";
import { verifyPassword } from "@/lib/auth-password";
import {
  findUserWithSecretByEmail,
  mapUserPublicToJson,
} from "@/lib/auth-user-db";
import { parseLoginBody } from "@/lib/auth-validation";

const GENERIC_LOGIN_ERROR = "Invalid email or password";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const raw = await request.json();
    const parsed = parseLoginBody(raw);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const row = await findUserWithSecretByEmail(parsed.email);
    if (!row?.password_hash) {
      return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 });
    }

    const ok = await verifyPassword(parsed.password, row.password_hash);
    if (!ok) {
      return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 });
    }

    if (!row.email_verified_at) {
      return NextResponse.json(
        {
          error:
            "Please confirm your email before logging in. If you just registered, use the link we sent you (in local dev, check MailHog).",
        },
        { status: 403 }
      );
    }

    const token = await signAccessToken(row.id);

    return NextResponse.json({
      token,
      user: mapUserPublicToJson(row),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to log in";
    if (message === "JWT_SECRET is not set") {
      return NextResponse.json(
        { error: "Server auth is not configured" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
