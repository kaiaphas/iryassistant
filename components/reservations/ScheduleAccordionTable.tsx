"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Save } from "lucide-react";
import type { ScheduleGroup } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RestaurantReservationSection } from "@/components/reservations/RestaurantReservationSection";
import { HotelReservationSection } from "@/components/reservations/HotelReservationSection";
import { ReservationMemoSection } from "@/components/reservations/ReservationMemoSection";

export function ScheduleAccordionTable({
  schedules,
  openIds,
  onToggle,
  onChangeSchedule,
  onSaveSchedule,
  savingId,
}: {
  schedules: ScheduleGroup[];
  openIds: string[];
  onToggle: (id: string) => void;
  onChangeSchedule: (schedule: ScheduleGroup) => void;
  onSaveSchedule: (schedule: ScheduleGroup) => void;
  savingId?: string | null;
}) {
  return (
    <div className="hidden overflow-hidden rounded-xl border bg-white shadow-soft lg:block">
      <div className="overflow-x-auto scrollbar-thin">
        <Table className="min-w-[1180px]">
          <TableHeader>
            <TableRow>
              {["여행일자", "구분", "상품명", "출발시간", "귀환시간", "인승", "가이드", "기사", "식사", "식당명", "식당 진행상태", "숙소명", "숙소 진행상태", "진행상태"].map((head) => (
                <TableHead key={head}>{head}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => {
              const open = openIds.includes(schedule.id);
              const mainRestaurant = schedule.restaurantBookings[0];
              return (
                <React.Fragment key={schedule.id}>
                  <TableRow
                    className={open ? "border-l-4 border-l-emerald-700 bg-emerald-50" : ""}
                    onClick={() => onToggle(schedule.id)}
                  >
                    <TableCell>
                      <button className="flex items-center gap-2 font-semibold">
                        {open ? <ChevronDown className="h-4 w-4 text-emerald-700" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                        <span>{schedule.tourDate}<br /><span className="text-xs text-slate-500">({schedule.dayLabel})</span></span>
                      </button>
                    </TableCell>
                    <TableCell><StatusBadge value={schedule.tourType} /></TableCell>
                    <TableCell className="font-semibold">{schedule.productName}</TableCell>
                    <TableCell>{schedule.departureTime}</TableCell>
                    <TableCell>{schedule.returnTime}</TableCell>
                    <TableCell className="font-semibold text-emerald-800">{schedule.vehicle.busType}</TableCell>
                    <TableCell>{schedule.guide.name}</TableCell>
                    <TableCell>{schedule.driver.name}</TableCell>
                    <TableCell>{mainRestaurant?.mealType || "-"}</TableCell>
                    <TableCell className="min-w-[220px] whitespace-normal font-medium">
                      {schedule.restaurantBookings.map((booking) => `${booking.mealType} · ${booking.name}`).join(" / ") || "-"}
                    </TableCell>
                    <TableCell><StatusBadge value={mainRestaurant?.status || "예약전"} /></TableCell>
                    <TableCell>{schedule.tourType === "숙박" ? schedule.hotelBooking.name || "-" : "-"}</TableCell>
                    <TableCell>{schedule.tourType === "숙박" ? <StatusBadge value={schedule.hotelBooking.status} /> : "-"}</TableCell>
                    <TableCell><StatusBadge value={schedule.progressStatus} /></TableCell>
                  </TableRow>
                  {open ? (
                    <TableRow className="bg-emerald-50/60 hover:bg-emerald-50/60">
                      <TableCell colSpan={14} className="p-4">
                        <div className="ml-6 space-y-3 border-l-2 border-emerald-200 pl-4">
                          <RestaurantReservationSection schedule={schedule} onChange={onChangeSchedule} />
                          {schedule.tourType === "숙박" ? <HotelReservationSection schedule={schedule} onChange={onChangeSchedule} /> : null}
                          <ReservationMemoSection schedule={schedule} onChange={onChangeSchedule} />
                          <div className="flex justify-end">
                            <Button onClick={() => onSaveSchedule(schedule)} disabled={savingId === schedule.id}>
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
