import { NextResponse } from "next/server";
import { signAccessToken } from "@/lib/auth-jwt";
import { hashPassword } from "@/lib/auth-password";
import {
  insertRegisteredUser,
  mapUserPublicToJson,
  setUserEmailConfirmationChallenge,
} from "@/lib/auth-user-db";
import { parseRegisterBody } from "@/lib/auth-validation";
import {
  generateEmailConfirmationToken,
  hashEmailConfirmationToken,
} from "@/lib/email-confirmation-crypto";
import { sendRegistrationConfirmationEmail } from "@/lib/mail";

const CONFIRM_HOURS = 48;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const raw = await request.json();
    const parsed = parseRegisterBody(raw);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const passwordHash = await hashPassword(parsed.password);
    const user = await insertRegisteredUser({
      email: parsed.email,
      passwordHash,
      fullName: parsed.fullName,
    });
    const token = await signAccessToken(user.id);

    const plainToken = generateEmailConfirmationToken();
    const tokenHash = hashEmailConfirmationToken(plainToken);
    const expiresAt = new Date(
      Date.now() + CONFIRM_HOURS * 60 * 60 * 1000
    );
    await setUserEmailConfirmationChallenge({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    let confirmationEmailSent = false;
    try {
      await sendRegistrationConfirmationEmail({
        to: user.email,
        plainToken,
        displayName: user.full_name,
      });
      confirmationEmailSent = true;
    } catch (mailErr) {
      console.error("Registration confirmation email failed:", mailErr);
    }

    return NextResponse.json(
      {
        token,
        user: mapUserPublicToJson(user),
        confirmationEmailSent,
      },
      { status: 201 }
    );
  } catch (err) {
    const code =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof (err as { code: unknown }).code === "string"
        ? (err as { code: string }).code
        : null;
    if (code === "23505") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    const message =
      err instanceof Error ? err.message : "Failed to register";
    if (message === "JWT_SECRET is not set") {
      return NextResponse.json(
        { error: "Server auth is not configured" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
