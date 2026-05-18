import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType, Session, User } from "@supabase/supabase-js";
import { authCookieNames, authSessionMaxAge, createSupabaseAuthClient } from "@/lib/auth";
import { normalizeAppRole } from "@/lib/access-control";
import { createSupabaseServerClient } from "@/repositories/supabase/reservation-repository";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = (request.nextUrl.searchParams.get("type") ?? "email") as EmailOtpType;
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

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

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=missing_user", request.url));
  }

  const serverClient = createSupabaseServerClient();
  const { data: member, error: memberError } = await serverClient
    .from("admin_members")
    .select("email,role,status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (memberError || !member || member.status !== "active") {
    return NextResponse.redirect(new URL("/login?error=approval_required", request.url));
  }

  const role = normalizeAppRole(member.role);
  const response = NextResponse.redirect(new URL(next, request.url));
  const secure = process.env.NODE_ENV === "production";
  const maxAge = authSessionMaxAge;

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
