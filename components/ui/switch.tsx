"use client";

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
};

export function Switch({ checked, onCheckedChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className="inline-flex items-center gap-2 text-sm"
    >
      <span
        className={cn(
          "relative inline-flex h-6 w-11 rounded-full transition-colors",
          checked ? "bg-emerald-700" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </span>
      {label}
    </button>
  );
}
