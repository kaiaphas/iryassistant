import type { FacilityBookingStatus, HotelBooking, RestaurantBooking, ScheduleGroup } from "@/lib/types";

export function getRestaurantAggregateStatus(bookings: RestaurantBooking[]): FacilityBookingStatus {
  if (bookings.length === 0) return "예약전";
  if (bookings.every((booking) => booking.status === "예약취소")) return "예약취소";
  return bookings.every((booking) => booking.status === "예약완료") ? "예약완료" : "예약전";
}

export function getScheduleHotelBookings(schedule: ScheduleGroup): HotelBooking[] {
  return schedule.hotelBookings?.length ? schedule.hotelBookings : [schedule.hotelBooking];
}

export function getHotelAggregateStatus(bookings: HotelBooking[]): FacilityBookingStatus {
  const activeBookings = bookings.filter((booking) => booking.name || booking.phone || booking.status !== "예약전");
  if (activeBookings.length === 0) return "예약전";
  if (activeBookings.every((booking) => booking.status === "예약취소")) return "예약취소";
  return activeBookings.every((booking) => booking.status === "예약완료") ? "예약완료" : "예약전";
}

export function getHotelProvisionalAggregateStatus(bookings: HotelBooking[]): FacilityBookingStatus {
  const activeBookings = bookings.filter((booking) => booking.name || booking.phone || booking.provisionalStatus !== "예약전");
  if (activeBookings.length === 0) return "예약전";
  if (activeBookings.every((booking) => booking.provisionalStatus === "예약취소")) return "예약취소";
  return activeBookings.every((booking) => booking.provisionalStatus === "예약완료") ? "예약완료" : "예약전";
}

export function getScheduleProgressStatus(schedule: ScheduleGroup) {
  const hotelBookings = getScheduleHotelBookings(schedule);
  const restaurantCanceled =
    schedule.restaurantBookings.length > 0
    && schedule.restaurantBookings.every((booking) => booking.status === "예약취소");
  const hotelCanceled = schedule.tourType === "당일" || getHotelAggregateStatus(hotelBookings) === "예약취소";
  if (restaurantCanceled && hotelCanceled) return "취소완료";

  const restaurantCompleted =
    schedule.restaurantBookings.length > 0
    && schedule.restaurantBookings.every((booking) => booking.status === "예약완료");
  const hotelCompleted = schedule.tourType === "당일" || getHotelAggregateStatus(hotelBookings) === "예약완료";

  return restaurantCompleted && hotelCompleted ? "예약완료" : "진행중";
}
