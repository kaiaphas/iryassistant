"use client";

import type { Reservation } from "@/lib/types";
import { Sheet } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/format";

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value || "-"}</span>
    </div>
  );
}

export function ReservationDetailDrawer({
  reservation,
  open,
  onOpenChange,
}: {
  reservation?: Reservation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="예약 상세">
      {reservation ? (
        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-emerald-800">기본 정보</h3>
            <InfoRow label="주문번호" value={reservation.orderId} />
            <InfoRow label="예약자명" value={reservation.customerName} />
            <InfoRow label="연락처" value={reservation.phone} />
            <InfoRow label="여행일자" value={formatDate(reservation.tourDate)} />
            <InfoRow label="상품명" value={reservation.productName} />
            <InfoRow label="탑승장소" value={reservation.station} />
            <InfoRow label="총인원" value={`${reservation.totalPeople}명`} />
            <InfoRow label="성인" value={`${reservation.adult}명`} />
            <InfoRow label="소인" value={`${reservation.child}명`} />
          </section>
          <Separator />
          <section>
            <h3 className="mb-2 text-sm font-semibold text-emerald-800">결제 정보</h3>
            <InfoRow label="결제금액" value={formatCurrency(reservation.price)} />
            <InfoRow label="결제방식" value={reservation.paymentType} />
            <InfoRow label="결제일자" value={formatDate(reservation.paymentDate)} />
            <InfoRow label="예약상태" value={reservation.reservationStatus} />
            <InfoRow label="예약일자" value={formatDate(reservation.reservationDate)} />
            <InfoRow label="담당직원" value={reservation.staffName} />
          </section>
          <Separator />
          <section>
            <h3 className="mb-2 text-sm font-semibold text-emerald-800">배차/운영 정보</h3>
            <InfoRow label="출발시간" value={reservation.departureTime} />
            <InfoRow label="귀환시간" value={reservation.returnTime} />
            <InfoRow label="호차번호" value={reservation.busNo} />
            <InfoRow label="차량정보" value={reservation.busInfo} />
            <InfoRow label="차종" value={reservation.busType} />
            <InfoRow label="기사명" value={reservation.driverName} />
            <InfoRow label="가이드명" value={reservation.guideName} />
            <InfoRow label="숙소명" value={reservation.hotelName} />
            <InfoRow label="숙박상태" value={reservation.hotelStatus} />
            <InfoRow label="업체식당" value={reservation.restaurantName} />
            <InfoRow label="진행상태" value={reservation.progressStatus} />
          </section>
          <Separator />
          <section>
            <h3 className="mb-2 text-sm font-semibold text-emerald-800">메모</h3>
            <InfoRow label="고객요청" value={reservation.customerMessage} />
            <InfoRow label="내부메모" value={reservation.internalMemo} />
            <InfoRow label="배차메모" value={reservation.dispatchMemo} />
          </section>
        </div>
      ) : null}
    </Sheet>
  );
}
