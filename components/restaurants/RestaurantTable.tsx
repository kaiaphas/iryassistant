"use client";

import * as React from "react";
import type { Restaurant } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { SearchInput } from "@/components/common/SearchInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RestaurantForm } from "@/components/restaurants/RestaurantForm";
import { TourTypeBadge } from "@/components/common/TourTypeBadge";
import { TablePagination, tablePageSize } from "@/components/common/TablePagination";
import { SortableTableHead } from "@/components/common/SortableTableHead";
import { useTableSort } from "@/lib/table-sort";

export function RestaurantTable({ restaurants }: { restaurants: Restaurant[] }) {
  const [items, setItems] = React.useState(restaurants);
  const [region, setRegion] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Restaurant | undefined>();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [page, setPage] = React.useState(1);
  const filtered = items.filter((item) => (!region || item.regionName.includes(region)) && (!query || item.shopName.includes(query) || item.productName.includes(query)));
  const getSortValue = React.useCallback((item: Restaurant, key: "regionName" | "tourType" | "productName" | "shopName" | "menu" | "retailPrice" | "depositPrice" | "serviceType" | "phone") => ({
    regionName: item.regionName,
    tourType: item.tourType,
    productName: item.productName,
    shopName: item.shopName,
    menu: item.menu,
    retailPrice: item.retailPrice,
    depositPrice: item.depositPrice,
    serviceType: item.serviceType,
    phone: item.phone,
  }[key]), []);
  const { sortedItems, sortKey, sortDirection, sortApplied, toggleSort } = useTableSort<Restaurant, "regionName" | "tourType" | "productName" | "shopName" | "menu" | "retailPrice" | "depositPrice" | "serviceType" | "phone">(filtered, "regionName", getSortValue);
  const totalPages = Math.max(1, Math.ceil(filtered.length / tablePageSize));
  const visibleItems = sortedItems.slice((page - 1) * tablePageSize, page * tablePageSize);

  React.useEffect(() => { setPage(1); }, [region, query]);
  React.useEffect(() => { setPage((current) => Math.min(current, totalPages)); }, [totalPages]);

  async function save(restaurant: Restaurant) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/masters/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restaurant),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "식당 저장에 실패했습니다.");

      setItems((current) => {
        const exists = current.some((item) => item.id === payload.id);
        return exists ? current.map((item) => (item.id === payload.id ? payload : item)) : [payload, ...current];
      });
      setSelected(payload);
      setOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "식당 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function add() {
    setSelected(undefined);
    setOpen(true);
  }

  function edit(restaurant: Restaurant) {
    setSelected(restaurant);
    setOpen(true);
  }

  async function remove(restaurant: Restaurant) {
    if (!window.confirm(`${restaurant.shopName} 식당을 삭제할까요?`)) return;

    setDeletingId(restaurant.id);
    setError("");
    try {
      const response = await fetch(`/api/masters/restaurants?id=${encodeURIComponent(restaurant.id)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "식당 삭제에 실패했습니다.");

      setItems((current) => current.filter((item) => item.id !== restaurant.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "식당 삭제에 실패했습니다.");
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
        <div className="overflow-hidden rounded-xl border bg-white shadow-soft"><div className="overflow-x-auto"><Table className="min-w-[1120px]">
          <TableHeader>
            <TableRow>
              <SortableTableHead label="지역명" className="w-[130px] text-center" active={sortApplied && sortKey === "regionName"} direction={sortDirection} onClick={() => toggleSort("regionName")} />
              <SortableTableHead label="구분" className="w-[80px] text-center" active={sortApplied && sortKey === "tourType"} direction={sortDirection} onClick={() => toggleSort("tourType")} />
              <SortableTableHead label="상품명" className="min-w-[200px]" active={sortApplied && sortKey === "productName"} direction={sortDirection} onClick={() => toggleSort("productName")} />
              <SortableTableHead label="상호명" className="min-w-[160px]" active={sortApplied && sortKey === "shopName"} direction={sortDirection} onClick={() => toggleSort("shopName")} />
              <SortableTableHead label="메뉴" className="w-[130px] text-center" active={sortApplied && sortKey === "menu"} direction={sortDirection} onClick={() => toggleSort("menu")} />
              <SortableTableHead label="소비자가" className="w-[110px] text-right" active={sortApplied && sortKey === "retailPrice"} direction={sortDirection} onClick={() => toggleSort("retailPrice")} />
              <SortableTableHead label="입금가" className="w-[110px] text-right" active={sortApplied && sortKey === "depositPrice"} direction={sortDirection} onClick={() => toggleSort("depositPrice")} />
              <SortableTableHead label="서비스여부" className="w-[120px] text-center" active={sortApplied && sortKey === "serviceType"} direction={sortDirection} onClick={() => toggleSort("serviceType")} />
              <SortableTableHead label="연락처" className="w-[150px] text-center" active={sortApplied && sortKey === "phone"} direction={sortDirection} onClick={() => toggleSort("phone")} />
              <TableHead className="w-[150px] text-center">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{visibleItems.map((item) => <TableRow key={item.id}>
            <TableCell className="whitespace-nowrap text-center">{item.regionName}</TableCell>
            <TableCell className="whitespace-nowrap text-center"><TourTypeBadge value={item.tourType} /></TableCell>
            <TableCell className="max-w-[240px] truncate" title={item.productName}>{item.productName}</TableCell>
            <TableCell className="max-w-[180px] truncate font-semibold" title={item.shopName}>{item.shopName}</TableCell>
            <TableCell className="max-w-[130px] truncate text-center" title={item.menu}>{item.menu}</TableCell>
            <TableCell className="whitespace-nowrap text-right">{formatCurrency(item.retailPrice)}</TableCell>
            <TableCell className="whitespace-nowrap text-right">{formatCurrency(item.depositPrice)}</TableCell>
            <TableCell className="whitespace-nowrap text-center">{item.serviceType}</TableCell>
            <TableCell className="whitespace-nowrap text-center">{item.phone}</TableCell>
            <TableCell className="whitespace-nowrap text-center">
              <Button size="sm" variant="outline" onClick={() => edit(item)} disabled={deletingId === item.id}>수정</Button>
              <Button size="sm" variant="outline" className="ml-1 text-rose-700" onClick={() => remove(item)} disabled={deletingId === item.id}>{deletingId === item.id ? "삭제중" : "삭제"}</Button>
            </TableCell>
          </TableRow>)}</TableBody>
        </Table></div><TablePagination totalCount={filtered.length} page={page} onPageChange={setPage} /></div>
      <RestaurantForm restaurant={selected} open={open} saving={saving} onOpenChange={setOpen} onSave={save} onCancel={() => setOpen(false)} />
    </div>
  );
}
