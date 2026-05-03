import { DriverTable } from "@/components/drivers/DriverTable";
import { PageContainer } from "@/components/layout/PageContainer";
import { getDrivers } from "@/services/master-service";

export default async function DriversPage() {
  const drivers = await getDrivers();
  return (
    <PageContainer title="기사관리" description="기사 배정 가능 여부와 차량 인승, 연락처를 관리합니다.">
      <DriverTable drivers={drivers} />
    </PageContainer>
  );
}
