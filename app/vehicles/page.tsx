import { PageContainer } from "@/components/layout/PageContainer";
import { VehicleGrid } from "@/components/vehicles/VehicleGrid";
import { getVehicles } from "@/services/master-service";

export default async function VehiclesPage() {
  const vehicles = await getVehicles();

  return (
    <PageContainer title="차량관리" description="버스와 차량 기준정보, 기사 연락처, 정비 상태를 관리합니다.">
      <VehicleGrid vehicles={vehicles} />
    </PageContainer>
  );
}
