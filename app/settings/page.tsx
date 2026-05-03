import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function SettingsPage() {
  return (
    <PageContainer title="설정" description="v1에서는 기본 운영 설정 상태만 표시합니다.">
      <Card>
        <CardHeader>
          <CardTitle>시스템 설정</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="font-semibold">데이터 모드</p>
            <div className="mt-2"><StatusBadge value="mock data" /></div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">API 연동</p>
            <div className="mt-2"><StatusBadge value="준비중" /></div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">삭제 정책</p>
            <p className="mt-2 text-slate-500">비활성화 우선</p>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
