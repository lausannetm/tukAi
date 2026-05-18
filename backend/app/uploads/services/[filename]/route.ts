import { NextResponse } from "next/server";
import { readServiceImageFile } from "@/lib/service-image-storage";

type RouteContext = { params: Promise<{ filename: string }> };

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { filename } = await context.params;
    const { bytes, contentType } = await readServiceImageFile(filename);
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
