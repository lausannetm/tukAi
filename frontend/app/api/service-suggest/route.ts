import { NextResponse } from "next/server";
import { backendInternalOrigin } from "@/lib/api";

export async function POST(req: Request): Promise<Response> {
  const origin = backendInternalOrigin();
  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const res = await fetch(`${origin}/services/suggest`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(bodyUnknown),
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
