import { PageContainer } from "@/components/layout/PageContainer";
import { RefundTable } from "@/components/refunds/RefundTable";
import { getAdminUsers } from "@/services/master-service";
import { getRefunds } from "@/services/refund-service";

export const dynamic = "force-dynamic";

export default async function RefundsPage() {
  const [refunds, adminUsers] = await Promise.all([getRefunds(), getAdminUsers()]);
  const activeAdminUsers = adminUsers.filter((user) => user.status === "active");

  return (
    <PageContainer title="환불명단" description="고객 환불 요청, 환불 금액, 계좌 정보와 처리 상태를 관리합니다.">
      <RefundTable refunds={refunds} activeAdminUsers={activeAdminUsers} />
    </PageContainer>
  );
}
