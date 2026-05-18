import { PageContainer } from "@/components/layout/PageContainer";
import { RefundPaymentAccordionMock } from "@/components/refunds/RefundPaymentAccordionMock";

export default function RefundsTestPage() {
  return (
    <PageContainer title="환불명단 테스트" description="다회 입금 구조를 검토하기 위한 마스터-디테일 아코디언 목업입니다.">
      <RefundPaymentAccordionMock />
    </PageContainer>
  );
}
