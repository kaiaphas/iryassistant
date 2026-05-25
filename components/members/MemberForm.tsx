"use client";

import * as React from "react";
import type { AdminUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { useUnsavedForm } from "@/lib/unsaved-changes";

type MemberFormState = {
  name: string;
  role: string;
  department: string;
  phone: string;
  status: AdminUser["status"];
};

export function MemberForm({
  member,
  open,
  onOpenChange,
  onSaved,
}: {
  member?: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (member: AdminUser) => void;
}) {
  const [form, setForm] = React.useState<MemberFormState>({
    name: "",
    role: "담당자",
    department: "",
    phone: "",
    status: "active",
  });
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const initialForm = React.useMemo<MemberFormState>(() => ({
    name: member?.name ?? "",
    role: member?.role ?? "담당자",
    department: member?.department ?? "",
    phone: member?.phone ?? "",
    status: member?.status ?? "active",
  }), [member]);
  const { confirmClose } = useUnsavedForm("member-form", open, initialForm, form);

  React.useEffect(() => {
    if (!open) return;
    setForm(initialForm);
    setMessage("");
  }, [initialForm, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !confirmClose()) return;
    onOpenChange(nextOpen);
  }

  function update<K extends keyof MemberFormState>(key: K, value: MemberFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!member?.id) {
      setMessage("신규 회원 등록은 회원가입 요청 후 승인 방식으로 처리합니다.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...member,
          ...form,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "회원 정보 저장에 실패했습니다.");
      }

      onSaved(payload as AdminUser);
      onOpenChange(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "회원 정보 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange} title="회원 정보 수정">
      <div className="space-y-3">
        <Input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="이름" />
        <Input value={member?.loginId ?? ""} placeholder="아이디" disabled />
        <Input type="password" placeholder="비밀번호 변경은 추후 지원" disabled />
        <Select value={form.role} onChange={(event) => update("role", event.target.value)}>
          <option>관리자</option>
          <option>담당자</option>
        </Select>
        <Input value={form.department} onChange={(event) => update("department", event.target.value)} placeholder="소속" />
        <Input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="연락처" />
        <Input value={member?.email ?? ""} placeholder="이메일" disabled />
        <Select value={form.status} onChange={(event) => update("status", event.target.value as AdminUser["status"])}>
          <option value="active">활성</option>
          <option value="pending">승인대기</option>
          <option value="inactive">비활성</option>
        </Select>
        <textarea className="min-h-28 w-full rounded-md border bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" placeholder="메모" />
        {message ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{message}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>취소</Button>
          <Button onClick={save} disabled={saving}>{saving ? "저장 중" : "저장"}</Button>
        </div>
      </div>
    </Sheet>
  );
}
