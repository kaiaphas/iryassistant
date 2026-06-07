"use client";

import * as React from "react";
import type { SettlementItem, SettlementType } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SettlementTableProps = {
  initialItems: SettlementItem[];
  initialMonth: string;
  initialType: SettlementType;
};

function numberValue(value: string) {
  return Number(value.replaceAll(",", "")) || 0;
}

function decimalValue(value: string) {
  if (!value.trim()) return 0;
  return Number(value) || 0;
}

function formatNumberInput(value: number) {
  if (!value) return "";
  return new Intl.NumberFormat("ko-KR").format(value);
}

function calculateWithholding(amount: number, rate: number) {
  return Math.round((amount * rate) / 100);
}

function getTypeLabel(type: SettlementType) {
  return type === "GUIDE" ? "가이드" : "기사";
}

function getTourTypeVariant(tourType: SettlementItem["tourType"]) {
  return tourType === "숙박" ? "blue" : "secondary";
}

export function SettlementTable({ initialItems, initialMonth, initialType }: SettlementTableProps) {
  const [items, setItems] = React.useState(initialItems);
  const [month, setMonth] = React.useState(initialMonth);
  const [type, setType] = React.useState<SettlementType>(initialType);
  const [query, setQuery] = React.useState("");
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase();
    return !q || [
      item.personName,
      item.personPhone,
      item.bankAccount,
      item.tourType,
      item.productName,
      item.busCompany,
      item.memo,
    ].some((value) => value?.toLowerCase().includes(q));
  });

  const groupedItems = React.useMemo(() => {
    const groups = new Map<string, SettlementItem[]>();
    for (const item of filtered) {
      const key = `${item.personId}:${item.personName}`;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return Array.from(groups.entries()).map(([key, groupItems]) => ({
      key,
      personName: groupItems[0].personName,
      bankAccount: groupItems[0].bankAccount,
      items: groupItems.sort((a, b) => a.tourDate.localeCompare(b.tourDate)),
      amount: groupItems.reduce((sum, item) => sum + item.amount, 0),
      netAmount: groupItems.reduce((sum, item) => sum + item.netAmount, 0),
    }));
  }, [filtered]);

  const totalAmount = filtered.reduce((sum, item) => sum + item.amount, 0);
  const totalWithholding = filtered.reduce((sum, item) => sum + item.withholdingAmount, 0);
  const totalNetAmount = filtered.reduce((sum, item) => sum + item.netAmount, 0);

  function updateItem<K extends keyof SettlementItem>(id: string, key: K, value: SettlementItem[K]) {
    setItems((current) => current.map((item) => {
      if (item.id !== id) return item;

      const next = { ...item, [key]: value };
      if (key === "amount" || key === "withholdingRate") {
        next.withholdingAmount = calculateWithholding(next.amount, next.withholdingRate);
        next.netAmount = next.amount - next.withholdingAmount;
      }
      return next;
    }));
  }

  async function fetchItems(nextMonth = month, nextType = type) {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/settlements?month=${encodeURIComponent(nextMonth)}&type=${nextType}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "정산서 조회에 실패했습니다.");
      setItems(payload);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "정산서 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function saveItem(item: SettlementItem) {
    setSavingId(item.id);
    setMessage("");
    try {
      const response = await fetch("/api/settlements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.message ?? "정산 항목 저장에 실패했습니다.");
      setItems((current) => current.map((currentItem) => (
        currentItem.id === item.id
        || (
          currentItem.settlementMonth === saved.settlementMonth
          && currentItem.settlementType === saved.settlementType
          && currentItem.scheduleId === saved.scheduleId
          && currentItem.personId === saved.personId
        )
          ? saved
          : currentItem
      )));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "정산 항목 저장에 실패했습니다.");
    } finally {
      setSavingId(null);
    }
  }

  function changeMonth(value: string) {
    setMonth(value);
    void fetchItems(value, type);
  }

  function changeType(value: SettlementType) {
    setType(value);
    void fetchItems(month, value);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input className="w-[160px]" type="month" value={month} onChange={(event) => changeMonth(event.target.value)} />
        <Select className="w-[140px]" value={type} onChange={(event) => changeType(event.target.value as SettlementType)}>
          <option value="GUIDE">가이드</option>
          <option value="DRIVER">기사</option>
        </Select>
        <Input className="w-[260px]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 상품명, 차량, 계좌 검색" />
        <Button onClick={() => fetchItems()} variant="outline" disabled={loading}>조회</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">정산 건수</p>
          <p className="mt-1 text-xl font-semibold">{filtered.length}건</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">총 금액</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">공제액</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(totalWithholding)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">실지급액</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(totalNetAmount)}</p>
        </div>
      </div>

      {message ? <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div> : null}

      <div className="overflow-hidden rounded-xl border bg-white shadow-soft">
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px] text-center">여행일자</TableHead>
                <TableHead className="w-[90px] text-center">구분</TableHead>
                <TableHead>상품명/여행지</TableHead>
                <TableHead className="w-[150px] text-center">{getTypeLabel(type)}</TableHead>
                <TableHead className="w-[130px] text-center">금액</TableHead>
                <TableHead className="w-[90px] text-center">공제율</TableHead>
                <TableHead className="w-[120px] text-center">공제액</TableHead>
                <TableHead className="w-[120px] text-center">실지급액</TableHead>
                <TableHead className="w-[220px] text-center">메모</TableHead>
                <TableHead className="w-[90px] text-center">저장</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedItems.map((group) => (
                <React.Fragment key={group.key}>
                  <TableRow className="bg-emerald-50">
                    <TableCell colSpan={4} className="font-semibold">
                      {group.personName}
                      {group.bankAccount ? <span className="ml-3 text-xs font-normal text-slate-600">{group.bankAccount}</span> : null}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(group.amount)}</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right font-semibold">{formatCurrency(group.netAmount)}</TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                  {group.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap text-center">{item.tourDate}</TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        <Badge variant={getTourTypeVariant(item.tourType)}>{item.tourType}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[360px] truncate" title={item.productName}>{item.productName}</TableCell>
                      <TableCell className="whitespace-nowrap text-center">{item.personName}</TableCell>
                      <TableCell>
                        <Input
                          className="text-right"
                          value={formatNumberInput(item.amount)}
                          onChange={(event) => updateItem(item.id, "amount", numberValue(event.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="text-right"
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          value={String(item.withholdingRate)}
                          onChange={(event) => updateItem(item.id, "withholdingRate", decimalValue(event.target.value))}
                        />
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.withholdingAmount)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.netAmount)}</TableCell>
                      <TableCell>
                        <Input value={item.memo ?? ""} onChange={(event) => updateItem(item.id, "memo", event.target.value)} placeholder="메모" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button size="sm" variant="outline" onClick={() => saveItem(item)} disabled={savingId === item.id}>
                          {savingId === item.id ? "저장중" : "저장"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
              {groupedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-28 text-center text-slate-500">
                    해당 월에 매핑된 {getTypeLabel(type)} 일정이 없습니다.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
