import { PageContainer } from "@/components/layout/PageContainer";
import { IntegratedSettlementTable } from "@/components/integrated-settlements/IntegratedSettlementTable";
import { getIntegratedSettlementRows } from "@/services/integrated-settlement-service";

export const dynamic = "force-dynamic";

function getCurrentYearMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return { year, month };
}

export default async function IntegratedSettlementsPage() {
  const { year, month } = getCurrentYearMonth();
  const rows = await getIntegratedSettlementRows(year, month);

  return (
    <PageContainer title="통합정산서" description="예약현황 일정과 연동해 월별 수입, 지출, 잔액을 관리합니다.">
      <IntegratedSettlementTable initialRows={rows} initialYear={year} initialMonth={month} />
    </PageContainer>
  );
}
