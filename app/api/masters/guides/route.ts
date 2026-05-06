import { NextRequest, NextResponse } from "next/server";
import { upsertGuideToSupabase } from "@/repositories/supabase/master-repository";
import type { Guide } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const guide = (await request.json()) as Guide;
    if (!guide.name?.trim()) {
      return NextResponse.json({ message: "가이드명을 입력해주세요." }, { status: 400 });
    }

    const saved = await upsertGuideToSupabase({
      ...guide,
      name: guide.name.trim(),
      phone: guide.phone?.trim() ?? "",
      memo: guide.memo?.trim() ?? "",
    });

    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "가이드 저장 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
