import { NextRequest, NextResponse } from "next/server";
import { isCurrentAdmin } from "@/lib/auth";
import { updateAdminMemberStatus } from "@/repositories/supabase/master-repository";
import type { AdminUser } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    if (!(await isCurrentAdmin())) {
      return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { id, role = "담당자" } = (await request.json()) as { id?: string; role?: string };
    if (!id) {
      return NextResponse.json({ message: "회원 ID가 없습니다." }, { status: 400 });
    }

    const member: AdminUser = await updateAdminMemberStatus(id, "active", role);
    return NextResponse.json(member);
  } catch (error) {
    const message = error instanceof Error ? error.message : "회원 승인 중 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
