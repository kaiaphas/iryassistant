"use client";

import type { Reservation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { formatCurrency } from "@/lib/format";

export function ReservationCardList({
  items,
  onSelect,
}: {
  items: Reservation[];
  onSelect: (item: Reservation) => void;
}) {
  return (
    <div className="space-y-3 lg:hidden">
      {items.map((item) => (
        <Card key={item.orderId}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <ReservationStatusBadge status={item.reservationStatus} />
                <p className="mt-2 font-semibold">{item.orderId}</p>
                <p className="text-sm text-slate-600">{item.productName}</p>
              </div>
              <Button size="sm" onClick={() => onSelect(item)}>상세보기</Button>
            </div>
            <div className="mt-4 space-y-1 text-sm text-slate-600">
              <p>여행일자: {item.tourDate}</p>
              <p>예약자: {item.customerName} / {item.phone}</p>
              <p>인원: 성인 {item.adult}, 소인 {item.child}, 총 {item.totalPeople}명</p>
              <p>호차: {item.busNo || "미정"} · 가이드: {item.guideName || "미정"}</p>
              <p>차량: {item.busInfo || "미배정"}</p>
              <p>결제: {item.paymentType} / {formatCurrency(item.price)}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
