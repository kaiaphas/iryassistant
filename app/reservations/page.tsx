import { PageContainer } from "@/components/layout/PageContainer";
import { ReservationsClient } from "@/components/reservations/ReservationsClient";
import { getDrivers, getGuides, getHotels, getRestaurants } from "@/services/master-service";
import { getScheduleGroups } from "@/services/reservation-service";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  const [scheduleGroups, guides, drivers, restaurants, hotels] = await Promise.all([
    getScheduleGroups(),
    getGuides(),
    getDrivers(),
    getRestaurants(),
    getHotels(),
  ]);

  return (
    <PageContainer title="예약현황" description="일정별 예약, 식당/숙소 예약현황을 계층형 아코디언 테이블로 관리할 수 있습니다.">
      <ReservationsClient scheduleGroups={scheduleGroups} guides={guides} drivers={drivers} restaurants={restaurants} hotels={hotels} />
    </PageContainer>
  );
}
