import { NextRequest, NextResponse } from "next/server";
import type { CodeItem } from "@/lib/types";
import { upsertCodeItemToSupabase } from "@/repositories/supabase/master-repository";

export async function POST(request: NextRequest) {
  try {
    const code = (await request.json()) as CodeItem;
    if (!code.group?.trim()) {
      return NextResponse.json({ message: "코드그룹을 입력해주세요." }, { status: 400 });
    }
    if (!code.value?.trim()) {
      return NextResponse.json({ message: "코드값을 입력해주세요." }, { status: 400 });
    }
    if (!code.label?.trim()) {
      return NextResponse.json({ message: "코드명을 입력해주세요." }, { status: 400 });
    }

    const saved = await upsertCodeItemToSupabase({
      ...code,
      group: code.group.trim(),
      value: code.value.trim(),
      label: code.label.trim(),
      defaultValue: code.defaultValue?.trim() ?? "",
      description: code.description?.trim() ?? "",
      sortOrder: Number(code.sortOrder) || 0,
      active: code.active ?? true,
    });

    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "기준정보 저장 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
