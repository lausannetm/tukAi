import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function configuredOrigin(): string {
  return (
    process.env.FRONTEND_PUBLIC_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function allowOrigin(request: NextRequest): string {
  const fallback = configuredOrigin();
  const origin = request.headers.get("origin");
  if (!origin) {
    return fallback;
  }
  if (origin === fallback) {
    return origin;
  }
  if (process.env.NODE_ENV !== "production") {
    const devOrigins = new Set([
      fallback,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ]);
    if (devOrigins.has(origin)) {
      return origin;
    }
  }
  return fallback;
}

function corsHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", allowOrigin(request));
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Vary", "Origin");
  return headers;
}

export function middleware(request: NextRequest): NextResponse {
  if (!request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }

  const response = NextResponse.next();
  corsHeaders(request).forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: "/auth/:path*",
};
