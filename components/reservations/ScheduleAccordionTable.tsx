"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Save } from "lucide-react";
import type { Driver, Guide, Hotel, Restaurant, ScheduleGroup } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TourTypeBadge } from "@/components/common/TourTypeBadge";
import { RestaurantReservationSection } from "@/components/reservations/RestaurantReservationSection";
import { HotelReservationSection } from "@/components/reservations/HotelReservationSection";
import { ReservationMemoSection } from "@/components/reservations/ReservationMemoSection";
import { ScheduleOperationSection } from "@/components/reservations/ScheduleOperationSection";
import { getRestaurantAggregateStatus, getScheduleProgressStatus } from "@/lib/reservation-status";
import { formatPersonWithPhone } from "@/lib/schedule-display";

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
}) {
  const headers = [
    { label: "여행일자", className: "w-[98px] px-2 text-center" },
    { label: "구분", className: "w-[64px] text-center" },
    { label: "상품명", className: "min-w-[180px]" },
    { label: "호차", className: "w-[68px] text-center" },
    { label: "출발", className: "w-[70px] text-center" },
    { label: "버스회사", className: "w-[112px] text-center" },
    { label: "인승", className: "w-[74px] text-center" },
    { label: "가이드", className: "w-[150px] text-center" },
    { label: "기사", className: "w-[150px] text-center" },
    { label: "식사", className: "w-[64px] text-center" },
    { label: "식당명", className: "min-w-[180px]" },
    { label: "식당상태", className: "w-[112px] text-center" },
    { label: "숙소명", className: "min-w-[130px]" },
    { label: "숙소상태", className: "w-[112px] text-center" },
    { label: "진행상태", className: "w-[112px] text-center" },
  ];

  return (
    <div className="hidden overflow-hidden rounded-xl border bg-white shadow-soft lg:block">
      <div className="overflow-x-auto scrollbar-thin">
        <Table className="min-w-[1340px] text-xs">
          <TableHeader>
            <TableRow>
              {headers.map((head) => (
                <TableHead key={head.label} className={`h-9 px-2 text-[11px] ${head.className}`}>{head.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => {
              const open = openIds.includes(schedule.id);
              const mainRestaurant = schedule.restaurantBookings[0];
              const restaurantStatus = getRestaurantAggregateStatus(schedule.restaurantBookings);
              const progressStatus = getScheduleProgressStatus(schedule);
              return (
                <React.Fragment key={schedule.id}>
                  <TableRow
                    className={open ? "border-l-4 border-l-emerald-700 bg-emerald-50/80" : ""}
                    onClick={() => onToggle(schedule.id)}
                  >
                    <TableCell className="w-[98px] px-2 py-2 text-center">
                      <button className="mx-auto flex items-center gap-1.5 font-semibold">
                        {open ? <ChevronDown className="h-4 w-4 text-emerald-700" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                        <span className="whitespace-nowrap leading-tight">{schedule.tourDate}<br /><span className="text-[11px] text-slate-500">({schedule.dayLabel})</span></span>
                      </button>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-center"><TourTypeBadge value={schedule.tourType} /></TableCell>
                    <TableCell className="max-w-[180px] truncate px-2 py-2 font-semibold" title={schedule.productName}>{schedule.productName}</TableCell>
                    <TableCell className="whitespace-nowrap px-2 py-2 text-center">{schedule.busNo || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap px-2 py-2 text-center font-semibold">{schedule.departureTime}</TableCell>
                    <TableCell className="max-w-[112px] truncate px-2 py-2 text-center" title={schedule.vehicle.busCompany || ""}>{schedule.vehicle.busCompany || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap px-2 py-2 text-center font-semibold text-emerald-800">{schedule.vehicle.busType || "-"}</TableCell>
                    <TableCell className="max-w-[150px] truncate px-2 py-2 text-center" title={formatPersonWithPhone(schedule.guide)}>{formatPersonWithPhone(schedule.guide)}</TableCell>
                    <TableCell className="max-w-[150px] truncate px-2 py-2 text-center" title={formatPersonWithPhone(schedule.driver)}>{formatPersonWithPhone(schedule.driver)}</TableCell>
                    <TableCell className="whitespace-nowrap px-2 py-2 text-center">{mainRestaurant?.mealType || "-"}</TableCell>
                    <TableCell className="max-w-[230px] truncate px-2 py-2 font-medium" title={schedule.restaurantBookings.map((booking) => `${booking.mealType} · ${booking.name}`).join(" / ")}>
                      {schedule.restaurantBookings.map((booking) => `${booking.mealType} · ${booking.name}`).join(" / ") || "-"}
                    </TableCell>
                    <TableCell className="w-[112px] px-2 py-2 text-center"><StatusBadge value={restaurantStatus} /></TableCell>
                    <TableCell className="max-w-[140px] truncate px-2 py-2" title={schedule.hotelBooking.name}>{schedule.tourType === "숙박" ? schedule.hotelBooking.name || "-" : "-"}</TableCell>
                    <TableCell className="w-[112px] px-2 py-2 text-center">{schedule.tourType === "숙박" ? <StatusBadge value={schedule.hotelBooking.status} /> : "-"}</TableCell>
                    <TableCell className="w-[112px] px-2 py-2 text-center"><StatusBadge value={progressStatus} /></TableCell>
                  </TableRow>
                  {open ? (
                    <TableRow className="bg-emerald-50/40 hover:bg-emerald-50/40">
                      <TableCell colSpan={15} className="p-3">
                        <div className="ml-3 space-y-2 border-l-2 border-emerald-200 pl-3">
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
        <span>20개씩 보기</span>
      </div>
    </div>
  );
}
