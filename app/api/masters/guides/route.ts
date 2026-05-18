import { NextRequest, NextResponse } from "next/server";
import { deleteGuideFromSupabase, upsertGuideToSupabase } from "@/repositories/supabase/master-repository";
import type { Guide } from "@/lib/types";
import { isValidPartialBirthDate } from "@/lib/birth-date";

export async function POST(request: NextRequest) {
  try {
    const guide = (await request.json()) as Guide;
    if (!guide.name?.trim()) {
      return NextResponse.json({ message: "가이드명을 입력해주세요." }, { status: 400 });
    }
    if (!isValidPartialBirthDate(guide.birthDate?.trim() ?? "")) {
      return NextResponse.json({ message: "생년월일은 연도, 연월, 연월일 형식으로 입력해주세요." }, { status: 400 });
    }

    const saved = await upsertGuideToSupabase({
      ...guide,
      name: guide.name.trim(),
      phone: guide.phone?.trim() ?? "",
      birthDate: guide.birthDate?.trim() ?? "",
      bankAccount: guide.bankAccount?.trim() ?? "",
      memo: guide.memo?.trim() ?? "",
    });

    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "가이드 저장 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ message: "삭제할 가이드를 선택해주세요." }, { status: 400 });

    await deleteGuideFromSupabase(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "가이드 삭제 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
