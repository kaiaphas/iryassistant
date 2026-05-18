"use client";

import * as React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
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
  const Icon = direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        className={cn("inline-flex w-full items-center whitespace-nowrap font-bold", active && "gap-1", className?.includes("text-center") && "justify-center", className?.includes("text-right") && "justify-end")}
        onClick={onClick}
      >
        <span className="whitespace-nowrap">{label}</span>
        {active ? <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-700" /> : null}
      </button>
    </TableHead>
  );
}
