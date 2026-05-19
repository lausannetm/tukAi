import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth-jwt";
import {
  findUserPublicById,
  mapUserPublicToJson,
} from "@/lib/auth-user-db";
import {
  queryEnrichedServices,
  serviceJsonFromEnrichedRow,
} from "@/lib/services-queries";
import { bearerTokenFromRequest, isUuid } from "@/lib/auth-validation";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const token = bearerTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authorization Bearer token is required" },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const userId = payload.sub;
    if (!isUuid(userId)) {
      return NextResponse.json({ error: "Invalid token subject" }, { status: 401 });
    }

    const user = await findUserPublicById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.email_verified_at) {
      return NextResponse.json(
        {
          error:
            "Please confirm your email before using this session. Log in again after confirming.",
        },
        { status: 403 }
      );
    }

    const ownedRows = await queryEnrichedServices({ providerId: userId });
    const services = ownedRows.map((row) => serviceJsonFromEnrichedRow(row));

    return NextResponse.json({
      user: mapUserPublicToJson(user),
      services,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load profile";
    if (message === "JWT_SECRET is not set") {
      return NextResponse.json(
        { error: "Server auth is not configured" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
