"use client";

import { BedDouble, Plus, Trash2 } from "lucide-react";
import type { Hotel, HotelBooking, ScheduleGroup } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FacilityStatusSelector } from "@/components/reservations/FacilityStatusSelector";
import { getScheduleHotelBookings } from "@/lib/reservation-status";

const emptyRooms = { double: 0, triple: 0, quadruple: 0 };

function createEmptyHotelBooking(): HotelBooking {
  return {
    id: `new-${crypto.randomUUID()}`,
    name: "",
    phone: "",
    provisionalRooms: { ...emptyRooms },
    rooms: { ...emptyRooms },
    provisionalStatus: "예약전",
    status: "예약전",
  };
}

export function HotelReservationSection({
  schedule,
  hotels,
  onChange,
}: {
  schedule: ScheduleGroup;
  hotels: Hotel[];
  onChange: (schedule: ScheduleGroup) => void;
}) {
  const bookings = getScheduleHotelBookings(schedule);
  const listId = `reservation-hotel-options-${schedule.id}`;

  const updateBookings = (nextBookings: HotelBooking[]) => {
    const normalized = nextBookings.length ? nextBookings : [createEmptyHotelBooking()];
    onChange({ ...schedule, hotelBooking: normalized[0], hotelBookings: normalized });
  };

  const patchBooking = (index: number, next: Partial<HotelBooking>) => {
    updateBookings(bookings.map((booking, bookingIndex) => bookingIndex === index ? { ...booking, ...next } : booking));
  };

  const patchRooms = (index: number, next: Partial<HotelBooking["rooms"]>) => {
    const booking = bookings[index];
    patchBooking(index, { rooms: { ...booking.rooms, ...next } });
  };

  const patchProvisionalRooms = (index: number, next: Partial<HotelBooking["provisionalRooms"]>) => {
    const booking = bookings[index];
    patchBooking(index, { provisionalRooms: { ...booking.provisionalRooms, ...next } });
  };

  const updateHotelName = (index: number, name: string) => {
    const booking = bookings[index];
    const hotel = hotels.find((item) => item.shopName === name);
    patchBooking(index, { name, phone: hotel?.phone ?? booking.phone });
  };

  return (
    <section className="rounded-lg border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
          <BedDouble className="h-4 w-4" />
          숙소 예약현황
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => updateBookings([...bookings, createEmptyHotelBooking()])}>
          <Plus className="h-4 w-4" />
          숙소추가
        </Button>
      </div>
      <div className="space-y-3">
        {bookings.map((booking, index) => {
          const provisionalTotalRooms = booking.provisionalRooms.double + booking.provisionalRooms.triple + booking.provisionalRooms.quadruple;
          const provisionalAssignedPeople = booking.provisionalRooms.double * 2 + booking.provisionalRooms.triple * 3 + booking.provisionalRooms.quadruple * 4;
          const actualTotalRooms = booking.rooms.double + booking.rooms.triple + booking.rooms.quadruple;
          const actualAssignedPeople = booking.rooms.double * 2 + booking.rooms.triple * 3 + booking.rooms.quadruple * 4;

          return (
            <div key={booking.id ?? `${schedule.id}-hotel-${index}`} className="rounded-md border border-slate-200 bg-slate-50/60 p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-600">숙소 {index + 1}</p>
                {bookings.length > 1 ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => updateBookings(bookings.filter((_, bookingIndex) => bookingIndex !== index))} aria-label={`숙소 ${index + 1} 삭제`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-2 xl:grid-cols-[1fr_150px_1.8fr]">
                <Input className="h-9 bg-white text-xs" list={listId} value={booking.name} onChange={(event) => updateHotelName(index, event.target.value)} placeholder="숙소명" />
                <Input className="h-9 bg-white text-xs" value={booking.phone || ""} onChange={(event) => patchBooking(index, { phone: event.target.value })} placeholder="연락처" />
                <div className="space-y-2">
                  <HotelRoomStatusRow
                    label="가예약"
                    rooms={booking.provisionalRooms}
                    totalRooms={provisionalTotalRooms}
                    assignedPeople={provisionalAssignedPeople}
                    status={booking.provisionalStatus}
                    onChangeRooms={(rooms) => patchProvisionalRooms(index, rooms)}
                    onChangeStatus={(provisionalStatus) => patchBooking(index, { provisionalStatus })}
                  />
                  <HotelRoomStatusRow
                    label="실제예약"
                    rooms={booking.rooms}
                    totalRooms={actualTotalRooms}
                    assignedPeople={actualAssignedPeople}
                    status={booking.status}
                    onChangeRooms={(rooms) => patchRooms(index, rooms)}
                    onChangeStatus={(status) => patchBooking(index, { status })}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <datalist id={listId}>
        {hotels.map((hotel) => (
          <option key={hotel.id} value={hotel.shopName}>
            {[hotel.regionName, hotel.phone].filter(Boolean).join(" · ")}
          </option>
        ))}
      </datalist>
    </section>
  );
}

function HotelRoomStatusRow({
  label,
  rooms,
  totalRooms,
  assignedPeople,
  status,
  onChangeRooms,
  onChangeStatus,
}: {
  label: string;
  rooms: { double: number; triple: number; quadruple: number };
  totalRooms: number;
  assignedPeople: number;
  status: ScheduleGroup["hotelBooking"]["status"];
  onChangeRooms: (rooms: Partial<ScheduleGroup["hotelBooking"]["rooms"]>) => void;
  onChangeStatus: (status: ScheduleGroup["hotelBooking"]["status"]) => void;
}) {
  return (
    <div className="grid gap-2 rounded-md border bg-white p-2 xl:grid-cols-[64px_1fr_220px]">
      <p className="flex items-center text-xs font-bold text-slate-700">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs font-semibold text-emerald-800">
          2인실 x
          <input className="w-10 rounded border bg-white px-1 py-0.5 text-center" type="number" min={0} value={rooms.double} onChange={(event) => onChangeRooms({ double: Number(event.target.value) })} />
        </label>
        <label className="flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs font-semibold text-emerald-800">
          3인실 x
          <input className="w-10 rounded border bg-white px-1 py-0.5 text-center" type="number" min={0} value={rooms.triple} onChange={(event) => onChangeRooms({ triple: Number(event.target.value) })} />
        </label>
        <label className="flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs font-semibold text-emerald-800">
          4인실 x
          <input className="w-10 rounded border bg-white px-1 py-0.5 text-center" type="number" min={0} value={rooms.quadruple} onChange={(event) => onChangeRooms({ quadruple: Number(event.target.value) })} />
        </label>
        <span className="text-xs font-semibold text-slate-500">총 {totalRooms}실 / {assignedPeople}명</span>
      </div>
      <FacilityStatusSelector value={status} onChange={onChangeStatus} />
    </div>
  );
}
