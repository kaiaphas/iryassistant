import { PageContainer } from "@/components/layout/PageContainer";
import { SettlementTable } from "@/components/settlements/SettlementTable";
import { getSettlementItems } from "@/services/settlement-service";

export const dynamic = "force-dynamic";

function getCurrentMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return `${year}-${month}`;
}

export default async function SettlementsPage() {
  const month = getCurrentMonth();
  const items = await getSettlementItems(month, "GUIDE");

  return (
    <PageContainer title="정산서" description="예약현황에 매핑된 가이드와 기사 일정별 정산 금액과 공제액을 관리합니다.">
      <SettlementTable initialItems={items} initialMonth={month} initialType="GUIDE" />
    </PageContainer>
  );
}
