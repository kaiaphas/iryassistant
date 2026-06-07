"use client";

import { Plus, Trash2, Utensils } from "lucide-react";
import type { Restaurant, RestaurantBooking, ScheduleGroup } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FacilityStatusSelector } from "@/components/reservations/FacilityStatusSelector";

function createRestaurantBooking(): RestaurantBooking {
  return {
    id: `RB-${Date.now()}`,
    name: "",
    phone: "",
    memo: "",
    mealType: "중식",
    status: "예약전",
  };
}

export function RestaurantReservationSection({
  schedule,
  restaurants,
  onChange,
}: {
  schedule: ScheduleGroup;
  restaurants: Restaurant[];
  onChange: (schedule: ScheduleGroup) => void;
}) {
  const bookings = schedule.restaurantBookings.length > 0 ? schedule.restaurantBookings : [createRestaurantBooking()];
  const canAdd = schedule.tourType === "숙박";
  const listId = `reservation-restaurant-options-${schedule.id}`;

  function updateBooking(id: string, patch: Partial<RestaurantBooking>) {
    onChange({
      ...schedule,
      restaurantBookings: bookings.map((booking) => booking.id === id ? { ...booking, ...patch } : booking),
    });
  }

  function updateRestaurantName(booking: RestaurantBooking, name: string) {
    const restaurant = restaurants.find((item) => item.shopName === name);
    updateBooking(booking.id, {
      name,
      phone: restaurant?.phone ?? booking.phone,
      memo: restaurant?.menu ? [restaurant.menu, restaurant.note].filter(Boolean).join(" / ") : booking.memo,
    });
  }

  function addBooking() {
    onChange({ ...schedule, restaurantBookings: [...bookings, createRestaurantBooking()] });
  }

  function removeBooking(id: string) {
    const nextBookings = bookings.filter((booking) => booking.id !== id);
    onChange({ ...schedule, restaurantBookings: nextBookings.length > 0 ? nextBookings : [createRestaurantBooking()] });
  }

  return (
    <section className="rounded-lg border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
          <Utensils className="h-4 w-4" />
          식당 예약현황
        </div>
        {canAdd ? (
          <Button size="sm" variant="outline" onClick={addBooking}>
            <Plus className="h-4 w-4" />
            식당 추가
          </Button>
        ) : null}
      </div>
      <div className="space-y-2">
        {bookings.map((booking, index) => (
          <div key={booking.id} className="rounded-lg border bg-slate-50 p-2">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>{schedule.tourType === "숙박" ? `식당 ${index + 1}` : "식당"}</span>
              {canAdd && bookings.length > 1 ? (
                <button className="inline-flex items-center gap-1 text-rose-600" onClick={() => removeBooking(booking.id)} type="button">
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </button>
              ) : null}
            </div>
            <div className="grid gap-2 xl:grid-cols-[82px_minmax(120px,0.7fr)_300px_minmax(120px,0.8fr)_220px]">
              <Select className="h-9 text-xs" value={booking.mealType} onChange={(event) => updateBooking(booking.id, { mealType: event.target.value as RestaurantBooking["mealType"] })}>
                <option>조식</option>
                <option>중식</option>
                <option>석식</option>
              </Select>
              <Input className="h-9 text-xs" list={listId} value={booking.name} onChange={(event) => updateRestaurantName(booking, event.target.value)} placeholder="식당명" />
              <Input className="h-9 text-xs" value={booking.phone || ""} onChange={(event) => updateBooking(booking.id, { phone: event.target.value })} placeholder="연락처" />
              <Input className="h-9 text-xs" value={booking.memo || ""} onChange={(event) => updateBooking(booking.id, { memo: event.target.value })} placeholder="메모" />
              <FacilityStatusSelector value={booking.status} onChange={(status) => updateBooking(booking.id, { status })} />
            </div>
          </div>
        ))}
      </div>
      <datalist id={listId}>
        {restaurants.map((restaurant) => (
          <option key={restaurant.id} value={restaurant.shopName}>
            {[restaurant.regionName, restaurant.menu, restaurant.phone].filter(Boolean).join(" · ")}
          </option>
        ))}
      </datalist>
    </section>
  );
}
