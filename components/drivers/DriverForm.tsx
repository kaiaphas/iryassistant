"use client";

import * as React from "react";
import type { Driver } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { formatBirthDateInput } from "@/lib/birth-date";

type DriverFormProps = {
  driver?: Driver;
  open: boolean;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (driver: Driver) => Promise<void>;
};

function createEmptyDriver(): Driver {
  return {
    id: "",
    name: "",
    capacity: "",
    phone: "",
    birthDate: "",
    bankAccount: "",
    company: "",
    driverType: "직영",
    assignable: true,
    active: true,
    memo: "",
  };
}

export function DriverForm({ driver, open, saving = false, onOpenChange, onSave }: DriverFormProps) {
  const [form, setForm] = React.useState<Driver>(driver ?? createEmptyDriver());

  React.useEffect(() => {
    if (open) setForm(driver ?? createEmptyDriver());
  }, [driver, open]);

  function update<K extends keyof Driver>(key: K, value: Driver[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="기사 등록 / 수정">
      <div className="space-y-3">
        <Input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="이름" />
        <Input value={form.capacity} onChange={(event) => update("capacity", event.target.value)} placeholder="인승" />
        <Input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="전화번호" />
        <Input
          value={form.birthDate ?? ""}
          onChange={(event) => update("birthDate", formatBirthDateInput(event.target.value))}
          placeholder="생년월일 (예: 1988 / 198807 / 19880702)"
          inputMode="numeric"
          maxLength={10}
          aria-label="생년월일"
        />
        <Input value={form.bankAccount ?? ""} onChange={(event) => update("bankAccount", event.target.value)} placeholder="계좌번호" />
        <Input value={form.company} onChange={(event) => update("company", event.target.value)} placeholder="회사" />
        <Select value={form.driverType} onChange={(event) => update("driverType", event.target.value as Driver["driverType"])}>
          <option>직영</option>
          <option>자차</option>
        </Select>
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
