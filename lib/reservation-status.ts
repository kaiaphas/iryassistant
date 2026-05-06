import type { FacilityBookingStatus, RestaurantBooking, ScheduleGroup } from "@/lib/types";

export function getRestaurantAggregateStatus(bookings: RestaurantBooking[]): FacilityBookingStatus {
  if (bookings.length === 0) return "예약전";
  if (bookings.every((booking) => booking.status === "예약취소")) return "예약취소";
  return bookings.every((booking) => booking.status === "예약완료") ? "예약완료" : "예약전";
}

export function getScheduleProgressStatus(schedule: ScheduleGroup) {
  const restaurantCanceled =
    schedule.restaurantBookings.length > 0
    && schedule.restaurantBookings.every((booking) => booking.status === "예약취소");
  const hotelCanceled = schedule.tourType === "당일" || schedule.hotelBooking.status === "예약취소";
  if (restaurantCanceled && hotelCanceled) return "취소완료";

  const restaurantCompleted =
    schedule.restaurantBookings.length > 0
    && schedule.restaurantBookings.every((booking) => booking.status === "예약완료");
  const hotelCompleted = schedule.tourType === "당일" || schedule.hotelBooking.status === "예약완료";

  return restaurantCompleted && hotelCompleted ? "예약완료" : "진행중";
}
