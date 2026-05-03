"use client";

import { BedDouble } from "lucide-react";
import type { ScheduleGroup } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { FacilityStatusSelector } from "@/components/reservations/FacilityStatusSelector";

export function HotelReservationSection({
  schedule,
  onChange,
}: {
  schedule: ScheduleGroup;
  onChange: (schedule: ScheduleGroup) => void;
}) {
  const booking = schedule.hotelBooking;
  const totalRooms = booking.rooms.double + booking.rooms.triple + booking.rooms.quadruple;
  const assignedPeople = booking.rooms.double * 2 + booking.rooms.triple * 3 + booking.rooms.quadruple * 4;

  const patch = (next: Partial<typeof booking>) => {
    onChange({ ...schedule, hotelBooking: { ...booking, ...next } });
  };
  const patchRooms = (next: Partial<typeof booking.rooms>) => {
    patch({ rooms: { ...booking.rooms, ...next } });
  };

  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-900">
        <BedDouble className="h-4 w-4" />
        숙소 예약현황
      </div>
      <div className="grid gap-3 xl:grid-cols-[1fr_180px_1.3fr_300px]">
        <Input value={booking.name} onChange={(event) => patch({ name: event.target.value })} placeholder="숙소명" />
        <Input value={booking.phone || ""} onChange={(event) => patch({ phone: event.target.value })} placeholder="연락처" />
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 rounded-md border bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
            2인실 x
            <input className="w-10 rounded border bg-white px-1 py-0.5 text-center" type="number" min={0} value={booking.rooms.double} onChange={(event) => patchRooms({ double: Number(event.target.value) })} />
          </label>
          <label className="flex items-center gap-1 rounded-md border bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
            3인실 x
            <input className="w-10 rounded border bg-white px-1 py-0.5 text-center" type="number" min={0} value={booking.rooms.triple} onChange={(event) => patchRooms({ triple: Number(event.target.value) })} />
          </label>
          <label className="flex items-center gap-1 rounded-md border bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
            4인실 x
            <input className="w-10 rounded border bg-white px-1 py-0.5 text-center" type="number" min={0} value={booking.rooms.quadruple} onChange={(event) => patchRooms({ quadruple: Number(event.target.value) })} />
          </label>
          <span className="text-xs font-semibold text-slate-500">총 {totalRooms}실 / 배정인원 {assignedPeople}명</span>
        </div>
        <FacilityStatusSelector value={booking.status} onChange={(status) => patch({ status })} />
      </div>
    </section>
  );
}
