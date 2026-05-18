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
import { TablePagination, tablePageSize } from "@/components/common/TablePagination";

export function CodeTable({ codes }: { codes: CodeItem[] }) {
  const [group, setGroup] = React.useState("PRODUCT_CODE");
  const [selected, setSelected] = React.useState<CodeItem | undefined>();
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const filtered = codes.filter((code) => code.group === group);
  const totalPages = Math.max(1, Math.ceil(filtered.length / tablePageSize));
  const visibleItems = filtered.slice((page - 1) * tablePageSize, page * tablePageSize);
  const currentLabel = codeCategories.find((category) => category.group === group)?.label || group;

  React.useEffect(() => {
    setPage(1);
  }, [group]);

  React.useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  function edit(code?: CodeItem) {
    setSelected(code);
    setOpen(true);
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <CodeCategoryTabs value={group} onChange={setGroup} />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white p-3 shadow-soft">
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
              {visibleItems.map((code) => (
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
          <TablePagination totalCount={filtered.length} page={page} onPageChange={setPage} />
        </div>
        <div className="space-y-3 lg:hidden">
          {visibleItems.map((code) => (
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
        <div className="lg:hidden">
          <TablePagination totalCount={filtered.length} page={page} onPageChange={setPage} />
        </div>
      </div>
      <CodeForm code={selected} group={group} open={open} onOpenChange={setOpen} />
    </div>
  );
}
