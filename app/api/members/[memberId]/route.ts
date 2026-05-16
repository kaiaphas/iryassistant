import { NextRequest, NextResponse } from "next/server";
import { isCurrentAdmin } from "@/lib/auth";
import { updateAdminMember } from "@/repositories/supabase/master-repository";
import type { AdminUser } from "@/lib/types";

type RouteContext = {
  params: Promise<{
    memberId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!(await isCurrentAdmin())) {
      return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { memberId } = await context.params;
    const payload = (await request.json()) as Partial<AdminUser>;

    if (!memberId || payload.id !== memberId) {
      return NextResponse.json({ message: "회원 ID가 올바르지 않습니다." }, { status: 400 });
    }

    if (!payload.name?.trim()) {
      return NextResponse.json({ message: "이름을 입력해주세요." }, { status: 400 });
    }

    if (!payload.role?.trim()) {
      return NextResponse.json({ message: "권한을 선택해주세요." }, { status: 400 });
    }

    if (!payload.status) {
      return NextResponse.json({ message: "상태를 선택해주세요." }, { status: 400 });
    }

    const member = await updateAdminMember({
      id: memberId,
      name: payload.name.trim(),
      role: payload.role.trim(),
      status: payload.status,
      department: payload.department?.trim(),
      phone: payload.phone?.trim(),
    });

    return NextResponse.json(member);
  } catch (error) {
    const message = error instanceof Error ? error.message : "회원 정보 저장 중 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
