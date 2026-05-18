import { NextRequest, NextResponse } from "next/server";
import type { RefundPayment } from "@/lib/types";
import { createRefundPaymentToSupabase } from "@/repositories/supabase/refund-repository";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ refundId: string }> },
) {
  try {
    const { refundId } = await params;
    const payment = (await request.json()) as Partial<RefundPayment>;

    if (!payment.depositDate) {
      return NextResponse.json({ message: "입금일을 입력해주세요." }, { status: 400 });
    }
    if (!Number(payment.depositAmount)) {
      return NextResponse.json({ message: "입금액을 입력해주세요." }, { status: 400 });
    }

    const saved = await createRefundPaymentToSupabase({
      refundId,
      depositDate: payment.depositDate,
      depositAmount: Number(payment.depositAmount) || 0,
      depositor: payment.depositor?.trim() ?? "",
      memo: payment.memo?.trim() ?? "",
    });

    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "환불 입금내역 저장 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
