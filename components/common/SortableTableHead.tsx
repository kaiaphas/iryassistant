"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableHead } from "@/components/ui/table";

export type SortDirection = "asc" | "desc";

export function SortableTableHead({
  label,
  active,
  direction,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  className?: string;
}) {
  const Icon = active ? direction === "asc" ? ArrowUp : ArrowDown : ArrowUpDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        className={cn("inline-flex w-full items-center gap-1 font-bold", className?.includes("text-center") && "justify-center", className?.includes("text-right") && "justify-end")}
        onClick={onClick}
      >
        <span>{label}</span>
        <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-emerald-700" : "text-slate-400")} />
      </button>
    </TableHead>
  );
}
