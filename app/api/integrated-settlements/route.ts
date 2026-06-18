import { NextRequest, NextResponse } from "next/server";
import { getIntegratedSettlementRows } from "@/services/integrated-settlement-service";

function numberParam(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const year = numberParam(request.nextUrl.searchParams.get("year"), now.getFullYear());
    const month = numberParam(request.nextUrl.searchParams.get("month"), now.getMonth() + 1);
    const rows = await getIntegratedSettlementRows(year, month);
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "통합정산서 조회 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
