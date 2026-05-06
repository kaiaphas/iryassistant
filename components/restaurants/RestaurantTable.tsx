"use client";

import * as React from "react";
import type { Restaurant } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { SearchInput } from "@/components/common/SearchInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RestaurantForm } from "@/components/restaurants/RestaurantForm";

export function RestaurantTable({ restaurants }: { restaurants: Restaurant[] }) {
  const [items, setItems] = React.useState(restaurants);
  const [region, setRegion] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Restaurant | undefined>();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const filtered = items.filter((item) => (!region || item.regionName.includes(region)) && (!query || item.shopName.includes(query) || item.productName.includes(query)));

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

  return (
    <div className="space-y-4">
        <div className="grid gap-3 rounded-xl border bg-white p-4 shadow-soft md:grid-cols-[180px_1fr_auto_auto_auto]">
          <Input placeholder="지역명" value={region} onChange={(event) => setRegion(event.target.value)} />
          <SearchInput placeholder="상호명" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button>검색</Button><Button variant="outline" onClick={() => { setRegion(""); setQuery(""); }}>초기화</Button>
          <Button onClick={add}>+ 등록</Button>
        </div>
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        <div className="overflow-hidden rounded-xl border bg-white shadow-soft"><div className="overflow-x-auto"><Table className="min-w-[1120px] text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px] text-center">지역명</TableHead>
              <TableHead className="min-w-[200px]">상품명</TableHead>
              <TableHead className="min-w-[160px]">상호명</TableHead>
              <TableHead className="w-[130px] text-center">메뉴</TableHead>
              <TableHead className="w-[110px] text-right">소비자가</TableHead>
              <TableHead className="w-[110px] text-right">입금가</TableHead>
              <TableHead className="w-[120px] text-center">서비스여부</TableHead>
              <TableHead className="w-[150px] text-center">연락처</TableHead>
              <TableHead className="w-[90px] text-center">수정</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{filtered.map((item) => <TableRow key={item.id}>
            <TableCell className="whitespace-nowrap text-center">{item.regionName}</TableCell>
            <TableCell className="max-w-[240px] truncate" title={item.productName}>{item.productName}</TableCell>
            <TableCell className="max-w-[180px] truncate font-semibold" title={item.shopName}>{item.shopName}</TableCell>
            <TableCell className="max-w-[130px] truncate text-center" title={item.menu}>{item.menu}</TableCell>
            <TableCell className="whitespace-nowrap text-right">{formatCurrency(item.retailPrice)}</TableCell>
            <TableCell className="whitespace-nowrap text-right">{formatCurrency(item.depositPrice)}</TableCell>
            <TableCell className="whitespace-nowrap text-center">{item.serviceType}</TableCell>
            <TableCell className="whitespace-nowrap text-center">{item.phone}</TableCell>
            <TableCell className="text-center"><Button size="sm" variant="outline" onClick={() => edit(item)}>수정</Button></TableCell>
          </TableRow>)}</TableBody>
        </Table></div></div>
      <RestaurantForm restaurant={selected} open={open} saving={saving} onOpenChange={setOpen} onSave={save} onCancel={() => setOpen(false)} />
    </div>
  );
}
