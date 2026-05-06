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
        <div className="overflow-hidden rounded-xl border bg-white shadow-soft"><div className="overflow-x-auto"><Table className="min-w-[900px]">
          <TableHeader><TableRow>{["상품명", "지역명", "상호명", "메뉴", "소비자가", "입금가", "서비스여부", "연락처", "수정"].map((head) => <TableHead key={head}>{head}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{filtered.map((item) => <TableRow key={item.id}><TableCell>{item.productName}</TableCell><TableCell>{item.regionName}</TableCell><TableCell className="font-semibold">{item.shopName}</TableCell><TableCell>{item.menu}</TableCell><TableCell>{formatCurrency(item.retailPrice)}</TableCell><TableCell>{formatCurrency(item.depositPrice)}</TableCell><TableCell>{item.serviceType}</TableCell><TableCell>{item.phone}</TableCell><TableCell><Button size="sm" variant="outline" onClick={() => edit(item)}>수정</Button></TableCell></TableRow>)}</TableBody>
        </Table></div></div>
      <RestaurantForm restaurant={selected} open={open} saving={saving} onOpenChange={setOpen} onSave={save} onCancel={() => setOpen(false)} />
    </div>
  );
}
