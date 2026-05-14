import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth-jwt";
import {
  findUserPublicById,
  mapOwnedServiceToJson,
  mapUserPublicToJson,
  queryOwnedServicesForUser,
} from "@/lib/auth-user-db";
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

    const ownedRows = await queryOwnedServicesForUser(userId);
    const services = ownedRows.map((row) => mapOwnedServiceToJson(row));

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
