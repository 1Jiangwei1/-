import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CSRF_EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
]);

function getAllowedOrigins(request: NextRequest) {
  const origins = new Set<string>([request.nextUrl.origin]);

  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host");

  const proto =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");

  if (host) {
    origins.add(`${proto}://${host}`);
  }

  return origins;
}

function matchesAllowedOrigin(value: string | null, allowedOrigins: Set<string>) {
  if (!value) {
    return false;
  }

  try {
    return allowedOrigins.has(new URL(value).origin);
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  if (
    pathname.startsWith("/api/") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
    !CSRF_EXEMPT_PATHS.has(pathname)
  ) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const allowedOrigins = getAllowedOrigins(request);

    const sameOrigin =
      matchesAllowedOrigin(origin, allowedOrigins) ||
      matchesAllowedOrigin(referer, allowedOrigins);

    if (!sameOrigin) {
      return NextResponse.json(
        {
          success: false,
          message: "请求来源校验失败，请刷新页面后重试。",
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};