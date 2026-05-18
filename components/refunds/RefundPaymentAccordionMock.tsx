"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";

type RefundPayment = {
  id: string;
  paidAt: string;
  amount: number;
  depositor: string;
  memo: string;
};

type RefundPaymentMockItem = {
  id: string;
  no: number;
  refundDate: string;
  customerName: string;
  departureDate: string;
  peopleCount: number;
  paymentMethod: string;
  reservationDepositAmount: number;
  refundRequestAmount: number;
  status: "환불신청" | "환불완료";
  payments: RefundPayment[];
};

const mockItems: RefundPaymentMockItem[] = [
  {
    id: "refund-001",
    no: 1,
    refundDate: "2026-05-04",
    customerName: "김고객",
    departureDate: "2026-05-10",
    peopleCount: 2,
    paymentMethod: "계좌이체",
    reservationDepositAmount: 100000,
    refundRequestAmount: 300000,
    status: "환불신청",
    payments: [
      { id: "payment-001", paidAt: "2026-05-01", amount: 100000, depositor: "김고객", memo: "1차 입금" },
      { id: "payment-002", paidAt: "2026-05-03", amount: 120000, depositor: "김고객", memo: "2차 입금" },
    ],
  },
  {
    id: "refund-002",
    no: 2,
    refundDate: "2026-05-04",
    customerName: "이여행",
    departureDate: "2026-05-11",
    peopleCount: 1,
    paymentMethod: "홈페이지결제",
    reservationDepositAmount: 80000,
    refundRequestAmount: 180000,
    status: "환불신청",
    payments: [
      { id: "payment-003", paidAt: "2026-05-02", amount: 80000, depositor: "이여행", memo: "예약금 입금" },
    ],
  },
  {
    id: "refund-003",
    no: 3,
    refundDate: "2026-05-04",
    customerName: "박문의",
    departureDate: "2026-05-15",
    peopleCount: 3,
    paymentMethod: "계좌이체",
    reservationDepositAmount: 150000,
    refundRequestAmount: 420000,
    status: "환불신청",
    payments: [],
  },
];

function getPaidTotal(item: RefundPaymentMockItem) {
  return item.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

export function RefundPaymentAccordionMock() {
  const [openIds, setOpenIds] = React.useState<string[]>(["refund-001"]);

  function toggle(id: string) {
    setOpenIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="grid gap-3 p-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-slate-500">권장 구조</p>
            <p className="mt-1 font-semibold">환불건 1 : 입금내역 N</p>
          </div>
          <div>
            <p className="text-slate-500">마스터 입력</p>
            <p className="mt-1 font-semibold">기존 환불등록 유지</p>
          </div>
          <div>
            <p className="text-slate-500">잔금 계산</p>
            <p className="mt-1 font-semibold">환불요청금액 - 실제입금합계</p>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-xl border bg-white shadow-soft">
        <div className="overflow-x-auto">
          <Table className="min-w-[1440px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[76px] text-center">상세</TableHead>
                <TableHead className="w-[70px] text-center">No</TableHead>
                <TableHead className="w-[120px] text-center">환불일자</TableHead>
                <TableHead className="w-[120px] text-center">고객명</TableHead>
                <TableHead className="w-[120px] text-center">출발일자</TableHead>
                <TableHead className="w-[72px] text-center">인원</TableHead>
                <TableHead className="w-[120px] text-center">결제방식</TableHead>
                <TableHead className="w-[120px] text-right">입금액</TableHead>
                <TableHead className="w-[140px] text-right">환불요청금액</TableHead>
                <TableHead className="w-[140px] text-right">실제환불합계</TableHead>
                <TableHead className="w-[120px] text-right">잔금</TableHead>
                <TableHead className="w-[90px] text-center">입금횟수</TableHead>
                <TableHead className="w-[110px] text-center">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockItems.map((item) => {
                const open = openIds.includes(item.id);
                const paidTotal = getPaidTotal(item);
                const balance = Math.max(0, item.refundRequestAmount - paidTotal);

                return (
                  <React.Fragment key={item.id}>
                    <TableRow className={open ? "bg-emerald-50/50" : ""}>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" onClick={() => toggle(item.id)} aria-label={`${item.customerName} 입금내역 보기`}>
                          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">{item.no}</TableCell>
                      <TableCell className="text-center">{item.refundDate}</TableCell>
                      <TableCell className="text-center font-semibold">{item.customerName}</TableCell>
                      <TableCell className="text-center">{item.departureDate}</TableCell>
                      <TableCell className="text-center">{item.peopleCount}</TableCell>
                      <TableCell className="text-center">{item.paymentMethod}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.reservationDepositAmount)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.refundRequestAmount)}</TableCell>
                      <TableCell className="text-right text-emerald-800">{formatCurrency(paidTotal)}</TableCell>
                      <TableCell className="text-right font-semibold text-rose-700">{formatCurrency(balance)}</TableCell>
                      <TableCell className="text-center">{item.payments.length}회</TableCell>
                      <TableCell className="text-center"><StatusBadge value={item.status} /></TableCell>
                    </TableRow>

                    {open ? (
                      <TableRow className="bg-emerald-50/30 hover:bg-emerald-50/30">
                        <TableCell colSpan={13} className="p-3">
                          <div className="rounded-lg border border-emerald-100 bg-white p-3">
                            <div className="mb-3 flex items-center justify-between">
                              <div>
                                <p className="font-semibold">입금내역</p>
                                <p className="text-sm text-slate-500">환불건 저장 후 실제 입금이 발생할 때마다 추가합니다.</p>
                              </div>
                              <Button size="sm"><Plus className="h-3.5 w-3.5" />입금 추가</Button>
                            </div>

                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[140px] text-center">입금일</TableHead>
                                  <TableHead className="w-[140px] text-right">환불액</TableHead>
                                  <TableHead className="w-[140px] text-center">입금자</TableHead>
                                  <TableHead>메모</TableHead>
                                  <TableHead className="w-[120px] text-center">관리</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {item.payments.length > 0 ? item.payments.map((payment) => (
                                  <TableRow key={payment.id}>
                                    <TableCell className="text-center">{payment.paidAt}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                                    <TableCell className="text-center">{payment.depositor}</TableCell>
                                    <TableCell>{payment.memo}</TableCell>
                                    <TableCell className="text-center">
                                      <Button size="sm" variant="outline">수정</Button>
                                    </TableCell>
                                  </TableRow>
                                )) : (
                                  <TableRow>
                                    <TableCell colSpan={5} className="py-5 text-center text-slate-500">
                                      아직 등록된 실제 입금내역이 없습니다.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
