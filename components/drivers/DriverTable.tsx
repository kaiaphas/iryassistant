"use client";

import * as React from "react";
import type { Driver } from "@/lib/types";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DriverForm } from "@/components/drivers/DriverForm";

export function DriverTable({ drivers }: { drivers: Driver[] }) {
  const [items, setItems] = React.useState(drivers);
  const [query, setQuery] = React.useState("");
  const [assignable, setAssignable] = React.useState("");
  const [selected, setSelected] = React.useState<Driver | undefined>();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const filtered = items.filter((driver) => {
    const q = query.toLowerCase();
    const assignableMatch = !assignable || (assignable === "가능" ? driver.assignable : !driver.assignable);
    return (!q || [driver.name, driver.phone, driver.company, driver.memo].some((value) => value?.toLowerCase().includes(q))) && assignableMatch;
  });
  const edit = (driver?: Driver) => { setSelected(driver); setOpen(true); };

  async function save(driver: Driver) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/masters/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driver),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "기사 저장에 실패했습니다.");

      setItems((current) => {
        const exists = current.some((item) => item.id === payload.id);
        return exists ? current.map((item) => (item.id === payload.id ? payload : item)) : [payload, ...current];
      });
      setOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "기사 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(driver: Driver) {
    if (!window.confirm(`${driver.name} 기사를 삭제할까요?`)) return;

    setDeletingId(driver.id);
    setError("");
    try {
      const response = await fetch(`/api/masters/drivers?id=${encodeURIComponent(driver.id)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "기사 삭제에 실패했습니다.");

      setItems((current) => current.filter((item) => item.id !== driver.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "기사 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 shadow-soft md:grid-cols-[1fr_180px_auto_auto]">
        <SearchInput placeholder="검색어를 입력하세요." value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select value={assignable} onChange={(event) => setAssignable(event.target.value)}>
          <option value="">배정가능 전체</option><option>가능</option><option>불가</option>
        </Select>
        <Button>검색</Button><Button onClick={() => edit()}>+ 등록</Button>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <div className="overflow-hidden rounded-xl border bg-white shadow-soft">
        <div className="overflow-x-auto">
          <Table className="min-w-[1040px] text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px] text-center">이름</TableHead>
                <TableHead className="w-[90px] text-center">인승</TableHead>
                <TableHead className="w-[150px] text-center">전화번호</TableHead>
                <TableHead className="w-[160px] text-center">회사</TableHead>
                <TableHead className="w-[110px] text-center">배정가능</TableHead>
                <TableHead className="w-[110px] text-center">사용여부</TableHead>
                <TableHead>메모</TableHead>
                <TableHead className="w-[150px] text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="whitespace-nowrap text-center font-semibold">{driver.name}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{driver.capacity}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{driver.phone}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-center" title={driver.company}>{driver.company}</TableCell>
                  <TableCell className="text-center"><StatusBadge value={driver.assignable ? "가능" : "불가"} /></TableCell>
                  <TableCell className="text-center"><Switch checked={driver.active} /></TableCell>
                  <TableCell className="max-w-[360px] truncate" title={driver.memo || ""}>{driver.memo || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">
                    <Button size="sm" variant="outline" onClick={() => edit(driver)} disabled={deletingId === driver.id}>수정</Button>
                    <Button size="sm" variant="outline" className="ml-1 text-rose-700" onClick={() => remove(driver)} disabled={deletingId === driver.id}>{deletingId === driver.id ? "삭제중" : "삭제"}</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <DriverForm driver={selected} open={open} saving={saving} onOpenChange={setOpen} onSave={save} />
    </div>
  );
}
