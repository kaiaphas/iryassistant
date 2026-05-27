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
import { TablePagination, tablePageSize } from "@/components/common/TablePagination";
import { SortableTableHead } from "@/components/common/SortableTableHead";
import { useTableSort } from "@/lib/table-sort";
import { maskResidentRegistrationNumber } from "@/lib/birth-date";

export function DriverTable({ drivers }: { drivers: Driver[] }) {
  const [items, setItems] = React.useState(drivers);
  const [query, setQuery] = React.useState("");
  const [assignable, setAssignable] = React.useState("");
  const [selected, setSelected] = React.useState<Driver | undefined>();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [page, setPage] = React.useState(1);
  const filtered = items.filter((driver) => {
    const q = query.toLowerCase();
    const assignableMatch = !assignable || (assignable === "가능" ? driver.assignable : !driver.assignable);
    return (!q || [driver.name, driver.phone, driver.birthDate, driver.bankAccount, driver.company, driver.driverType, driver.memo].some((value) => value?.toLowerCase().includes(q))) && assignableMatch;
  });
  const getSortValue = React.useCallback((driver: Driver, key: "name" | "capacity" | "phone" | "birthDate" | "bankAccount" | "company" | "driverType" | "assignable" | "active" | "memo") => ({
    name: driver.name,
    capacity: driver.capacity,
    phone: driver.phone,
    birthDate: driver.birthDate,
    bankAccount: driver.bankAccount,
    company: driver.company,
    driverType: driver.driverType,
    assignable: driver.assignable,
    active: driver.active,
    memo: driver.memo,
  }[key]), []);
  const { sortedItems, sortKey, sortDirection, sortApplied, toggleSort } = useTableSort<Driver, "name" | "capacity" | "phone" | "birthDate" | "bankAccount" | "company" | "driverType" | "assignable" | "active" | "memo">(filtered, "name", getSortValue);
  const totalPages = Math.max(1, Math.ceil(filtered.length / tablePageSize));
  const visibleItems = sortedItems.slice((page - 1) * tablePageSize, page * tablePageSize);
  React.useEffect(() => { setPage(1); }, [query, assignable]);
  React.useEffect(() => { setPage((current) => Math.min(current, totalPages)); }, [totalPages]);
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
    <div className="space-y-3">
      <div className="grid gap-2 rounded-lg border bg-white p-3 shadow-soft md:grid-cols-[1fr_180px_auto_auto]">
        <SearchInput placeholder="검색어를 입력하세요." value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select value={assignable} onChange={(event) => setAssignable(event.target.value)}>
          <option value="">배정가능 전체</option><option>가능</option><option>불가</option>
        </Select>
        <Button>검색</Button><Button onClick={() => edit()}>+ 등록</Button>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <div className="overflow-hidden rounded-xl border bg-white shadow-soft">
        <div className="overflow-x-auto">
          <Table className="min-w-[1450px]">
            <TableHeader>
              <TableRow>
                <SortableTableHead label="이름" className="w-[120px] text-center" active={sortApplied && sortKey === "name"} direction={sortDirection} onClick={() => toggleSort("name")} />
                <SortableTableHead label="인승" className="w-[90px] text-center" active={sortApplied && sortKey === "capacity"} direction={sortDirection} onClick={() => toggleSort("capacity")} />
                <SortableTableHead label="전화번호" className="w-[150px] text-center" active={sortApplied && sortKey === "phone"} direction={sortDirection} onClick={() => toggleSort("phone")} />
                <SortableTableHead label="주민번호" className="w-[130px] text-center" active={sortApplied && sortKey === "birthDate"} direction={sortDirection} onClick={() => toggleSort("birthDate")} />
                <SortableTableHead label="계좌번호" className="w-[180px] text-center" active={sortApplied && sortKey === "bankAccount"} direction={sortDirection} onClick={() => toggleSort("bankAccount")} />
                <SortableTableHead label="회사" className="w-[160px] text-center" active={sortApplied && sortKey === "company"} direction={sortDirection} onClick={() => toggleSort("company")} />
                <SortableTableHead label="구분" className="w-[90px] text-center" active={sortApplied && sortKey === "driverType"} direction={sortDirection} onClick={() => toggleSort("driverType")} />
                <SortableTableHead label="배정가능" className="w-[110px] text-center" active={sortApplied && sortKey === "assignable"} direction={sortDirection} onClick={() => toggleSort("assignable")} />
                <SortableTableHead label="사용여부" className="w-[110px] text-center" active={sortApplied && sortKey === "active"} direction={sortDirection} onClick={() => toggleSort("active")} />
                <SortableTableHead label="메모" active={sortApplied && sortKey === "memo"} direction={sortDirection} onClick={() => toggleSort("memo")} />
                <TableHead className="w-[150px] text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleItems.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="whitespace-nowrap text-center font-semibold">{driver.name}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{driver.capacity}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{driver.phone}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{maskResidentRegistrationNumber(driver.birthDate)}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{driver.bankAccount || "-"}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-center" title={driver.company}>{driver.company}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{driver.driverType}</TableCell>
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
        <TablePagination totalCount={filtered.length} page={page} onPageChange={setPage} />
      </div>
      <DriverForm driver={selected} open={open} saving={saving} onOpenChange={setOpen} onSave={save} />
    </div>
  );
}
