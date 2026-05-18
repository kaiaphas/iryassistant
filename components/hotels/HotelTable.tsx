"use client";

import * as React from "react";
import type { Hotel, RoomRate } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { SearchInput } from "@/components/common/SearchInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HotelForm } from "@/components/hotels/HotelForm";
import { TablePagination, tablePageSize } from "@/components/common/TablePagination";
import { SortableTableHead } from "@/components/common/SortableTableHead";
import { useTableSort } from "@/lib/table-sort";

function rateSummary(rate: RoomRate) {
  return `주중 ${formatCurrency(rate.weekday)} / 금 ${formatCurrency(rate.friday)} / 토 ${formatCurrency(rate.saturday)} / 성수기 ${formatCurrency(rate.peak)} / 조식 ${formatCurrency(rate.breakfast)}`;
}

export function HotelTable({ hotels }: { hotels: Hotel[] }) {
  const [items, setItems] = React.useState(hotels);
  const [region, setRegion] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Hotel | undefined>();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [page, setPage] = React.useState(1);
  const filtered = items.filter((item) => (!region || item.regionName.includes(region)) && (!query || item.shopName.includes(query)));
  const getSortValue = React.useCallback((item: Hotel, key: "regionName" | "shopName" | "double" | "triple" | "quad" | "phone") => ({
    regionName: item.regionName,
    shopName: item.shopName,
    double: item.roomRates.double.weekday,
    triple: item.roomRates.triple.weekday,
    quad: item.roomRates.quad.weekday,
    phone: item.phone,
  }[key]), []);
  const { sortedItems, sortKey, sortDirection, toggleSort } = useTableSort<Hotel, "regionName" | "shopName" | "double" | "triple" | "quad" | "phone">(filtered, "regionName", getSortValue);
  const totalPages = Math.max(1, Math.ceil(filtered.length / tablePageSize));
  const visibleItems = sortedItems.slice((page - 1) * tablePageSize, page * tablePageSize);

  React.useEffect(() => { setPage(1); }, [region, query]);
  React.useEffect(() => { setPage((current) => Math.min(current, totalPages)); }, [totalPages]);

  async function save(hotel: Hotel) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/masters/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hotel),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "호텔 저장에 실패했습니다.");

      setItems((current) => {
        const exists = current.some((item) => item.id === payload.id);
        return exists ? current.map((item) => (item.id === payload.id ? payload : item)) : [payload, ...current];
      });
      setSelected(payload);
      setOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "호텔 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function add() {
    setSelected(undefined);
    setOpen(true);
  }

  function edit(hotel: Hotel) {
    setSelected(hotel);
    setOpen(true);
  }

  async function remove(hotel: Hotel) {
    if (!window.confirm(`${hotel.shopName} 호텔을 삭제할까요?`)) return;

    setDeletingId(hotel.id);
    setError("");
    try {
      const response = await fetch(`/api/masters/hotels?id=${encodeURIComponent(hotel.id)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "호텔 삭제에 실패했습니다.");

      setItems((current) => current.filter((item) => item.id !== hotel.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "호텔 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
        <div className="grid gap-2 rounded-lg border bg-white p-3 shadow-soft md:grid-cols-[180px_1fr_auto_auto_auto]">
          <Input placeholder="지역명" value={region} onChange={(event) => setRegion(event.target.value)} />
          <SearchInput placeholder="상호명" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button>검색</Button><Button variant="outline" onClick={() => { setRegion(""); setQuery(""); }}>초기화</Button>
          <Button onClick={add}>+ 등록</Button>
        </div>
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        <div className="overflow-hidden rounded-xl border bg-white shadow-soft"><div className="overflow-x-auto"><Table className="min-w-[1320px]">
          <TableHeader>
            <TableRow>
              <SortableTableHead label="지역명" className="w-[130px] text-center" active={sortKey === "regionName"} direction={sortDirection} onClick={() => toggleSort("regionName")} />
              <SortableTableHead label="상호명" className="min-w-[180px]" active={sortKey === "shopName"} direction={sortDirection} onClick={() => toggleSort("shopName")} />
              <SortableTableHead label="2인실 단가 요약" className="min-w-[280px]" active={sortKey === "double"} direction={sortDirection} onClick={() => toggleSort("double")} />
              <SortableTableHead label="3인실 단가 요약" className="min-w-[280px]" active={sortKey === "triple"} direction={sortDirection} onClick={() => toggleSort("triple")} />
              <SortableTableHead label="4인실 단가 요약" className="min-w-[280px]" active={sortKey === "quad"} direction={sortDirection} onClick={() => toggleSort("quad")} />
              <SortableTableHead label="연락처" className="w-[150px] text-center" active={sortKey === "phone"} direction={sortDirection} onClick={() => toggleSort("phone")} />
              <TableHead className="w-[150px] text-center">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{visibleItems.map((item) => <TableRow key={item.id}>
            <TableCell className="whitespace-nowrap text-center">{item.regionName}</TableCell>
            <TableCell className="max-w-[200px] truncate font-semibold" title={item.shopName}>{item.shopName}</TableCell>
            <TableCell className="max-w-[300px] truncate" title={rateSummary(item.roomRates.double)}>{rateSummary(item.roomRates.double)}</TableCell>
            <TableCell className="max-w-[300px] truncate" title={rateSummary(item.roomRates.triple)}>{rateSummary(item.roomRates.triple)}</TableCell>
            <TableCell className="max-w-[300px] truncate" title={rateSummary(item.roomRates.quad)}>{rateSummary(item.roomRates.quad)}</TableCell>
            <TableCell className="whitespace-nowrap text-center">{item.phone}</TableCell>
            <TableCell className="whitespace-nowrap text-center">
              <Button size="sm" variant="outline" onClick={() => edit(item)} disabled={deletingId === item.id}>수정</Button>
              <Button size="sm" variant="outline" className="ml-1 text-rose-700" onClick={() => remove(item)} disabled={deletingId === item.id}>{deletingId === item.id ? "삭제중" : "삭제"}</Button>
            </TableCell>
          </TableRow>)}</TableBody>
        </Table></div><TablePagination totalCount={filtered.length} page={page} onPageChange={setPage} /></div>
      <HotelForm hotel={selected} open={open} saving={saving} onOpenChange={setOpen} onSave={save} onCancel={() => setOpen(false)} />
    </div>
  );
}
