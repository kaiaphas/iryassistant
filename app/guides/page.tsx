import { GuideTable } from "@/components/guides/GuideTable";
import { PageContainer } from "@/components/layout/PageContainer";
import { getGuides } from "@/services/master-service";

export const dynamic = "force-dynamic";

export default async function GuidesPage() {
  const guides = await getGuides();

  return (
    <PageContainer title="가이드관리" description="가이드 기준정보를 등록하고 배정 가능 상태를 관리합니다.">
      <GuideTable guides={guides} />
    </PageContainer>
  );
}
