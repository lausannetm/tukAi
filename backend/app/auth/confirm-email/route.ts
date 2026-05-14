import { NextResponse } from "next/server";
import { confirmUserEmailByTokenHash } from "@/lib/auth-user-db";
import { hashEmailConfirmationToken } from "@/lib/email-confirmation-crypto";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const rawToken = url.searchParams.get("token")?.trim() ?? "";
    if (!rawToken) {
      return NextResponse.json(
        { error: "token query parameter is required" },
        { status: 400 }
      );
    }

    const tokenHash = hashEmailConfirmationToken(rawToken);
    const row = await confirmUserEmailByTokenHash(tokenHash);
    if (!row) {
      return NextResponse.json(
        { error: "Invalid or expired confirmation link" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      email: row.email,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not confirm email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
