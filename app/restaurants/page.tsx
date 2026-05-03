import { PageContainer } from "@/components/layout/PageContainer";
import { RestaurantTable } from "@/components/restaurants/RestaurantTable";
import { getRestaurants } from "@/services/master-service";

export default async function RestaurantsPage() {
  const restaurants = await getRestaurants();
  return <PageContainer title="식당관리" description="상품별 식당과 메뉴, 정산가, 서비스 여부를 관리합니다."><RestaurantTable restaurants={restaurants} /></PageContainer>;
}
