"use client";

import type { CodeItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

export function CodeForm({ code, group, open, onOpenChange }: { code?: CodeItem; group: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="코드 등록 / 수정">
      <div className="space-y-3">
        <Input defaultValue={code?.group || group} placeholder="코드그룹" />
        <Input defaultValue={code?.value} placeholder="코드값" />
        <Input defaultValue={code?.label} placeholder="코드명" />
        <Input defaultValue={code?.description} placeholder="설명" />
        <Input defaultValue={code?.sortOrder} type="number" placeholder="정렬순서" />
        <Switch checked={code?.active ?? true} label="사용여부" />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={() => onOpenChange(false)}>저장</Button>
        </div>
      </div>
    </Sheet>
  );
}
