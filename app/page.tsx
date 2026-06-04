import { Bus, CalendarCheck, Hotel, Soup, UserCheck, UsersRound } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/dashboard/StatCard";
import { TodayDepartureTable } from "@/components/dashboard/TodayDepartureTable";
import { getScheduleGroups } from "@/services/reservation-service";
import { getHotelAggregateStatus, getRestaurantAggregateStatus, getScheduleHotelBookings } from "@/lib/reservation-status";
import { getKstDateInput } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const schedules = await getScheduleGroups();
  const today = getKstDateInput();
  const tomorrow = getKstDateInput(1);
  const sevenDaysLater = getKstDateInput(7);
  const tomorrowSchedules = schedules.filter((schedule) => schedule.tourDate === tomorrow);
  const futureSchedules = schedules.filter((schedule) => schedule.tourDate >= today);
  const nextWeekSchedules = schedules
    .filter((schedule) => schedule.tourDate >= today && schedule.tourDate <= sevenDaysLater)
    .sort((left, right) => {
      const dateCompare = left.tourDate.localeCompare(right.tourDate);
      if (dateCompare !== 0) return dateCompare;

      const busCompare = (left.busNo || "").localeCompare(right.busNo || "", "ko", { numeric: true });
      if (busCompare !== 0) return busCompare;

      return (left.departureTime || "").localeCompare(right.departureTime || "");
    });
  const vehicleUnassigned = futureSchedules.filter((schedule) => !schedule.vehicle.busInfo && !schedule.vehicle.busType && !schedule.vehicle.busCompany).length;
  const guideUnassigned = futureSchedules.filter((schedule) => !schedule.guide.name || schedule.guide.name === "-").length;
  const hotelNeedsCheck = futureSchedules.filter((schedule) => schedule.tourType === "숙박" && getHotelAggregateStatus(getScheduleHotelBookings(schedule)) === "예약전").length;
  const restaurantNeedsCheck = futureSchedules.filter((schedule) => getRestaurantAggregateStatus(schedule.restaurantBookings) === "예약전").length;
  const tomorrowReservationCount = tomorrowSchedules.reduce((total, schedule) => total + schedule.reservationCount, 0);

  return (
    <PageContainer title="대시보드" description="금일 일정과 향후 운영 준비 상태를 확인합니다.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="내일 일정" value={`${tomorrowSchedules.length}건`} icon={CalendarCheck} />
        <StatCard title="내일 인원" value={`${tomorrowReservationCount}명`} icon={UsersRound} />
        <StatCard title="차량 미배정" value={`${vehicleUnassigned}건`} icon={Bus} />
        <StatCard title="가이드 미배정" value={`${guideUnassigned}건`} icon={UserCheck} />
        <StatCard title="숙소 확인 필요" value={`${hotelNeedsCheck}건`} icon={Hotel} />
        <StatCard title="식당 확인 필요" value={`${restaurantNeedsCheck}건`} icon={Soup} />
      </div>

      <div className="mt-4">
        <TodayDepartureTable schedules={nextWeekSchedules} />
      </div>
    </PageContainer>
  );
}
