"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Save } from "lucide-react";
import type { Driver, Guide, Hotel, Restaurant, ScheduleGroup } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TourTypeBadge } from "@/components/common/TourTypeBadge";
import { RestaurantReservationSection } from "@/components/reservations/RestaurantReservationSection";
import { HotelReservationSection } from "@/components/reservations/HotelReservationSection";
import { ReservationMemoSection } from "@/components/reservations/ReservationMemoSection";
import { ScheduleOperationSection } from "@/components/reservations/ScheduleOperationSection";
import { getRestaurantAggregateStatus, getScheduleProgressStatus } from "@/lib/reservation-status";
import { formatPersonWithPhone } from "@/lib/schedule-display";
import { SortableTableHead, type SortDirection } from "@/components/common/SortableTableHead";

type ScheduleSortKey = "tourDate" | "tourType" | "productName" | "busNo" | "departureTime" | "reservationCount" | "busCompany" | "busType" | "guide" | "driver" | "restaurant" | "hotel" | "restaurantStatus" | "provisionalStatus" | "hotelStatus" | "progressStatus";

export function ScheduleAccordionTable({
  schedules,
  openIds,
  onToggle,
  onChangeSchedule,
  onSaveSchedule,
  savingId,
  guides,
  drivers,
  restaurants,
  hotels,
  sortKey,
  sortDirection,
  sortApplied,
  onSort,
}: {
  schedules: ScheduleGroup[];
  openIds: string[];
  onToggle: (id: string) => void;
  onChangeSchedule: (schedule: ScheduleGroup) => void;
  onSaveSchedule: (schedule: ScheduleGroup) => void;
  savingId?: string | null;
  guides: Guide[];
  drivers: Driver[];
  restaurants: Restaurant[];
  hotels: Hotel[];
  sortKey: ScheduleSortKey;
  sortDirection: SortDirection;
  sortApplied: boolean;
  onSort: (key: ScheduleSortKey) => void;
}) {
  const headers: Array<{ label: string; key: ScheduleSortKey; className: string }> = [
    { label: "여행일자", key: "tourDate", className: "w-[98px] px-2 text-center" },
    { label: "구분", key: "tourType", className: "w-[64px] text-center" },
    { label: "상품명", key: "productName", className: "min-w-[180px]" },
    { label: "호차", key: "busNo", className: "w-[68px] text-center" },
    { label: "출발", key: "departureTime", className: "w-[70px] text-center" },
    { label: "인원", key: "reservationCount", className: "w-[62px] text-center" },
    { label: "버스회사", key: "busCompany", className: "w-[112px] text-center" },
    { label: "인승", key: "busType", className: "w-[74px] text-center" },
    { label: "가이드", key: "guide", className: "w-[150px] text-center" },
    { label: "기사", key: "driver", className: "w-[150px] text-center" },
    { label: "식당명", key: "restaurant", className: "min-w-[180px]" },
    { label: "숙소명", key: "hotel", className: "min-w-[130px]" },
    { label: "식당예약", key: "restaurantStatus", className: "w-[112px] text-center" },
    { label: "임시예약", key: "provisionalStatus", className: "w-[92px] text-center" },
    { label: "숙소예약", key: "hotelStatus", className: "w-[112px] text-center" },
    { label: "진행상태", key: "progressStatus", className: "w-[112px] text-center" },
  ];

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-white shadow-soft lg:block">
      <div className="overflow-x-auto scrollbar-thin">
        <Table className="min-w-[1370px]">
          <TableHeader>
            <TableRow>
              {headers.map((head) => (
                <SortableTableHead key={head.label} label={head.label} className={head.className} active={sortApplied && sortKey === head.key} direction={sortDirection} onClick={() => onSort(head.key)} />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => {
              const open = openIds.includes(schedule.id);
              const restaurantStatus = getRestaurantAggregateStatus(schedule.restaurantBookings);
              const progressStatus = getScheduleProgressStatus(schedule);
              return (
                <React.Fragment key={schedule.id}>
                  <TableRow
                    className={open ? "border-l-4 border-l-emerald-700 bg-emerald-50/80" : ""}
                    onClick={() => onToggle(schedule.id)}
                  >
                    <TableCell className="w-[98px] text-center">
                      <button className="mx-auto flex items-center gap-1.5 font-semibold">
                        {open ? <ChevronDown className="h-4 w-4 text-emerald-700" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                        <span className="whitespace-nowrap leading-tight">{schedule.tourDate}<br /><span className="text-[11px] text-slate-500">({schedule.dayLabel})</span></span>
                      </button>
                    </TableCell>
                    <TableCell className="text-center"><TourTypeBadge value={schedule.tourType} /></TableCell>
                    <TableCell className="max-w-[180px] truncate font-semibold" title={schedule.productName}>{schedule.productName}</TableCell>
                    <TableCell className="whitespace-nowrap text-center">{schedule.busNo || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap text-center font-semibold">{schedule.departureTime}</TableCell>
                    <TableCell className="whitespace-nowrap text-center font-semibold">{schedule.reservationCount}명</TableCell>
                    <TableCell className="max-w-[112px] truncate text-center" title={schedule.vehicle.busCompany || ""}>{schedule.vehicle.busCompany || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap text-center font-semibold text-emerald-800">{schedule.vehicle.busType || "-"}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-center" title={formatPersonWithPhone(schedule.guide)}>{formatPersonWithPhone(schedule.guide)}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-center" title={formatPersonWithPhone(schedule.driver)}>{formatPersonWithPhone(schedule.driver)}</TableCell>
                    <TableCell className="max-w-[230px] truncate font-medium" title={schedule.restaurantBookings.map((booking) => `${booking.mealType} · ${booking.name}`).join(" / ")}>
                      {schedule.restaurantBookings.map((booking) => `${booking.mealType} · ${booking.name}`).join(" / ") || "-"}
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate" title={schedule.hotelBooking.name}>{schedule.tourType === "숙박" ? schedule.hotelBooking.name || "-" : "-"}</TableCell>
                    <TableCell className="w-[112px] text-center"><StatusBadge value={restaurantStatus} /></TableCell>
                    <TableCell className="w-[92px] text-center">{schedule.tourType === "숙박" ? <StatusBadge value={schedule.hotelBooking.provisionalStatus} /> : "-"}</TableCell>
                    <TableCell className="w-[112px] text-center">{schedule.tourType === "숙박" ? <StatusBadge value={schedule.hotelBooking.status} /> : "-"}</TableCell>
                    <TableCell className="w-[112px] text-center"><StatusBadge value={progressStatus} /></TableCell>
                  </TableRow>
                  {open ? (
                    <TableRow className="bg-emerald-50/40 hover:bg-emerald-50/40">
                      <TableCell colSpan={16} className="p-2">
                        <div className="ml-2 space-y-2 border-l-2 border-emerald-200 pl-2">
                          <ScheduleOperationSection schedule={schedule} guides={guides} drivers={drivers} onChange={onChangeSchedule} />
                          <RestaurantReservationSection schedule={schedule} restaurants={restaurants} onChange={onChangeSchedule} />
                          {schedule.tourType === "숙박" ? <HotelReservationSection schedule={schedule} hotels={hotels} onChange={onChangeSchedule} /> : null}
                          <ReservationMemoSection schedule={schedule} onChange={onChangeSchedule} />
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                onSaveSchedule(schedule);
                              }}
                              disabled={savingId === schedule.id}
                            >
                              <Save className="h-4 w-4" />
                              {savingId === schedule.id ? "저장 중" : "저장"}
                            </Button>
                          </div>
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
      <div className="flex items-center justify-between border-t px-5 py-3 text-sm font-semibold">
        <span>총 {schedules.length}개의 일정</span>
      </div>
    </div>
  );
}
