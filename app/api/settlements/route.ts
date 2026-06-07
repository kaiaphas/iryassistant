import { NextRequest, NextResponse } from "next/server";
import type { SettlementItem, SettlementType } from "@/lib/types";
import {
  findSettlementItemsFromSupabase,
  saveSettlementItemToSupabase,
} from "@/repositories/supabase/settlement-repository";

function normalizeType(value: string | null): SettlementType {
  return value === "DRIVER" ? "DRIVER" : "GUIDE";
}

function normalizeMonth(value: string | null) {
  if (value && /^\d{4}-\d{2}$/.test(value)) return value;
  return new Date().toISOString().slice(0, 7);
}

export async function GET(request: NextRequest) {
  try {
    const month = normalizeMonth(request.nextUrl.searchParams.get("month"));
    const type = normalizeType(request.nextUrl.searchParams.get("type"));
    const items = await findSettlementItemsFromSupabase(month, type);
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "정산서 조회 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const item = (await request.json()) as SettlementItem;
    if (!item.scheduleId || !item.personId) {
      return NextResponse.json({ message: "저장할 정산 항목을 선택해주세요." }, { status: 400 });
    }

    const saved = await saveSettlementItemToSupabase({
      ...item,
      amount: Number(item.amount) || 0,
      withholdingRate: Number.parseFloat(String(item.withholdingRate)) || 0,
      memo: item.memo?.trim() ?? "",
    });

    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "정산 항목 저장 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
