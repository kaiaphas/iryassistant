import { NextRequest, NextResponse } from "next/server";
import type { IntegratedSettlementRow } from "@/lib/types";
import { calculateIntegratedSettlementRow } from "@/lib/integrated-settlement-calculator";
import { saveIntegratedSettlementRow } from "@/services/integrated-settlement-service";

export async function PATCH(request: NextRequest) {
  try {
    const row = (await request.json()) as IntegratedSettlementRow;
    if (!row.scheduleId) {
      return NextResponse.json({ message: "저장할 통합정산 행을 선택해주세요." }, { status: 400 });
    }

    const saved = await saveIntegratedSettlementRow(calculateIntegratedSettlementRow(row));
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "통합정산 행 저장 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
