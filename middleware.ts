import { NextRequest, NextResponse } from "next/server";
import { authCookieNames } from "@/lib/auth-constants";
import { canAccessPath, normalizeAppRole } from "@/lib/access-control";

const publicPrefixes = ["/login", "/signup", "/auth/callback", "/api/auth", "/_next", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(authCookieNames.accessToken)?.value;
  if (!accessToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const role = normalizeAppRole(request.cookies.get(authCookieNames.role)?.value);
  if (!canAccessPath(pathname, role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "접근 권한이 없습니다." }, { status: 403 });
    }

    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("denied", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
