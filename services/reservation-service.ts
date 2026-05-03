import { findReservations } from "@/repositories/mock/reservation-repository";
import { findScheduleGroupsFromSupabase } from "@/repositories/supabase/reservation-repository";

export async function getReservations() {
  return findReservations();
}

export async function getScheduleGroups() {
  return findScheduleGroupsFromSupabase();
}

export async function getDashboardSummary() {
  const reservations = await findReservations();
  const today = "2026-05-02";
  return {
    reservations,
    todayDepartures: reservations.filter((item) => item.tourDate === today),
    inProgress: reservations.filter((item) => item.reservationStatus === "진행중"),
    pendingPayments: reservations.filter((item) => item.reservationStatus === "입금대기"),
    unassignedVehicles: reservations.filter((item) => !item.busInfo || item.progressStatus === "차량미배정"),
    unassignedGuides: reservations.filter((item) => !item.guideName),
    hotelNeedsCheck: reservations.filter((item) => item.hotelStatus === "확인필요"),
    restaurantNeedsCheck: reservations.filter((item) => item.progressStatus?.includes("확인")),
  };
}
