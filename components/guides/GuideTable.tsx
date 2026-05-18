"use client";

import * as React from "react";
import type { Guide } from "@/lib/types";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GuideForm } from "@/components/guides/GuideForm";
import { TablePagination, tablePageSize } from "@/components/common/TablePagination";
import { SortableTableHead } from "@/components/common/SortableTableHead";
import { useTableSort } from "@/lib/table-sort";

export function GuideTable({ guides }: { guides: Guide[] }) {
  const [items, setItems] = React.useState(guides);
  const [query, setQuery] = React.useState("");
  const [assignable, setAssignable] = React.useState("");
  const [selected, setSelected] = React.useState<Guide | undefined>();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [page, setPage] = React.useState(1);

  const filtered = items.filter((guide) => {
    const q = query.toLowerCase();
    const assignableMatch = !assignable || (assignable === "가능" ? guide.assignable : !guide.assignable);
    return (!q || [guide.name, guide.phone, guide.birthDate, guide.bankAccount, guide.memo].some((value) => value?.toLowerCase().includes(q))) && assignableMatch;
  });
  const getSortValue = React.useCallback((guide: Guide, key: "name" | "phone" | "birthDate" | "bankAccount" | "availableWeekday" | "availableWeekend" | "assignable" | "active" | "memo") => ({
    name: guide.name,
    phone: guide.phone,
    birthDate: guide.birthDate,
    bankAccount: guide.bankAccount,
    availableWeekday: guide.availableWeekday,
    availableWeekend: guide.availableWeekend,
    assignable: guide.assignable,
    active: guide.active,
    memo: guide.memo,
  }[key]), []);
  const { sortedItems, sortKey, sortDirection, sortApplied, toggleSort } = useTableSort<Guide, "name" | "phone" | "birthDate" | "bankAccount" | "availableWeekday" | "availableWeekend" | "assignable" | "active" | "memo">(filtered, "name", getSortValue);
  const totalPages = Math.max(1, Math.ceil(filtered.length / tablePageSize));
  const visibleItems = sortedItems.slice((page - 1) * tablePageSize, page * tablePageSize);

  React.useEffect(() => {
    setPage(1);
  }, [query, assignable]);

  React.useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  function edit(guide?: Guide) {
    setSelected(guide);
    setOpen(true);
  }

  async function save(guide: Guide) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/masters/guides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guide),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "가이드 저장에 실패했습니다.");

      setItems((current) => {
        const exists = current.some((item) => item.id === payload.id);
        return exists ? current.map((item) => (item.id === payload.id ? payload : item)) : [payload, ...current];
      });
      setOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "가이드 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(guide: Guide) {
    if (!window.confirm(`${guide.name} 가이드를 삭제할까요?`)) return;

    setDeletingId(guide.id);
    setError("");
    try {
      const response = await fetch(`/api/masters/guides?id=${encodeURIComponent(guide.id)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "가이드 삭제에 실패했습니다.");

      setItems((current) => current.filter((item) => item.id !== guide.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "가이드 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 rounded-lg border bg-white p-3 shadow-soft md:grid-cols-[1fr_180px_auto_auto]">
        <SearchInput placeholder="검색어를 입력하세요." value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select value={assignable} onChange={(event) => setAssignable(event.target.value)}>
          <option value="">배정가능 전체</option>
          <option>가능</option>
          <option>불가</option>
        </Select>
        <Button>검색</Button>
        <Button onClick={() => edit()}>+ 등록</Button>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="overflow-hidden rounded-xl border bg-white shadow-soft">
        <div className="overflow-x-auto">
          <Table className="min-w-[1240px]">
            <TableHeader>
              <TableRow>
                <SortableTableHead label="이름" className="w-[120px] text-center" active={sortApplied && sortKey === "name"} direction={sortDirection} onClick={() => toggleSort("name")} />
                <SortableTableHead label="전화번호" className="w-[150px] text-center" active={sortApplied && sortKey === "phone"} direction={sortDirection} onClick={() => toggleSort("phone")} />
                <SortableTableHead label="생년월일" className="w-[120px] text-center" active={sortApplied && sortKey === "birthDate"} direction={sortDirection} onClick={() => toggleSort("birthDate")} />
                <SortableTableHead label="계좌번호" className="w-[180px] text-center" active={sortApplied && sortKey === "bankAccount"} direction={sortDirection} onClick={() => toggleSort("bankAccount")} />
                <SortableTableHead label="주중" className="w-[80px] text-center" active={sortApplied && sortKey === "availableWeekday"} direction={sortDirection} onClick={() => toggleSort("availableWeekday")} />
                <SortableTableHead label="주말" className="w-[80px] text-center" active={sortApplied && sortKey === "availableWeekend"} direction={sortDirection} onClick={() => toggleSort("availableWeekend")} />
                <SortableTableHead label="배정가능" className="w-[110px] text-center" active={sortApplied && sortKey === "assignable"} direction={sortDirection} onClick={() => toggleSort("assignable")} />
                <SortableTableHead label="사용여부" className="w-[110px] text-center" active={sortApplied && sortKey === "active"} direction={sortDirection} onClick={() => toggleSort("active")} />
                <SortableTableHead label="메모" active={sortApplied && sortKey === "memo"} direction={sortDirection} onClick={() => toggleSort("memo")} />
                <TableHead className="w-[150px] text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleItems.map((guide) => (
                <TableRow key={guide.id}>
                  <TableCell className="whitespace-nowrap text-center font-semibold">{guide.name}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{guide.phone}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{guide.birthDate || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{guide.bankAccount || "-"}</TableCell>
                  <TableCell className="text-center">{guide.availableWeekday ? "가능" : "-"}</TableCell>
                  <TableCell className="text-center">{guide.availableWeekend ? "가능" : "-"}</TableCell>
                  <TableCell className="text-center"><StatusBadge value={guide.assignable ? "가능" : "불가"} /></TableCell>
                  <TableCell className="text-center"><Switch checked={guide.active} /></TableCell>
                  <TableCell className="max-w-[420px] truncate" title={guide.memo || ""}>{guide.memo || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">
                    <Button size="sm" variant="outline" onClick={() => edit(guide)} disabled={deletingId === guide.id}>수정</Button>
                    <Button size="sm" variant="outline" className="ml-1 text-rose-700" onClick={() => remove(guide)} disabled={deletingId === guide.id}>{deletingId === guide.id ? "삭제중" : "삭제"}</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination totalCount={filtered.length} page={page} onPageChange={setPage} />
      </div>
      <GuideForm guide={selected} open={open} saving={saving} onOpenChange={setOpen} onSave={save} />
    </div>
  );
}
