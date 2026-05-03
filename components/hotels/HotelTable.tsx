"use client";

import * as React from "react";
import type { Hotel, RoomRate } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { SearchInput } from "@/components/common/SearchInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HotelForm } from "@/components/hotels/HotelForm";

function rateSummary(rate: RoomRate) {
  return `주중 ${formatCurrency(rate.weekday)} / 금 ${formatCurrency(rate.friday)} / 토 ${formatCurrency(rate.saturday)} / 성수기 ${formatCurrency(rate.peak)} / 조식 ${formatCurrency(rate.breakfast)}`;
}

export function HotelTable({ hotels }: { hotels: Hotel[] }) {
  const [region, setRegion] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Hotel | undefined>(hotels[0]);
  const filtered = hotels.filter((item) => (!region || item.regionName.includes(region)) && (!query || item.shopName.includes(query)));
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <div className="space-y-4">
        <div className="grid gap-3 rounded-xl border bg-white p-4 shadow-soft md:grid-cols-[180px_1fr_auto_auto]">
          <Input placeholder="지역명" value={region} onChange={(event) => setRegion(event.target.value)} />
          <SearchInput placeholder="상호명" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button>검색</Button><Button variant="outline" onClick={() => { setRegion(""); setQuery(""); }}>초기화</Button>
        </div>
        <div className="overflow-hidden rounded-xl border bg-white shadow-soft"><div className="overflow-x-auto"><Table className="min-w-[1000px]">
          <TableHeader><TableRow>{["지역명", "상호명", "2인실 단가 요약", "3인실 단가 요약", "4인실 단가 요약", "연락처"].map((head) => <TableHead key={head}>{head}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{filtered.map((item) => <TableRow key={item.id} onClick={() => setSelected(item)}><TableCell>{item.regionName}</TableCell><TableCell className="font-semibold">{item.shopName}</TableCell><TableCell>{rateSummary(item.roomRates.double)}</TableCell><TableCell>{rateSummary(item.roomRates.triple)}</TableCell><TableCell>{rateSummary(item.roomRates.quad)}</TableCell><TableCell>{item.phone}</TableCell></TableRow>)}</TableBody>
        </Table></div></div>
      </div>
      <HotelForm hotel={selected} />
    </div>
  );
}
