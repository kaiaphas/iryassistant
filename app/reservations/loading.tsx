import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function ReservationsLoading() {
  return (
    <PageContainer title="예약현황" description="일정별 예약, 식당/숙소 예약현황을 계층형 아코디언 테이블로 관리할 수 있습니다.">
      <div className="rounded-lg border bg-white px-4 py-10 text-center text-sm font-semibold text-slate-600">
        <LoadingSpinner className="mx-auto mb-3 h-6 w-6 text-emerald-700" />
        예약현황을 불러오는 중
      </div>
    </PageContainer>
  );
}
