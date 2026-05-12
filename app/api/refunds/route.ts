import { NextRequest, NextResponse } from "next/server";
import type { RefundItem } from "@/lib/types";
import { deleteRefundFromSupabase, upsertRefundToSupabase } from "@/repositories/supabase/refund-repository";

export async function POST(request: NextRequest) {
  try {
    const refund = (await request.json()) as RefundItem;
    if (!refund.refundDate) {
      return NextResponse.json({ message: "환불일자를 선택해주세요." }, { status: 400 });
    }
    if (!refund.customerName?.trim()) {
      return NextResponse.json({ message: "고객명을 입력해주세요." }, { status: 400 });
    }

    const saved = await upsertRefundToSupabase({
      ...refund,
      customerName: refund.customerName.trim(),
      phone: refund.phone?.trim() ?? "",
      depositor: refund.depositor?.trim() ?? "",
      registeredBy: refund.registeredBy?.trim() ?? "",
      bankAccount: refund.bankAccount?.trim() ?? "",
      memo: refund.memo?.trim() ?? "",
      peopleCount: Number(refund.peopleCount) || 0,
      productAmount: Number(refund.productAmount) || 0,
      depositAmount: Number(refund.depositAmount) || 0,
      refundRequestAmount: Number(refund.refundRequestAmount) || 0,
      balanceAmount: refund.balanceAmount === undefined ? undefined : Number(refund.balanceAmount) || 0,
      status: refund.status === "환불완료" ? "환불완료" : "환불신청",
    });

    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "환불명단 저장 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ message: "삭제할 환불 내역을 선택해주세요." }, { status: 400 });

    await deleteRefundFromSupabase(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "환불명단 삭제 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
