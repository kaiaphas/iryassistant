import { NextRequest, NextResponse } from "next/server";
import { syncIntegratedSettlementRows } from "@/services/integrated-settlement-service";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { year?: number; month?: number };
    const rows = await syncIntegratedSettlementRows(Number(body.year), Number(body.month));
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "통합정산서 연동 생성 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
