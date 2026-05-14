import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type OrderRow = {
  id: string;
  user_id: string;
  service_id: string;
  status: string;
  quantity: number;
  created_at: Date;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return uuidRegex.test(value);
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const raw = await request.json();
    const userId =
      typeof raw?.userId === "string"
        ? raw.userId.trim()
        : typeof raw?.user_id === "string"
          ? raw.user_id.trim()
          : "";
    const serviceId =
      typeof raw?.serviceId === "string"
        ? raw.serviceId.trim()
        : typeof raw?.service_id === "string"
          ? raw.service_id.trim()
          : "";
    const quantity =
      typeof raw?.quantity === "number" &&
      Number.isInteger(raw.quantity) &&
      raw.quantity > 0
        ? raw.quantity
        : 1;

    if (!userId || !serviceId) {
      return NextResponse.json(
        { error: "userId and serviceId are required (UUID strings)" },
        { status: 400 }
      );
    }
    if (!isUuid(userId) || !isUuid(serviceId)) {
      return NextResponse.json(
        { error: "userId and serviceId must be valid UUIDs" },
        { status: 400 }
      );
    }

    const inserted = await query<OrderRow>(
      `INSERT INTO orders (user_id, service_id, quantity)
       VALUES ($1::uuid, $2::uuid, $3)
       RETURNING id, user_id, service_id, status, quantity, created_at`,
      [userId, serviceId, quantity]
    );
    const row = inserted[0];
    if (!row) {
      return NextResponse.json(
        { error: "Could not create order" },
        { status: 500 }
      );
    }

    const body = {
      id: row.id,
      user_id: row.user_id,
      service_id: row.service_id,
      status: row.status,
      quantity: row.quantity,
      created_at: row.created_at.toISOString(),
    };

    return NextResponse.json(body, { status: 201 });
  } catch (err) {
    const code =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof (err as { code: unknown }).code === "string"
        ? (err as { code: string }).code
        : null;
    if (code === "23503") {
      return NextResponse.json(
        { error: "userId or serviceId does not exist" },
        { status: 400 }
      );
    }
    if (code === "23514") {
      return NextResponse.json(
        { error: "You cannot purchase your own service listing." },
        { status: 400 }
      );
    }
    const message =
      err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
