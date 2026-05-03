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
  const [query, setQuery] = React.useState("");
  const [assignable, setAssignable] = React.useState("");
  const [selected, setSelected] = React.useState<Driver | undefined>();
  const [open, setOpen] = React.useState(false);
  const filtered = drivers.filter((driver) => {
    const q = query.toLowerCase();
    const assignableMatch = !assignable || (assignable === "가능" ? driver.assignable : !driver.assignable);
    return (!q || [driver.name, driver.phone, driver.company, driver.memo].some((value) => value?.toLowerCase().includes(q))) && assignableMatch;
  });
  const edit = (driver?: Driver) => { setSelected(driver); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 shadow-soft md:grid-cols-[1fr_180px_auto_auto]">
        <SearchInput placeholder="검색어를 입력하세요." value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select value={assignable} onChange={(event) => setAssignable(event.target.value)}>
          <option value="">배정가능 전체</option><option>가능</option><option>불가</option>
        </Select>
        <Button>검색</Button><Button onClick={() => edit()}>+ 등록</Button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-white shadow-soft">
        <div className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader><TableRow>{["이름", "인승", "전화번호", "회사", "배정가능", "사용여부", "메모", "수정"].map((head) => <TableHead key={head}>{head}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {filtered.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-semibold">{driver.name}</TableCell><TableCell>{driver.capacity}</TableCell><TableCell>{driver.phone}</TableCell><TableCell>{driver.company}</TableCell>
                  <TableCell><StatusBadge value={driver.assignable ? "가능" : "불가"} /></TableCell><TableCell><Switch checked={driver.active} /></TableCell><TableCell>{driver.memo || "-"}</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => edit(driver)}>수정</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <DriverForm driver={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
