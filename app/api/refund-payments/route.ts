import { NextRequest, NextResponse } from "next/server";
import type { RefundPayment } from "@/lib/types";
import { deleteRefundPaymentFromSupabase, updateRefundPaymentToSupabase } from "@/repositories/supabase/refund-repository";

export async function PATCH(request: NextRequest) {
  try {
    const payment = (await request.json()) as RefundPayment;
    if (!payment.id) return NextResponse.json({ message: "수정할 입금내역을 선택해주세요." }, { status: 400 });
    if (!payment.depositDate) return NextResponse.json({ message: "입금일을 입력해주세요." }, { status: 400 });
    if (!Number(payment.depositAmount)) return NextResponse.json({ message: "입금액을 입력해주세요." }, { status: 400 });

    const saved = await updateRefundPaymentToSupabase({
      ...payment,
      depositAmount: Number(payment.depositAmount) || 0,
      depositor: payment.depositor?.trim() ?? "",
      memo: payment.memo?.trim() ?? "",
    });

    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "환불 입금내역 수정 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ message: "삭제할 입금내역을 선택해주세요." }, { status: 400 });

    await deleteRefundPaymentFromSupabase(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "환불 입금내역 삭제 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
