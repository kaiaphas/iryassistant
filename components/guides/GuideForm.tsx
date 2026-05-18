"use client";

import * as React from "react";
import type { Guide } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

type GuideFormProps = {
  guide?: Guide;
  open: boolean;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (guide: Guide) => Promise<void>;
};

function createEmptyGuide(): Guide {
  return {
    id: "",
    name: "",
    phone: "",
    birthDate: "",
    bankAccount: "",
    languages: [],
    regions: [],
    mainCourses: [],
    careerYears: 0,
    licenseStatus: "사용",
    assignable: true,
    active: true,
    availableWeekday: true,
    availableWeekend: true,
    memo: "",
  };
}

export function GuideForm({ guide, open, saving = false, onOpenChange, onSave }: GuideFormProps) {
  const [form, setForm] = React.useState<Guide>(guide ?? createEmptyGuide());

  React.useEffect(() => {
    if (open) setForm(guide ?? createEmptyGuide());
  }, [guide, open]);

  function update<K extends keyof Guide>(key: K, value: Guide[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="가이드 등록 / 수정">
      <div className="space-y-3">
        <Input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="이름" />
        <Input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="전화번호" />
        <Input type="date" value={form.birthDate ?? ""} onChange={(event) => update("birthDate", event.target.value)} aria-label="생년월일" />
        <Input value={form.bankAccount ?? ""} onChange={(event) => update("bankAccount", event.target.value)} placeholder="계좌번호" />
        <div className="flex gap-4 rounded-md border px-3 py-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.availableWeekday} onChange={(event) => update("availableWeekday", event.target.checked)} />
            주중
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.availableWeekend} onChange={(event) => update("availableWeekend", event.target.checked)} />
            주말
          </label>
        </div>
        <Switch checked={form.assignable} onCheckedChange={(checked) => update("assignable", checked)} label="배정가능" />
        <Switch checked={form.active} onCheckedChange={(checked) => update("active", checked)} label="사용여부" />
        <textarea
          className="min-h-28 w-full rounded-md border bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          value={form.memo ?? ""}
          onChange={(event) => update("memo", event.target.value)}
          placeholder="메모"
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>취소</Button>
          <Button onClick={() => onSave(form)} disabled={saving}>{saving ? "저장 중" : "저장"}</Button>
        </div>
      </div>
    </Sheet>
  );
}
