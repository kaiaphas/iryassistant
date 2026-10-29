import { PageContainer } from "@/components/layout/PageContainer";
import { ProductManager } from "@/components/products/ProductManager";

export default function ProductsPage() {
  return <PageContainer title="상품관리" description="상품별 예상 비용과 이익을 계산합니다."><ProductManager /></PageContainer>;
}
