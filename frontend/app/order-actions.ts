"use server";

import { postOrder } from "@/lib/api";
import type { OrderDTO } from "@/lib/types";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return uuidRegex.test(value.trim());
}

export async function submitOrderForm(formData: FormData): Promise<{
  ok: true;
  order: OrderDTO;
} | {
  ok: false;
  error: string;
}> {
  const userId = String(formData.get("userId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const qtyRaw = String(formData.get("quantity") ?? "1");

  const quantity = Number(qtyRaw);
  if (!userId || !serviceId) {
    return { ok: false, error: "Pick a service and confirm the user ID." };
  }
  if (!isUuid(userId) || !isUuid(serviceId)) {
    return { ok: false, error: "userId and serviceId must be valid UUID strings." };
  }
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, error: "Quantity must be a positive integer." };
  }

  try {
    const order = await postOrder({
      userId,
      serviceId,
      quantity,
    });
    return { ok: true, order };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not submit order.";
    return { ok: false, error: message };
  }
}
