import { NextResponse } from "next/server";
import { toIsoTimestamp } from "@/lib/iso-timestamp";
import { queryEnrichedServices } from "@/lib/services-queries";

export async function GET(): Promise<NextResponse> {
  try {
    const rows = await queryEnrichedServices();
    const body = rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price_cents: row.price_cents,
      created_at: toIsoTimestamp(row.created_at),
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      avg_rating:
        row.avg_rating !== null && row.avg_rating !== ""
          ? Number.parseFloat(row.avg_rating)
          : null,
      review_count: Number.parseInt(row.review_count, 10),
    }));
    return NextResponse.json(body);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch services";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
