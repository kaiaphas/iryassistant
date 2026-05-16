import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-white px-3 py-1.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-700",
        className,
      )}
      {...props}
    />
  );
}
