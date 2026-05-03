import { Inbox } from "lucide-react";

export function EmptyState({ title = "표시할 데이터가 없습니다." }: { title?: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed bg-white text-slate-500">
      <Inbox className="mb-2 h-8 w-8" />
      <p className="text-sm">{title}</p>
    </div>
  );
}
