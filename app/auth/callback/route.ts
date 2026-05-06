import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType, Session, User } from "@supabase/supabase-js";
import { authCookieNames, createSupabaseAuthClient } from "@/lib/auth";
import { getRoleFromEmail } from "@/lib/access-control";
import { adminUsers } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = (request.nextUrl.searchParams.get("type") ?? "email") as EmailOtpType;
  const next = request.nextUrl.searchParams.get("next") || "/";

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  const supabase = createSupabaseAuthClient();
  let session: Session | null = null;
  let user: User | null = null;
  let authError: Error | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    session = data.session;
    user = data.user;
    authError = error;
  } else if (tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    session = data.session;
    user = data.user;
    authError = error;
  }

  if (authError || !session) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(authError?.message ?? "auth_failed")}`, request.url));
  }

  const member = adminUsers.find((item) => item.status === "active" && item.email?.toLowerCase() === user?.email?.toLowerCase());
  const role = member?.role === "최고관리자" || member?.role === "관리자" ? "admin" : getRoleFromEmail(user?.email);
  const response = NextResponse.redirect(new URL(next, request.url));
  const secure = process.env.NODE_ENV === "production";
  const maxAge = 60 * 60 * 24 * 7;

  response.cookies.set(authCookieNames.accessToken, session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });
  response.cookies.set(authCookieNames.refreshToken, session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });
  response.cookies.set(authCookieNames.role, role, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });
  response.cookies.set(authCookieNames.email, user?.email ?? "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });

  return response;
}
