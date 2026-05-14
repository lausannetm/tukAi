/** Host + port humans use for the REST API while browsing Swagger or testing from the laptop. */
export function backendPublicOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL?.trim() || "http://127.0.0.1:3001";

  return raw.replace(/\/$/, "");
}
