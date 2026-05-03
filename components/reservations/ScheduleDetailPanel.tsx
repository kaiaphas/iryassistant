"use client";

import type { ScheduleGroup } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { FacilityStatusSelector } from "@/components/reservations/FacilityStatusSelector";

function Row({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value || "-"}</span>
    </div>
  );
}

export function ScheduleDetailPanel({
  schedule,
  onChange,
}: {
  schedule?: ScheduleGroup;
  onChange: (schedule: ScheduleGroup) => void;
}) {
  if (!schedule) {
    return (
      <Card className="sticky top-20">
        <CardContent className="p-6 text-sm text-slate-500">일정을 선택하면 상세 정보가 표시됩니다.</CardContent>
      </Card>
    );
  }

  const currentSchedule = schedule;
  const totalPeople = currentSchedule.reservations.reduce((sum, item) => sum + item.totalPeople, 0);

  function patchSchedule(patch: Partial<ScheduleGroup>) {
    onChange({ ...currentSchedule, ...patch });
  }

  function patchHotel(patch: Partial<ScheduleGroup["hotelBooking"]>) {
    onChange({ ...currentSchedule, hotelBooking: { ...currentSchedule.hotelBooking, ...patch } });
  }

  function patchRooms(patch: Partial<ScheduleGroup["hotelBooking"]["rooms"]>) {
    onChange({
      ...currentSchedule,
      hotelBooking: {
        ...currentSchedule.hotelBooking,
        rooms: { ...currentSchedule.hotelBooking.rooms, ...patch },
      },
    });
  }

  return (
    <aside className="space-y-4 xl:sticky xl:top-20">
      <div className="overflow-hidden rounded-xl border bg-white shadow-soft">
        <div className="grid grid-cols-2 border-b text-sm font-semibold">
          <div className="border-b-2 border-emerald-700 py-3 text-center text-emerald-800">일정 상세</div>
          <div className="py-3 text-center text-slate-500">예약자 상세</div>
        </div>
        <div className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-emerald-800">일정 정보</h3>
          <Row label="상품명" value={schedule.productName} />
          <Row label="여행일자" value={`${formatDate(schedule.tourDate)} (${schedule.dayLabel})`} />
          <Row label="출발시간" value={schedule.departureTime} />
          <Row label="귀환시간" value={schedule.returnTime} />
          <Row label="호차번호" value={schedule.busNo} />
          <Row label="차량/차종" value={schedule.vehicle.busInfo} />
          <Row label="기사명" value={`${schedule.driver.name}${schedule.driver.phone ? ` (${schedule.driver.phone})` : ""}`} />
          <Row label="가이드명" value={`${schedule.guide.name}${schedule.guide.phone ? ` (${schedule.guide.phone})` : ""}`} />
          <Row label="식당명" value={schedule.restaurantBookings.map((booking) => `${booking.mealType} ${booking.name}`).join(", ")} />
          <Row label="숙소명" value={schedule.hotelBooking.name} />
          <Row label="총인원" value={`${totalPeople}명`} />
          <div className="mt-2"><StatusBadge value={schedule.progressStatus} /></div>
          <label className="mt-4 block text-sm font-medium text-slate-600">
            운영메모
            <textarea
              className="mt-2 min-h-20 w-full rounded-md border bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              value={schedule.dispatchMemo || ""}
              onChange={(event) => patchSchedule({ dispatchMemo: event.target.value })}
            />
          </label>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>숙소 예약현황</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={schedule.hotelBooking.name}
            onChange={(event) => patchHotel({ name: event.target.value })}
            placeholder="숙소명"
          />
          <Input
            value={schedule.hotelBooking.phone || ""}
            onChange={(event) => patchHotel({ phone: event.target.value })}
            placeholder="연락처"
          />
          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs font-medium text-slate-500">
              2인실
              <Input
                className="mt-1"
                type="number"
                min={0}
                value={schedule.hotelBooking.rooms.double}
                onChange={(event) => patchRooms({ double: Number(event.target.value) })}
              />
            </label>
            <label className="text-xs font-medium text-slate-500">
              3인실
              <Input
                className="mt-1"
                type="number"
                min={0}
                value={schedule.hotelBooking.rooms.triple}
                onChange={(event) => patchRooms({ triple: Number(event.target.value) })}
              />
            </label>
            <label className="text-xs font-medium text-slate-500">
              4인실
              <Input
                className="mt-1"
                type="number"
                min={0}
                value={schedule.hotelBooking.rooms.quadruple}
                onChange={(event) => patchRooms({ quadruple: Number(event.target.value) })}
              />
            </label>
          </div>
          <div className="rounded-lg border bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
            총 {schedule.hotelBooking.rooms.double + schedule.hotelBooking.rooms.triple + schedule.hotelBooking.rooms.quadruple}실 / 배정인원 {totalPeople}명
          </div>
          <FacilityStatusSelector
            value={schedule.hotelBooking.status}
            onChange={(status) => patchHotel({ status })}
          />
          <Button className="w-full">저장하기</Button>
        </CardContent>
      </Card>
    </aside>
  );
}
