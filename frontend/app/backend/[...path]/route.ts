import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendInternalOrigin } from "@/lib/api";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

function targetUrl(segments: string[], search: string): string {
  const base = backendInternalOrigin();
  const joined = segments.join("/");
  const path = joined.length > 0 ? `/${joined}` : "";
  return `${base}${path}${search}`;
}

async function proxy(
  request: NextRequest,
  segments: string[]
): Promise<NextResponse> {
  const url = targetUrl(segments, request.nextUrl.search);

  const forwardHeaders = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    forwardHeaders.set("content-type", contentType);
  }
  const authorization = request.headers.get("authorization");
  if (authorization) {
    forwardHeaders.set("authorization", authorization);
  }

  const method = request.method;
  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await request.text();
  }

  const upstream = await fetch(url, {
    method,
    headers: forwardHeaders,
    body,
    cache: "no-store",
  });

  const buffer = await upstream.arrayBuffer();
  const response = new NextResponse(buffer, {
    status: upstream.status,
    statusText: upstream.statusText,
  });
  const ct = upstream.headers.get("content-type");
  if (ct) {
    response.headers.set("content-type", ct);
  }
  return response;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path ?? []);
}

export async function HEAD(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path ?? []);
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path ?? []);
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path ?? []);
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path ?? []);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path ?? []);
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204 });
}
