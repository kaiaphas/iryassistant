"use client";

import type { Guide } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

export function GuideForm({ guide, open, onOpenChange }: { guide?: Guide; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="가이드 등록 / 수정">
      <div className="space-y-3">
        <Input defaultValue={guide?.name} placeholder="이름" />
        <Input defaultValue={guide?.phone} placeholder="전화번호" />
        <Switch checked={guide?.assignable ?? true} label="배정가능" />
        <Switch checked={guide?.active ?? true} label="사용여부" />
        <textarea className="min-h-28 w-full rounded-md border bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" defaultValue={guide?.memo} placeholder="메모" />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={() => onOpenChange(false)}>저장</Button>
        </div>
      </div>
    </Sheet>
  );
}
