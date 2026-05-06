import { PageContainer } from "@/components/layout/PageContainer";
import { RefundTable } from "@/components/refunds/RefundTable";
import { refundItems } from "@/lib/mock-data";

export default function RefundsPage() {
  return (
    <PageContainer title="환불명단" description="고객 환불 요청, 환불 금액, 계좌 정보와 처리 상태를 관리합니다.">
      <RefundTable refunds={refundItems} />
    </PageContainer>
  );
}
