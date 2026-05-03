import { HotelTable } from "@/components/hotels/HotelTable";
import { PageContainer } from "@/components/layout/PageContainer";
import { getHotels } from "@/services/master-service";

export default async function HotelsPage() {
  const hotels = await getHotels();
  return <PageContainer title="호텔관리" description="호텔 객실 타입별 단가와 기사/가이드 제공 조건을 관리합니다."><HotelTable hotels={hotels} /></PageContainer>;
}
