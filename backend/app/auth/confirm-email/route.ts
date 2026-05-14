import { NextResponse } from "next/server";
import { signAccessToken } from "@/lib/auth-jwt";
import {
  confirmUserEmailByTokenHash,
  findUserPublicById,
  mapUserPublicToJson,
} from "@/lib/auth-user-db";
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

    const user = await findUserPublicById(row.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let jwt: string;
    try {
      jwt = await signAccessToken(row.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not issue session";
      if (message === "JWT_SECRET is not set") {
        return NextResponse.json(
          { error: "Server auth is not configured" },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      email: row.email,
      token: jwt,
      user: mapUserPublicToJson(user),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not confirm email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
