import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { effectiveServiceImageUrl } from "@/lib/service-image-storage";

type OrderRow = {
  id: string;
  user_id: string;
  service_id: string;
  status: string;
  quantity: number;
  booking_date: Date | string | null;
  booking_time: string | null;
  message_to_provider: string | null;
  created_at: Date;
};

type OrderWithServiceRow = OrderRow & {
  service_name: string;
  service_description: string | null;
  service_price_cents: number;
  service_location: string | null;
  service_image_url: string | null;
  provider_label: string | null;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return uuidRegex.test(value);
}

function formatBookingDate(value: Date | string | null): string | null {
  if (value === null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

function serializeOrder(row: OrderWithServiceRow): Record<string, unknown> {
  return {
    id: row.id,
    user_id: row.user_id,
    service_id: row.service_id,
    status: row.status,
    quantity: row.quantity,
    booking_date: formatBookingDate(row.booking_date),
    booking_time: row.booking_time,
    message_to_provider: row.message_to_provider,
    created_at: row.created_at.toISOString(),
    service: {
      id: row.service_id,
      name: row.service_name,
      description: row.service_description ?? "",
      price_cents: row.service_price_cents,
      location: row.service_location ?? "",
      image_url: effectiveServiceImageUrl(row.service_image_url),
      provider_label: row.provider_label,
    },
  };
}

const orderSelectWithService = `
  SELECT
    o.id,
    o.user_id,
    o.service_id,
    o.status,
    o.quantity,
    o.booking_date,
    o.booking_time,
    o.message_to_provider,
    o.created_at,
    s.name AS service_name,
    s.description AS service_description,
    s.price_cents AS service_price_cents,
    s.location AS service_location,
    s.image_url AS service_image_url,
    COALESCE(NULLIF(TRIM(u.full_name), ''), u.email, s.provider_id::text) AS provider_label
  FROM orders o
  INNER JOIN services s ON s.id = o.service_id
  INNER JOIN users u ON u.id = s.provider_id
`;

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId")?.trim() ?? "";

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required (UUID string)" },
        { status: 400 }
      );
    }
    if (!isUuid(userId)) {
      return NextResponse.json(
        { error: "userId must be a valid UUID" },
        { status: 400 }
      );
    }

    const rows = await query<OrderWithServiceRow>(
      `${orderSelectWithService}
       WHERE o.user_id = $1::uuid
         AND o.status = 'confirmed'
       ORDER BY o.created_at DESC`,
      [userId]
    );

    return NextResponse.json(rows.map(serializeOrder));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
    const status =
      typeof raw?.status === "string" && raw.status.trim()
        ? raw.status.trim()
        : "pending";
    const bookingDate =
      typeof raw?.bookingDate === "string"
        ? raw.bookingDate.trim()
        : typeof raw?.booking_date === "string"
          ? raw.booking_date.trim()
          : null;
    const bookingTime =
      typeof raw?.bookingTime === "string"
        ? raw.bookingTime.trim()
        : typeof raw?.booking_time === "string"
          ? raw.booking_time.trim()
          : null;
    const messageToProvider =
      typeof raw?.messageToProvider === "string"
        ? raw.messageToProvider.trim()
        : typeof raw?.message_to_provider === "string"
          ? raw.message_to_provider.trim()
          : null;

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
      `INSERT INTO orders (
         user_id,
         service_id,
         quantity,
         status,
         booking_date,
         booking_time,
         message_to_provider
       )
       VALUES ($1::uuid, $2::uuid, $3, $4, $5::date, $6, $7)
       RETURNING id, user_id, service_id, status, quantity, booking_date, booking_time, message_to_provider, created_at`,
      [
        userId,
        serviceId,
        quantity,
        status,
        bookingDate || null,
        bookingTime || null,
        messageToProvider || null,
      ]
    );
    const row = inserted[0];
    if (!row) {
      return NextResponse.json(
        { error: "Could not create order" },
        { status: 500 }
      );
    }

    const enriched = await query<OrderWithServiceRow>(
      `${orderSelectWithService}
       WHERE o.id = $1::uuid`,
      [row.id]
    );
    const full = enriched[0];
    if (!full) {
      return NextResponse.json(
        {
          id: row.id,
          user_id: row.user_id,
          service_id: row.service_id,
          status: row.status,
          quantity: row.quantity,
          booking_date: formatBookingDate(row.booking_date),
          booking_time: row.booking_time,
          message_to_provider: row.message_to_provider,
          created_at: row.created_at.toISOString(),
        },
        { status: 201 }
      );
    }

    return NextResponse.json(serializeOrder(full), { status: 201 });
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
