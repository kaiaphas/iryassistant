import { Bus, CalendarCheck, Hotel, Soup, UserCheck, UsersRound } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/dashboard/StatCard";
import { TodayDepartureTable } from "@/components/dashboard/TodayDepartureTable";
import { getScheduleGroups } from "@/services/reservation-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const schedules = await getScheduleGroups();
  const todaySchedules = schedules.slice(0, 5);
  const totalPeople = schedules.reduce((sum, schedule) => sum + schedule.reservations.reduce((people, reservation) => people + reservation.totalPeople, 0), 0);
  const hotelNeedsCheck = schedules.filter((schedule) => schedule.hotelBooking.status === "예약전").length;
  const restaurantNeedsCheck = schedules.filter((schedule) => schedule.restaurantBookings.some((booking) => booking.status === "예약전")).length;

  return (
    <PageContainer title="대시보드" description="오늘 출발 일정과 운영 준비 상태를 확인합니다.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="오늘 출발" value={`${todaySchedules.length}건`} icon={CalendarCheck} />
        <StatCard title="차량 미배정" value="3건" icon={Bus} />
        <StatCard title="가이드 미배정" value="2건" icon={UserCheck} />
        <StatCard title="숙소 확인 필요" value={`${hotelNeedsCheck}건`} icon={Hotel} />
        <StatCard title="식당 확인 필요" value={`${restaurantNeedsCheck}건`} icon={Soup} />
        <StatCard title="전체 인원" value={`${totalPeople}명`} icon={UsersRound} />
      </div>

      <div className="mt-4">
        <TodayDepartureTable schedules={todaySchedules} />
      </div>
    </PageContainer>
  );
}
