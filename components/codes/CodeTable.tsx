"use client";

import * as React from "react";
import type { CodeItem } from "@/lib/types";
import { codeCategories } from "@/lib/constants";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CodeCategoryTabs } from "@/components/codes/CodeCategoryTabs";
import { CodeForm } from "@/components/codes/CodeForm";

export function CodeTable({ codes }: { codes: CodeItem[] }) {
  const [group, setGroup] = React.useState("PRODUCT_CODE");
  const [selected, setSelected] = React.useState<CodeItem | undefined>();
  const [open, setOpen] = React.useState(false);
  const filtered = codes.filter((code) => code.group === group);
  const currentLabel = codeCategories.find((category) => category.group === group)?.label || group;

  function edit(code?: CodeItem) {
    setSelected(code);
    setOpen(true);
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <CodeCategoryTabs value={group} onChange={setGroup} />
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-soft">
          <div>
            <p className="font-semibold">{currentLabel}</p>
            <p className="text-sm text-slate-500">문자열 기준정보를 코드화해 API 연동이 쉬운 구조로 관리합니다.</p>
          </div>
          <Button onClick={() => edit()}>+ 코드 등록</Button>
        </div>
        <div className="hidden overflow-hidden rounded-xl border bg-white shadow-soft lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                {["코드그룹", "코드값", "코드명", "설명", "정렬순서", "사용여부", "등록일", "수정일", ""].map((head) => <TableHead key={head}>{head}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>{code.group}</TableCell>
                  <TableCell className="font-mono text-xs">{code.value}</TableCell>
                  <TableCell className="font-semibold">{code.label}</TableCell>
                  <TableCell>{code.description || "-"}</TableCell>
                  <TableCell>{code.sortOrder}</TableCell>
                  <TableCell><StatusBadge value={code.active ? "사용" : "미사용"} /></TableCell>
                  <TableCell>{code.createdAt}</TableCell>
                  <TableCell>{code.updatedAt || "-"}</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => edit(code)}>수정</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="space-y-3 lg:hidden">
          {filtered.map((code) => (
            <Card key={code.id}>
              <CardContent className="p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">{code.label}</p>
                    <p className="font-mono text-xs text-slate-500">{code.value}</p>
                  </div>
                  <StatusBadge value={code.active ? "사용" : "미사용"} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{code.description}</p>
                <Button className="mt-4 w-full" variant="outline" onClick={() => edit(code)}>수정</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <CodeForm code={selected} group={group} open={open} onOpenChange={setOpen} />
    </div>
  );
}
