import { CodeTable } from "@/components/codes/CodeTable";
import { PageContainer } from "@/components/layout/PageContainer";
import { getCodeItems } from "@/services/master-service";

export default async function CodesPage() {
  const codes = await getCodeItems();

  return (
    <PageContainer title="기준정보" description="상품, 출발지, 상태, 결제방식, 권한 등 마스터 코드를 관리합니다.">
      <CodeTable codes={codes} />
    </PageContainer>
  );
}
