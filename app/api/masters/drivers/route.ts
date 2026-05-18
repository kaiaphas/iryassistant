import { NextRequest, NextResponse } from "next/server";
import { deleteDriverFromSupabase, upsertDriverToSupabase } from "@/repositories/supabase/master-repository";
import type { Driver } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const driver = (await request.json()) as Driver;
    if (!driver.name?.trim()) {
      return NextResponse.json({ message: "기사명을 입력해주세요." }, { status: 400 });
    }

    const saved = await upsertDriverToSupabase({
      ...driver,
      name: driver.name.trim(),
      capacity: driver.capacity?.trim() ?? "",
      phone: driver.phone?.trim() ?? "",
      birthDate: driver.birthDate?.trim() ?? "",
      bankAccount: driver.bankAccount?.trim() ?? "",
      company: driver.company?.trim() ?? "",
      driverType: driver.driverType === "자차" ? "자차" : "직영",
      memo: driver.memo?.trim() ?? "",
    });

    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "기사 저장 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ message: "삭제할 기사를 선택해주세요." }, { status: 400 });

    await deleteDriverFromSupabase(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "기사 삭제 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
