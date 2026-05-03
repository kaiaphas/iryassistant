import { PageContainer } from "@/components/layout/PageContainer";
import { MemberTable } from "@/components/members/MemberTable";
import { getAdminUsers } from "@/services/master-service";

export default async function MembersPage() {
  const members = await getAdminUsers();

  return (
    <PageContainer title="회원관리" description="관리자와 직원 계정, 권한, 활성 상태를 관리합니다.">
      <MemberTable members={members} />
    </PageContainer>
  );
}
