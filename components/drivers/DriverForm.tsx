"use client";

import type { Driver } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

export function DriverForm({ driver, open, onOpenChange }: { driver?: Driver; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="기사 등록 / 수정">
      <div className="space-y-3">
        <Input defaultValue={driver?.name} placeholder="이름" />
        <Input defaultValue={driver?.capacity} placeholder="인승" />
        <Input defaultValue={driver?.phone} placeholder="전화번호" />
        <Input defaultValue={driver?.company} placeholder="회사" />
        <Switch checked={driver?.assignable ?? true} label="배정가능" />
        <Switch checked={driver?.active ?? true} label="사용여부" />
        <textarea className="min-h-28 w-full rounded-md border bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" defaultValue={driver?.memo} placeholder="메모" />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={() => onOpenChange(false)}>저장</Button>
        </div>
      </div>
    </Sheet>
  );
}
