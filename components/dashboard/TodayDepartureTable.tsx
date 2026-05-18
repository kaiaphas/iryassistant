"use client";

import * as React from "react";
import type { ScheduleGroup } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getScheduleProgressStatus } from "@/lib/reservation-status";
import { TablePagination, tablePageSize } from "@/components/common/TablePagination";

export function TodayDepartureTable({ schedules }: { schedules: ScheduleGroup[] }) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(schedules.length / tablePageSize));
  const visibleSchedules = schedules.slice((page - 1) * tablePageSize, page * tablePageSize);

  React.useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const headers = [
    { label: "출발일자", className: "w-[118px] px-2 text-center" },
    { label: "구분", className: "w-[64px] text-center" },
    { label: "출발시간", className: "w-[82px] text-center" },
    { label: "인원", className: "w-[64px] text-center" },
    { label: "상품명", className: "w-[150px]" },
    { label: "호차", className: "w-[70px] text-center" },
    { label: "가이드", className: "w-[150px] text-center" },
    { label: "기사", className: "w-[150px] text-center" },
    { label: "차량", className: "w-[90px] text-center" },
    { label: "진행상태", className: "w-[96px] text-center" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>금일 이후 7일 일정</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[780px]">
            <TableHeader>
              <TableRow>
                {headers.map((head) => (
                  <TableHead key={head.label} className={head.className}>{head.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSchedules.length > 0 ? visibleSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="w-[118px] px-2 text-center font-semibold whitespace-nowrap">{schedule.tourDate} ({schedule.dayLabel})</TableCell>
                  <TableCell className="text-center">{schedule.tourType}</TableCell>
                  <TableCell className="text-center font-semibold">{schedule.departureTime}</TableCell>
                  <TableCell className="text-center font-semibold">{schedule.reservationCount}명</TableCell>
                  <TableCell className="font-medium text-slate-900">{schedule.productName}</TableCell>
                  <TableCell className="text-center">{schedule.busNo || "-"}</TableCell>
                  <TableCell className="text-center">{schedule.guide.name || "-"}</TableCell>
                  <TableCell className="text-center">{schedule.driver.name || "-"}</TableCell>
                  <TableCell className="text-center">{schedule.vehicle.busType || "-"}</TableCell>
                  <TableCell className="text-center"><StatusBadge value={getScheduleProgressStatus(schedule)} /></TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-slate-500">
                    금일 이후 7일 일정이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination totalCount={schedules.length} page={page} onPageChange={setPage} unit="개" />
      </CardContent>
    </Card>
  );
}
