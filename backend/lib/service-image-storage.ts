import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED_MIME = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

const MAX_BYTES = 5 * 1024 * 1024;

export function serviceUploadsDir(): string {
  const configured = process.env.SERVICE_UPLOADS_DIR?.trim();
  if (configured) {
    return configured;
  }
  return path.join(process.cwd(), "uploads", "services");
}

export function serviceImagePublicPath(filename: string): string {
  return `/uploads/services/${filename}`;
}

export function isSafeServiceImageFilename(filename: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|gif)$/i.test(
    filename,
  );
}

export function isAllowedServiceImageUrl(imageUrl: string): boolean {
  const value = imageUrl.trim();
  if (value.startsWith("/uploads/services/")) {
    const filename = value.slice("/uploads/services/".length);
    return isSafeServiceImageFilename(filename);
  }
  if (value.startsWith("/images/services/")) {
    const filename = value.slice("/images/services/".length);
    return /^[a-z0-9][a-z0-9._-]*\.(jpg|jpeg|png|webp|gif)$/i.test(filename);
  }
  return false;
}

export async function saveServiceImageFile(file: File): Promise<{
  image_url: string;
  filename: string;
}> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Image must be JPEG, PNG, WebP, or GIF.");
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error("Image must be between 1 byte and 5 MB.");
  }

  const ext = ALLOWED_MIME.get(file.type) ?? ".bin";
  const filename = `${randomUUID()}${ext}`;
  const dir = serviceUploadsDir();
  await mkdir(dir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return {
    image_url: serviceImagePublicPath(filename),
    filename,
  };
}

export async function readServiceImageFile(
  filename: string,
): Promise<{ bytes: Buffer; contentType: string }> {
  if (!isSafeServiceImageFilename(filename)) {
    throw new Error("Invalid image filename.");
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : "image/jpeg";

  const bytes = await readFile(path.join(serviceUploadsDir(), filename));
  return { bytes, contentType };
}
