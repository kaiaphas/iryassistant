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
  const [region, setRegion] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Restaurant | undefined>(restaurants[0]);
  const filtered = restaurants.filter((item) => (!region || item.regionName.includes(region)) && (!query || item.shopName.includes(query) || item.productName.includes(query)));
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="grid gap-3 rounded-xl border bg-white p-4 shadow-soft md:grid-cols-[180px_1fr_auto_auto]">
          <Input placeholder="지역명" value={region} onChange={(event) => setRegion(event.target.value)} />
          <SearchInput placeholder="상호명" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button>검색</Button><Button variant="outline" onClick={() => { setRegion(""); setQuery(""); }}>초기화</Button>
        </div>
        <div className="overflow-hidden rounded-xl border bg-white shadow-soft"><div className="overflow-x-auto"><Table className="min-w-[900px]">
          <TableHeader><TableRow>{["상품명", "지역명", "상호명", "메뉴", "소비자가", "입금가", "서비스여부", "연락처"].map((head) => <TableHead key={head}>{head}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{filtered.map((item) => <TableRow key={item.id} onClick={() => setSelected(item)}><TableCell>{item.productName}</TableCell><TableCell>{item.regionName}</TableCell><TableCell className="font-semibold">{item.shopName}</TableCell><TableCell>{item.menu}</TableCell><TableCell>{formatCurrency(item.retailPrice)}</TableCell><TableCell>{formatCurrency(item.depositPrice)}</TableCell><TableCell>{item.serviceType}</TableCell><TableCell>{item.phone}</TableCell></TableRow>)}</TableBody>
        </Table></div></div>
      </div>
      <RestaurantForm restaurant={selected} />
    </div>
  );
}
