"use client";

import * as React from "react";
import type { CodeItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useUnsavedChanges } from "@/lib/unsaved-changes";

type CodeFormProps = {
  code?: CodeItem;
  group: string;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (code: CodeItem) => void;
};

const emptyCode: CodeItem = {
  id: "",
  group: "",
  value: "",
  label: "",
  defaultValue: "",
  description: "",
  sortOrder: 0,
  active: true,
  createdAt: "",
};

export function CodeForm({ code, group, open, saving, onOpenChange, onSave }: CodeFormProps) {
  const [form, setForm] = React.useState<CodeItem>({ ...emptyCode, group });
  const [dirty, setDirty] = React.useState(false);
  const { setUnsavedChanges, clearUnsavedChanges, confirmNavigation } = useUnsavedChanges();

  React.useEffect(() => {
    if (!open) return;
    setForm(code ?? { ...emptyCode, group });
    setDirty(false);
  }, [code, group, open]);

  React.useEffect(() => {
    setUnsavedChanges("code-form", open && dirty);
  }, [dirty, open, setUnsavedChanges]);

  React.useEffect(() => () => clearUnsavedChanges("code-form"), [clearUnsavedChanges]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && dirty && !confirmNavigation()) return;
    if (!nextOpen) clearUnsavedChanges("code-form");
    onOpenChange(nextOpen);
  }

  function update<K extends keyof CodeItem>(key: K, value: CodeItem[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function save() {
    clearUnsavedChanges("code-form");
    onSave(form);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange} title="코드 등록 / 수정">
      <div className="space-y-3">
        <Input value={form.group} onChange={(event) => update("group", event.target.value)} placeholder="코드그룹" />
        <Input value={form.value} onChange={(event) => update("value", event.target.value)} placeholder="코드값" />
        <Input value={form.label} onChange={(event) => update("label", event.target.value)} placeholder="코드명" />
        <Input value={form.defaultValue ?? ""} onChange={(event) => update("defaultValue", event.target.value)} placeholder="기본값" />
        <Input value={form.description ?? ""} onChange={(event) => update("description", event.target.value)} placeholder="설명" />
        <Input value={String(form.sortOrder || "")} onChange={(event) => update("sortOrder", Number(event.target.value) || 0)} type="number" placeholder="정렬순서" />
        <Switch checked={form.active} onCheckedChange={(checked) => update("active", checked)} label="사용여부" />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>취소</Button>
          <Button onClick={save} disabled={saving}>{saving ? "저장중" : "저장"}</Button>
        </div>
      </div>
    </Sheet>
  );
}
