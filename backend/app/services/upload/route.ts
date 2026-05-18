import { NextResponse } from "next/server";
import { saveServiceImageFile } from "@/lib/service-image-storage";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const form = await request.formData();
    const file = form.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "image file is required (multipart field name: image)." },
        { status: 400 },
      );
    }

    const saved = await saveServiceImageFile(file);
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to upload service image";
    const status = message.includes("must be") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
