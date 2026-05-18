import { Button } from "@/components/ui/button";

export const tablePageSize = 20;

export function TablePagination({
  totalCount,
  page,
  onPageChange,
  unit = "건",
}: {
  totalCount: number;
  page: number;
  onPageChange: (page: number) => void;
  unit?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / tablePageSize));
  const start = totalCount === 0 ? 0 : (page - 1) * tablePageSize + 1;
  const end = Math.min(totalCount, page * tablePageSize);

  return (
    <div className="flex flex-col gap-2 border-t px-4 py-3 text-sm font-semibold text-slate-700 sm:flex-row sm:items-center sm:justify-between">
      <span>총 {totalCount}{unit} 중 {start}-{end} 표시</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
          이전
        </Button>
        <span className="min-w-16 text-center">{page} / {totalPages}</span>
        <Button size="sm" variant="outline" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
          다음
        </Button>
      </div>
    </div>
  );
}
