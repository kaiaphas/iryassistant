import type { RefundItem, RefundPayment } from "@/lib/types";
import { refundItems } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/repositories/supabase/reservation-repository";

type RefundRow = {
  id: string;
  no: number;
  refund_date: string;
  customer_name: string;
  departure_date: string | null;
  people_count: number;
  phone: string | null;
  payment_method: string;
  deposit_date: string | null;
  product_amount: number | string | null;
  deposit_amount: number | string | null;
  refund_request_amount: number | string | null;
  depositor: string | null;
  balance_amount: number | string | null;
  registered_by: string | null;
  status: RefundItem["status"];
  bank_account: string | null;
  memo: string | null;
};

type RefundPaymentRow = {
  id: string;
  refund_id: string;
  deposit_date: string;
  deposit_amount: number | string | null;
  depositor: string | null;
  memo: string | null;
};

const refundSelect = "id,no,refund_date,customer_name,departure_date,people_count,phone,payment_method,deposit_date,product_amount,deposit_amount,refund_request_amount,depositor,balance_amount,registered_by,status,bank_account,memo";
const refundPaymentSelect = "id,refund_id,deposit_date,deposit_amount,depositor,memo";

function isMissingTable(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? "";
  return (
    error?.code === "42P01"
    || error?.code === "PGRST205"
    || message.includes("does not exist")
    || message.includes("schema cache")
    || message.includes("Could not find the table")
  );
}

function numberValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value) || 0;
}

function textValue(value: string | null | undefined) {
  return value ?? "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function mapPayment(row: RefundPaymentRow): RefundPayment {
  return {
    id: row.id,
    refundId: row.refund_id,
    depositDate: row.deposit_date,
    depositAmount: numberValue(row.deposit_amount),
    depositor: textValue(row.depositor),
    memo: textValue(row.memo),
  };
}

function legacyPayment(row: RefundRow): RefundPayment[] {
  if (!row.deposit_date || !numberValue(row.deposit_amount)) return [];
  return [{
    id: `legacy-${row.id}`,
    refundId: row.id,
    depositDate: row.deposit_date,
    depositAmount: numberValue(row.deposit_amount),
    depositor: textValue(row.depositor),
    memo: "",
  }];
}

function mapRefund(row: RefundRow, payments: RefundPayment[] = legacyPayment(row)): RefundItem {
  const depositAmount = payments.reduce((sum, payment) => sum + payment.depositAmount, 0);
  return {
    id: row.id,
    no: row.no,
    refundDate: row.refund_date,
    customerName: row.customer_name,
    departureDate: textValue(row.departure_date),
    peopleCount: row.people_count,
    phone: textValue(row.phone),
    paymentMethod: row.payment_method,
    depositDate: textValue(row.deposit_date),
    productAmount: numberValue(row.product_amount),
    depositAmount,
    refundRequestAmount: numberValue(row.refund_request_amount),
    depositor: textValue(row.depositor),
    balanceAmount: row.balance_amount === null ? undefined : numberValue(row.balance_amount),
    registeredBy: textValue(row.registered_by),
    status: row.status,
    bankAccount: textValue(row.bank_account),
    memo: textValue(row.memo),
    payments,
  };
}

export async function findRefundsFromSupabase() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("refunds")
    .select(refundSelect)
    .order("refund_date", { ascending: false })
    .order("no", { ascending: true });

  if (isMissingTable(error)) return refundItems;
  if (error) throw new Error(`환불명단 Supabase 조회 실패: ${error.message}`);

  const rows = (data ?? []) as RefundRow[];
  const refundIds = rows.map((row) => row.id);
  let paymentRows: RefundPaymentRow[] = [];

  if (refundIds.length > 0) {
    const { data: paymentData, error: paymentError } = await supabase
      .from("refund_payments")
      .select(refundPaymentSelect)
      .in("refund_id", refundIds)
      .order("deposit_date", { ascending: true });

    if (!isMissingTable(paymentError) && paymentError) {
      throw new Error(`환불 입금내역 Supabase 조회 실패: ${paymentError.message}`);
    }
    paymentRows = ((paymentData ?? []) as RefundPaymentRow[]);
  }

  const paymentsByRefundId = new Map<string, RefundPayment[]>();
  for (const row of paymentRows) {
    const payments = paymentsByRefundId.get(row.refund_id) ?? [];
    payments.push(mapPayment(row));
    paymentsByRefundId.set(row.refund_id, payments);
  }

  return rows.map((row) => mapRefund(row, paymentsByRefundId.get(row.id)));
}

export async function upsertRefundToSupabase(refund: RefundItem) {
  const supabase = createSupabaseServerClient();
  const payload = {
    ...(isUuid(refund.id) ? { id: refund.id } : {}),
    refund_date: refund.refundDate,
    customer_name: refund.customerName,
    departure_date: refund.departureDate || null,
    people_count: Number(refund.peopleCount) || 0,
    phone: refund.phone || null,
    payment_method: refund.paymentMethod,
    deposit_date: refund.depositDate || null,
    product_amount: Number(refund.productAmount) || 0,
    deposit_amount: Number(refund.depositAmount) || 0,
    refund_request_amount: Number(refund.refundRequestAmount) || 0,
    depositor: refund.depositor || null,
    balance_amount: refund.balanceAmount === undefined ? null : Number(refund.balanceAmount) || 0,
    registered_by: refund.registeredBy || null,
    status: refund.status,
    bank_account: refund.bankAccount || null,
    memo: refund.memo || null,
  };

  const { data, error } = await supabase.rpc("save_refund_atomic", { p_refund: payload }).single();
  if (error) throw new Error(`환불명단 저장 실패: ${error.message}`);
  return mapRefund(data as RefundRow, refund.payments);
}

export async function deleteRefundFromSupabase(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("refunds").delete().eq("id", id);
  if (error) throw new Error(`환불명단 삭제 실패: ${error.message}`);
}

export async function createRefundPaymentToSupabase(payment: Omit<RefundPayment, "id">) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("refund_payments")
    .insert({
      refund_id: payment.refundId,
      deposit_date: payment.depositDate,
      deposit_amount: Number(payment.depositAmount) || 0,
      depositor: payment.depositor || null,
      memo: payment.memo || null,
    })
    .select(refundPaymentSelect)
    .single();

  if (error) throw new Error(`환불 입금내역 저장 실패: ${error.message}`);
  return mapPayment(data as RefundPaymentRow);
}

export async function updateRefundPaymentToSupabase(payment: RefundPayment) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("refund_payments")
    .update({
      deposit_date: payment.depositDate,
      deposit_amount: Number(payment.depositAmount) || 0,
      depositor: payment.depositor || null,
      memo: payment.memo || null,
    })
    .eq("id", payment.id)
    .select(refundPaymentSelect)
    .single();

  if (error) throw new Error(`환불 입금내역 수정 실패: ${error.message}`);
  return mapPayment(data as RefundPaymentRow);
}

export async function deleteRefundPaymentFromSupabase(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("refund_payments").delete().eq("id", id);
  if (error) throw new Error(`환불 입금내역 삭제 실패: ${error.message}`);
}
