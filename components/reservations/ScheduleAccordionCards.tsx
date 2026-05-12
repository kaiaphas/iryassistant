"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Save } from "lucide-react";
import type { Driver, Guide, Hotel, Restaurant, ScheduleGroup } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TourTypeBadge } from "@/components/common/TourTypeBadge";
import { RestaurantReservationSection } from "@/components/reservations/RestaurantReservationSection";
import { HotelReservationSection } from "@/components/reservations/HotelReservationSection";
import { ReservationMemoSection } from "@/components/reservations/ReservationMemoSection";
import { ScheduleOperationSection } from "@/components/reservations/ScheduleOperationSection";
import { getRestaurantAggregateStatus, getScheduleProgressStatus } from "@/lib/reservation-status";
import { formatPersonWithPhone } from "@/lib/schedule-display";

export function ScheduleAccordionCards({
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
  return (
    <div className="space-y-3 lg:hidden">
      {schedules.map((schedule) => {
        const open = openIds.includes(schedule.id);
        const restaurantStatus = getRestaurantAggregateStatus(schedule.restaurantBookings);
        const progressStatus = getScheduleProgressStatus(schedule);
        return (
          <Card key={schedule.id} className={open ? "border-emerald-600 bg-emerald-50/40" : ""}>
            <CardContent className="p-4">
              <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => onToggle(schedule.id)}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold text-slate-600">{schedule.tourDate} ({schedule.dayLabel})</p>
                    <TourTypeBadge value={schedule.tourType} />
                  </div>
                  <p className="mt-2 font-semibold">{schedule.productName}</p>
                  <p className="mt-2 text-sm text-slate-600">출발 {schedule.departureTime} · 인원 {schedule.reservationCount}명</p>
                  <p className="text-sm text-slate-600">{schedule.busNo || "-"} · {schedule.vehicle.busCompany || "-"} · {schedule.vehicle.busType || "-"}</p>
                  <p className="mt-1 text-sm text-slate-600">가이드 {formatPersonWithPhone(schedule.guide)}</p>
                  <p className="text-sm text-slate-600">기사 {formatPersonWithPhone(schedule.driver)}</p>
                </div>
                {open ? <ChevronDown className="h-5 w-5 text-emerald-700" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
              </button>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border bg-white p-2">
                  <p className="text-slate-500">식당</p>
                  <p className="mt-1 font-semibold">{schedule.restaurantBookings.map((booking) => `${booking.mealType} · ${booking.name}`).join(" / ") || "-"}</p>
                  <div className="mt-1"><StatusBadge value={restaurantStatus} /></div>
                </div>
                {schedule.tourType === "숙박" ? (
                  <div className="rounded-lg border bg-white p-2">
                    <p className="text-slate-500">숙소</p>
                    <p className="mt-1 font-semibold">{schedule.hotelBooking.name || "-"}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <StatusBadge value={`가예약 ${schedule.hotelBooking.provisionalStatus}`} />
                      <StatusBadge value={`실제 ${schedule.hotelBooking.status}`} />
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge value={progressStatus} />
              </div>
              {open ? (
                <div className="mt-4 space-y-3">
                  <ScheduleOperationSection schedule={schedule} guides={guides} drivers={drivers} onChange={onChangeSchedule} />
                  <RestaurantReservationSection schedule={schedule} restaurants={restaurants} onChange={onChangeSchedule} />
                  {schedule.tourType === "숙박" ? <HotelReservationSection schedule={schedule} hotels={hotels} onChange={onChangeSchedule} /> : null}
                  <ReservationMemoSection schedule={schedule} onChange={onChangeSchedule} />
                  <Button
                    type="button"
                    className="w-full"
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
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
