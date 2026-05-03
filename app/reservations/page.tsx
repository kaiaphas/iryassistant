import { PageContainer } from "@/components/layout/PageContainer";
import { ReservationsClient } from "@/components/reservations/ReservationsClient";
import { getScheduleGroups } from "@/services/reservation-service";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  const scheduleGroups = await getScheduleGroups();

  return (
    <PageContainer title="예약현황" description="일정별 예약, 식당/숙소 예약현황을 계층형 아코디언 테이블로 관리할 수 있습니다.">
      <ReservationsClient scheduleGroups={scheduleGroups} />
    </PageContainer>
  );
}
