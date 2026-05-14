import { NextResponse } from "next/server";
import { openApiDocument } from "@/lib/openapi-spec";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(openApiDocument);
}
