"use client";

import type { FacilityBookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statuses: FacilityBookingStatus[] = ["예약전", "예약완료", "예약취소"];

export function FacilityStatusSelector({
  value,
  onChange,
}: {
  value: FacilityBookingStatus;
  onChange: (value: FacilityBookingStatus) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onChange(status)}
          className={cn(
            "h-9 rounded-md border bg-white text-xs font-semibold transition",
            value === status && status === "예약완료" && "border-emerald-700 bg-emerald-700 text-white",
            value === status && status === "예약전" && "border-slate-400 bg-slate-100 text-slate-800",
            value === status && status === "예약취소" && "border-rose-500 bg-rose-50 text-rose-600",
            value !== status && "text-slate-500 hover:bg-emerald-50",
          )}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
