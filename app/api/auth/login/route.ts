import { NextRequest, NextResponse } from "next/server";
import { authCookieNames, createSupabaseAuthClient } from "@/lib/auth";
import { createSupabaseServerClient } from "@/repositories/supabase/reservation-repository";
import { normalizeAppRole } from "@/lib/access-control";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as { email?: string; password?: string };
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json({ message: "이메일과 비밀번호를 입력해주세요." }, { status: 400 });
    }

    const authClient = createSupabaseAuthClient();
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError || !authData.session || !authData.user) {
      return NextResponse.json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const { data: member, error: memberError } = await supabase
      .from("admin_members")
      .select("id,email,role,status")
      .eq("auth_user_id", authData.user.id)
      .maybeSingle();

    if (memberError) {
      return NextResponse.json({ message: `회원 승인 상태 조회 실패: ${memberError.message}` }, { status: 500 });
    }

    if (!member || member.status !== "active") {
      return NextResponse.json({ message: "관리자 승인 후 로그인할 수 있습니다." }, { status: 403 });
    }

    await supabase.from("admin_members").update({ last_login_at: new Date().toISOString() }).eq("id", member.id);

    const response = NextResponse.json({ ok: true });
    const secure = process.env.NODE_ENV === "production";
    const maxAge = 60 * 60 * 24 * 7;
    const role = normalizeAppRole(member.role);

    response.cookies.set(authCookieNames.accessToken, authData.session.access_token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge });
    response.cookies.set(authCookieNames.refreshToken, authData.session.refresh_token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge });
    response.cookies.set(authCookieNames.role, role, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge });
    response.cookies.set(authCookieNames.email, member.email, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "로그인 요청 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
