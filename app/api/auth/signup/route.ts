import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/repositories/supabase/reservation-repository";

const signupAttempts = new Map<string, { count: number; resetAt: number }>();
const signupWindowMs = 10 * 60 * 1000;
const signupLimit = 5;

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = signupAttempts.get(key);
  if (!current || current.resetAt <= now) {
    signupAttempts.set(key, { count: 1, resetAt: now + signupWindowMs });
    return false;
  }

  current.count += 1;
  return current.count > signupLimit;
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(getClientIp(request))) {
      return NextResponse.json({ message: "잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    const { name, email, password } = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedName = name?.trim();

    if (!normalizedName || !normalizedEmail || !password) {
      return NextResponse.json({ message: "이름, 이메일, 비밀번호를 모두 입력해주세요." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data: existingMember, error: existingError } = await supabase
      .from("admin_members")
      .select("id,status")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ message: `회원 조회 실패: ${existingError.message}` }, { status: 500 });
    }
    if (existingMember) {
      return NextResponse.json({ message: "이미 가입 요청된 이메일입니다." }, { status: 409 });
    }

    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { name: normalizedName },
    });

    if (createError || !createdUser.user) {
      return NextResponse.json({ message: `회원가입 요청 실패: ${createError?.message ?? "사용자 생성 실패"}` }, { status: 500 });
    }

    const { error: insertError } = await supabase.from("admin_members").insert({
      auth_user_id: createdUser.user.id,
      name: normalizedName,
      email: normalizedEmail,
      role: "담당자",
      status: "pending",
    });

    if (insertError) {
      await supabase.auth.admin.deleteUser(createdUser.user.id);
      return NextResponse.json({ message: `회원가입 요청 저장 실패: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "회원가입 요청 중 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
