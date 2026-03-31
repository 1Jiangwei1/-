import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CSRF_EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
]);

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
    const requestOrigin = request.nextUrl.origin;

    const sameOrigin =
      (origin && origin === requestOrigin) ||
      (!!referer && (() => {
        try {
          return new URL(referer).origin === requestOrigin;
        } catch {
          return false;
        }
      })());

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
