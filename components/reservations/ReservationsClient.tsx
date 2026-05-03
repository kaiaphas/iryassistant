"use client";

import * as React from "react";
import type { ScheduleGroup } from "@/lib/types";
import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ReservationFilters, type ReservationFilterState } from "@/components/reservations/ReservationFilters";
import { ScheduleAccordionCards } from "@/components/reservations/ScheduleAccordionCards";
import { ScheduleAccordionTable } from "@/components/reservations/ScheduleAccordionTable";

export function ReservationsClient({ scheduleGroups }: { scheduleGroups: ScheduleGroup[] }) {
  const [schedules, setSchedules] = React.useState(scheduleGroups);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [saveMessage, setSaveMessage] = React.useState<string>("");
  const [filters, setFilters] = React.useState<ReservationFilterState>({
    query: "",
    startDate: "",
    endDate: "",
    status: "",
    tourType: "",
    guide: "",
    restaurantStatus: "",
    hotelStatus: "",
  });
  const [openIds, setOpenIds] = React.useState<string[]>([scheduleGroups[2]?.id].filter(Boolean));

  const filtered = schedules.filter((schedule) => {
    const q = filters.query.trim().toLowerCase();
    const dateMatch =
      (!filters.startDate || schedule.tourDate >= filters.startDate)
      && (!filters.endDate || schedule.tourDate <= filters.endDate);
    const queryMatch =
      !q ||
      [
        schedule.productName,
        schedule.productCode,
        schedule.guide.name,
        schedule.driver.name,
        ...schedule.restaurantBookings.flatMap((booking) => [booking.name, booking.mealType]),
        schedule.hotelBooking.name,
        schedule.vehicle.busInfo,
      ].some((value) => value?.toLowerCase().includes(q));
    const statusMatch = !filters.status || schedule.progressStatus === filters.status;
    return dateMatch
      && queryMatch
      && statusMatch
      && (!filters.tourType || schedule.tourType === filters.tourType)
      && (!filters.guide || schedule.guide.name === filters.guide)
      && (!filters.restaurantStatus || schedule.restaurantBookings.some((booking) => booking.status === filters.restaurantStatus))
      && (!filters.hotelStatus || schedule.tourType === "당일" || schedule.hotelBooking.status === filters.hotelStatus);
  });

  function toggleSchedule(id: string) {
    setOpenIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function updateSchedule(nextSchedule: ScheduleGroup) {
    setSchedules((current) => current.map((schedule) => schedule.id === nextSchedule.id ? nextSchedule : schedule));
  }

  async function saveSchedule(schedule: ScheduleGroup) {
    setSavingId(schedule.id);
    setSaveMessage("");

    try {
      const response = await fetch(`/api/reservations/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "저장에 실패했습니다.");
      }

      setSaveMessage(`${schedule.productName} 저장 완료`);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-1">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div><p className="text-sm text-slate-500">전체 일정</p><p className="mt-1 text-2xl font-bold">{filtered.length}건</p></div>
            <CalendarDays className="h-6 w-6 text-emerald-700" />
          </CardContent>
        </Card>
      </div>
        <ReservationFilters value={filters} onChange={setFilters} />
        {saveMessage ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            {saveMessage}
          </div>
        ) : null}
        <ScheduleAccordionTable
          schedules={filtered}
          openIds={openIds}
          onToggle={toggleSchedule}
          onChangeSchedule={updateSchedule}
          onSaveSchedule={saveSchedule}
          savingId={savingId}
        />
        <ScheduleAccordionCards
          schedules={filtered}
          openIds={openIds}
          onToggle={toggleSchedule}
          onChangeSchedule={updateSchedule}
          onSaveSchedule={saveSchedule}
          savingId={savingId}
        />
    </div>
  );
}
