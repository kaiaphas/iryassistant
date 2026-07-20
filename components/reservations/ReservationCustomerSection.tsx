"use client";

import { Printer, Users } from "lucide-react";
import type { ScheduleGroup } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function peopleLabel(adult: number, child: number) {
  return [adult > 0 ? `주안 ${adult}` : "", child > 0 ? `메가 ${child}` : ""].filter(Boolean).join(" / ") || "-";
}

export function ReservationCustomerSection({
  schedule,
  onPrint,
}: {
  schedule: ScheduleGroup;
  onPrint: (schedule: ScheduleGroup) => void;
}) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
          <Users className="h-4 w-4" />
          예약자 명단
          <span className="text-xs font-medium text-slate-500">{schedule.reservations.length}건</span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onPrint(schedule)} disabled={schedule.reservations.length === 0}>
          <Printer className="h-4 w-4" />
          예약자 명단 인쇄
        </Button>
      </div>

      {schedule.reservations.length > 0 ? (
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-[960px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">이름</TableHead>
                <TableHead className="w-[150px]">전화번호</TableHead>
                <TableHead className="w-[110px] text-center">예약인원</TableHead>
                <TableHead className="w-[100px] text-center">상태</TableHead>
                <TableHead className="w-[120px] text-center">입금일</TableHead>
                <TableHead className="w-[200px] whitespace-nowrap">탑승지</TableHead>
                <TableHead>비고</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.reservations.map((reservation) => (
                <TableRow key={reservation.orderId}>
                  <TableCell className="font-semibold">{reservation.customerName}</TableCell>
                  <TableCell className="whitespace-nowrap">{reservation.phone || "-"}</TableCell>
                  <TableCell className="text-center">{peopleLabel(reservation.adult, reservation.child)}</TableCell>
                  <TableCell className="text-center">{reservation.reservationStatus || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{reservation.paymentDate || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">{reservation.station || "-"}</TableCell>
                  <TableCell>{reservation.internalMemo || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-slate-500">
          연동된 예약자 명단이 없습니다.
        </div>
      )}
    </section>
  );
}
