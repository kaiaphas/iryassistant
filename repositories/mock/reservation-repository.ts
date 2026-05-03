import { reservations, scheduleGroups } from "@/lib/mock-data";

export async function findReservations() {
  return reservations;
}

export async function findScheduleGroups() {
  return scheduleGroups;
}
