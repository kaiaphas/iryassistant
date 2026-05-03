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

export function GuideTable({ guides }: { guides: Guide[] }) {
  const [query, setQuery] = React.useState("");
  const [assignable, setAssignable] = React.useState("");
  const [selected, setSelected] = React.useState<Guide | undefined>();
  const [open, setOpen] = React.useState(false);

  const filtered = guides.filter((guide) => {
    const q = query.toLowerCase();
    const assignableMatch = !assignable || (assignable === "가능" ? guide.assignable : !guide.assignable);
    return (!q || [guide.name, guide.phone, guide.memo].some((value) => value?.toLowerCase().includes(q))) && assignableMatch;
  });

  function edit(guide?: Guide) {
    setSelected(guide);
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 shadow-soft md:grid-cols-[1fr_180px_auto_auto]">
        <SearchInput placeholder="검색어를 입력하세요." value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select value={assignable} onChange={(event) => setAssignable(event.target.value)}>
          <option value="">배정가능 전체</option>
          <option>가능</option>
          <option>불가</option>
        </Select>
        <Button>검색</Button>
        <Button onClick={() => edit()}>+ 등록</Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-soft">
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                {["이름", "전화번호", "배정가능", "사용여부", "메모", "수정"].map((head) => <TableHead key={head}>{head}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((guide) => (
                <TableRow key={guide.id}>
                  <TableCell className="font-semibold">{guide.name}</TableCell>
                  <TableCell>{guide.phone}</TableCell>
                  <TableCell><StatusBadge value={guide.assignable ? "가능" : "불가"} /></TableCell>
                  <TableCell><Switch checked={guide.active} /></TableCell>
                  <TableCell>{guide.memo || "-"}</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => edit(guide)}>수정</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <GuideForm guide={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
