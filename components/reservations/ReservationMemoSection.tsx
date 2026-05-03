"use client";

import { ClipboardList } from "lucide-react";
import type { ScheduleGroup } from "@/lib/types";

export function ReservationMemoSection({
  schedule,
  onChange,
}: {
  schedule: ScheduleGroup;
  onChange: (schedule: ScheduleGroup) => void;
}) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-900">
        <ClipboardList className="h-4 w-4" />
        메모장
      </div>
      <textarea
        className="min-h-20 w-full rounded-md border bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
        value={schedule.dispatchMemo || ""}
        onChange={(event) => onChange({ ...schedule, dispatchMemo: event.target.value })}
        placeholder="고객님들이 해산물 알레르기 있으니 생선회 대신 구이 메뉴 위주로 요청"
      />
    </section>
  );
}
