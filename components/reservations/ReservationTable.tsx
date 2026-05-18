"use client";

import type { Reservation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { TablePagination, tablePageSize } from "@/components/common/TablePagination";
import * as React from "react";

export function ReservationTable({
  items,
  onSelect,
}: {
  items: Reservation[];
  onSelect: (item: Reservation) => void;
}) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / tablePageSize));
  const visibleItems = items.slice((page - 1) * tablePageSize, page * tablePageSize);

  React.useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <div className="hidden overflow-hidden rounded-xl border bg-white shadow-soft lg:block">
      <div className="overflow-x-auto scrollbar-thin">
        <Table className="min-w-[1500px]">
          <TableHeader>
            <TableRow>
              {["주문번호", "여행일자", "상품명", "예약자명", "연락처", "탑승장소", "총인원", "결제금액", "결제방식", "예약상태", "호차", "가이드", "기사", "차량정보", "숙소", "식당", "진행상태", "담당", "예약일자", ""].map((head) => (
                <TableHead key={head}>{head}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleItems.map((item) => (
              <TableRow key={item.orderId}>
                <TableCell className="font-semibold">{item.orderId}</TableCell>
                <TableCell>{item.tourDate}</TableCell>
                <TableCell>{item.productName}</TableCell>
                <TableCell>{item.customerName}</TableCell>
                <TableCell>{item.phone}</TableCell>
                <TableCell>{item.station}</TableCell>
                <TableCell>{item.totalPeople}명</TableCell>
                <TableCell>{formatCurrency(item.price)}</TableCell>
                <TableCell>{item.paymentType}</TableCell>
                <TableCell><ReservationStatusBadge status={item.reservationStatus} /></TableCell>
                <TableCell>{item.busNo || "-"}</TableCell>
                <TableCell>{item.guideName || "-"}</TableCell>
                <TableCell>{item.driverName || "-"}</TableCell>
                <TableCell>{item.busInfo || "-"}</TableCell>
                <TableCell>{item.hotelName || "-"}</TableCell>
                <TableCell>{item.restaurantName || "-"}</TableCell>
                <TableCell><StatusBadge value={item.progressStatus} /></TableCell>
                <TableCell>{item.staffName}</TableCell>
                <TableCell>{item.reservationDate}</TableCell>
                <TableCell><Button size="sm" variant="outline" onClick={() => onSelect(item)}>상세</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
        <TablePagination totalCount={items.length} page={page} onPageChange={setPage} />
      </div>
  );
}
