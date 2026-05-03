"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  side?: "right" | "left";
  className?: string;
};

export function Sheet({ open, onOpenChange, title, children, side = "right", className }: SheetProps) {
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="닫기"
        className="absolute inset-0 bg-slate-950/35"
        onClick={() => onOpenChange(false)}
      />
      <aside
        className={cn(
          "absolute top-0 h-full w-[min(92vw,440px)] overflow-y-auto bg-white shadow-2xl",
          side === "right" ? "right-0" : "left-0",
          className,
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="닫기">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  );
}
