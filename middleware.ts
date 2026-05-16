import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authCookieNames } from "@/lib/auth-constants";
import { canAccessPath, normalizeAppRole } from "@/lib/access-control";

const publicPrefixes = ["/login", "/signup", "/auth/callback", "/api/auth", "/_next", "/favicon.ico"];

async function getAuthenticatedRole(accessToken: string) {
  const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serverUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!authUrl || !anonKey || !serverUrl || !serviceRoleKey) return null;

  const authClient = createClient(authUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
  if (authError || !authData.user) return null;

  const serverClient = createClient(serverUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: member, error: memberError } = await serverClient
    .from("admin_members")
    .select("role,status")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (memberError || !member || member.status !== "active") return null;
  return normalizeAppRole(member.role);
}

export async function middleware(request: NextRequest) {
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

  const role = await getAuthenticatedRole(accessToken);
  if (!role) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

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
