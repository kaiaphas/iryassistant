"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import type { RefundItem } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const emptyRefund: RefundItem = {
  id: "",
  no: 0,
  customerName: "",
  departureDate: "",
  peopleCount: 1,
  phone: "",
  paymentMethod: "계좌이체",
  depositDate: "",
  productAmount: 0,
  depositAmount: 0,
  refundRequestAmount: 0,
  depositor: "",
  registeredBy: "",
  status: "환불요청",
  bankAccount: "",
  memo: "",
};

function numberValue(value: string) {
  return Number(value.replaceAll(",", "")) || 0;
}

function newDraft(nextNo: number): RefundItem {
  return {
    ...emptyRefund,
    id: `DRAFT-${Date.now()}`,
    no: nextNo,
  };
}

export function RefundTable({ refunds }: { refunds: RefundItem[] }) {
  const [items, setItems] = React.useState(refunds);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<RefundItem | null>(null);

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase();
    return (
      (!q || [item.customerName, item.phone, item.depositor, item.bankAccount, item.memo].some((value) => value?.toLowerCase().includes(q)))
      && (!status || item.status === status)
    );
  });
  const totalRefund = filtered.reduce((sum, item) => sum + item.refundRequestAmount, 0);

  function addRow() {
    const nextNo = Math.max(0, ...items.map((row) => row.no)) + 1;
    const row = newDraft(nextNo);
    setItems((current) => [row, ...current]);
    setDraft(row);
    setEditingId(row.id);
  }

  function editRow(item: RefundItem) {
    setDraft(item);
    setEditingId(item.id);
  }

  function cancelEdit() {
    if (editingId?.startsWith("DRAFT-")) {
      setItems((current) => current.filter((item) => item.id !== editingId));
    }
    setDraft(null);
    setEditingId(null);
  }

  function updateDraft<K extends keyof RefundItem>(key: K, value: RefundItem[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  }

  function saveDraft() {
    if (!draft) return;
    const saved = draft.id.startsWith("DRAFT-") ? { ...draft, id: `REF-${Date.now()}` } : draft;
    setItems((current) => current.map((item) => item.id === draft.id ? saved : item));
    setDraft(null);
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 shadow-soft lg:grid-cols-[1fr_180px_auto]">
        <SearchInput placeholder="고객명, 전화번호, 입금자, 계좌, 메모 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">상태 전체</option>
          <option>환불요청</option>
          <option>처리중</option>
          <option>환불완료</option>
          <option>취소</option>
        </Select>
        <Button onClick={addRow} disabled={Boolean(editingId)}>
          <Plus className="h-4 w-4" />
          환불 등록
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-soft">
          <p className="text-sm text-slate-500">총 건수</p>
          <p className="mt-1 text-2xl font-bold">{filtered.length}건</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-soft">
          <p className="text-sm text-slate-500">환불요청금액 합계</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(totalRefund)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-soft">
          <p className="text-sm text-slate-500">환불완료</p>
          <p className="mt-1 text-2xl font-bold">{filtered.filter((item) => item.status === "환불완료").length}건</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-soft">
        <div className="overflow-x-auto scrollbar-thin">
          <Table className="min-w-[1680px] text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="h-9 w-[54px] whitespace-nowrap px-2 text-center text-[11px]">no.</TableHead>
                <TableHead className="w-[90px] whitespace-nowrap px-2 text-center text-[11px]">고객명</TableHead>
                <TableHead className="w-[108px] whitespace-nowrap px-2 text-center text-[11px]">출발일</TableHead>
                <TableHead className="w-[58px] whitespace-nowrap px-2 text-center text-[11px]">인원</TableHead>
                <TableHead className="w-[132px] whitespace-nowrap px-2 text-center text-[11px]">전화번호</TableHead>
                <TableHead className="w-[116px] whitespace-nowrap px-2 text-center text-[11px]">결제방식</TableHead>
                <TableHead className="w-[108px] whitespace-nowrap px-2 text-center text-[11px]">입금일</TableHead>
                <TableHead className="w-[108px] whitespace-nowrap px-2 text-right text-[11px]">상품총액</TableHead>
                <TableHead className="w-[108px] whitespace-nowrap px-2 text-right text-[11px]">입금액</TableHead>
                <TableHead className="w-[126px] whitespace-nowrap px-2 text-right text-[11px]">환불요청금액</TableHead>
                <TableHead className="w-[90px] whitespace-nowrap px-2 text-center text-[11px]">입금자</TableHead>
                <TableHead className="w-[100px] whitespace-nowrap px-2 text-right text-[11px]">잔금</TableHead>
                <TableHead className="w-[90px] whitespace-nowrap px-2 text-center text-[11px]">등록자</TableHead>
                <TableHead className="w-[100px] whitespace-nowrap px-2 text-center text-[11px]">상태</TableHead>
                <TableHead className="min-w-[260px] whitespace-nowrap px-2 text-center text-[11px]">은행 / 계좌번호 / 예금주</TableHead>
                <TableHead className="min-w-[220px] whitespace-nowrap px-2 text-center text-[11px]">메모</TableHead>
                <TableHead className="w-[116px] whitespace-nowrap px-2 text-center text-[11px]">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                editingId === item.id && draft ? (
                  <RefundEditRow key={item.id} item={draft} onChange={updateDraft} onSave={saveDraft} onCancel={cancelEdit} />
                ) : (
                  <RefundReadRow key={item.id} item={item} onEdit={editRow} disabled={Boolean(editingId)} />
                )
              ))}
              <TableRow className="bg-emerald-50/60 font-bold hover:bg-emerald-50/60">
                <TableCell colSpan={9} className="text-center">합계</TableCell>
                <TableCell className="text-right text-rose-700">{formatCurrency(totalRefund)}</TableCell>
                <TableCell colSpan={7} />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function RefundReadRow({ item, onEdit, disabled }: { item: RefundItem; onEdit: (item: RefundItem) => void; disabled: boolean }) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap px-2 text-center">{item.no}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center font-semibold">{item.customerName}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center">{item.departureDate}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center">{item.peopleCount}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center">{item.phone}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center">{item.paymentMethod}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center">{item.depositDate}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-right">{formatCurrency(item.productAmount)}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-right">{formatCurrency(item.depositAmount)}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-right font-semibold text-rose-700">{formatCurrency(item.refundRequestAmount)}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center">{item.depositor}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-right">{item.balanceAmount ? formatCurrency(item.balanceAmount) : "-"}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center">{item.registeredBy}</TableCell>
      <TableCell className="px-2 text-center"><StatusBadge value={item.status} /></TableCell>
      <TableCell className="max-w-[260px] truncate px-2" title={item.bankAccount}>{item.bankAccount}</TableCell>
      <TableCell className="max-w-[240px] truncate px-2" title={item.memo}>{item.memo || "-"}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center"><Button size="sm" variant="outline" onClick={() => onEdit(item)} disabled={disabled}>수정</Button></TableCell>
    </TableRow>
  );
}

function RefundEditRow({
  item,
  onChange,
  onSave,
  onCancel,
}: {
  item: RefundItem;
  onChange: <K extends keyof RefundItem>(key: K, value: RefundItem[K]) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inputClass = "h-8 min-w-0 px-2 text-xs";

  return (
    <TableRow className="bg-emerald-50/70 hover:bg-emerald-50/70">
      <TableCell className="px-2 text-center font-semibold">{item.no}</TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[86px]`} value={item.customerName} onChange={(event) => onChange("customerName", event.target.value)} /></TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[106px]`} type="date" value={item.departureDate} onChange={(event) => onChange("departureDate", event.target.value)} /></TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-16`} type="number" value={item.peopleCount} onChange={(event) => onChange("peopleCount", Number(event.target.value) || 0)} /></TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[128px]`} value={item.phone} onChange={(event) => onChange("phone", event.target.value)} /></TableCell>
      <TableCell className="px-1">
        <Select className="h-8 w-[112px] text-xs" value={item.paymentMethod} onChange={(event) => onChange("paymentMethod", event.target.value)}>
          <option>홈페이지결제</option>
          <option>계좌이체</option>
          <option>카드결제</option>
          <option>현금</option>
        </Select>
      </TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[104px]`} value={item.depositDate} onChange={(event) => onChange("depositDate", event.target.value)} /></TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[104px] text-right`} value={String(item.productAmount || "")} onChange={(event) => onChange("productAmount", numberValue(event.target.value))} /></TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[104px] text-right`} value={String(item.depositAmount || "")} onChange={(event) => onChange("depositAmount", numberValue(event.target.value))} /></TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[122px] text-right font-semibold text-rose-700`} value={String(item.refundRequestAmount || "")} onChange={(event) => onChange("refundRequestAmount", numberValue(event.target.value))} /></TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[86px]`} value={item.depositor} onChange={(event) => onChange("depositor", event.target.value)} /></TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[96px] text-right`} value={String(item.balanceAmount || "")} onChange={(event) => onChange("balanceAmount", numberValue(event.target.value))} /></TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[86px]`} value={item.registeredBy} onChange={(event) => onChange("registeredBy", event.target.value)} /></TableCell>
      <TableCell className="px-1">
        <Select className="h-8 w-[96px] text-xs" value={item.status} onChange={(event) => onChange("status", event.target.value as RefundItem["status"])}>
          <option>환불요청</option>
          <option>처리중</option>
          <option>환불완료</option>
          <option>취소</option>
        </Select>
      </TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[250px]`} value={item.bankAccount} onChange={(event) => onChange("bankAccount", event.target.value)} /></TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[210px]`} value={item.memo ?? ""} onChange={(event) => onChange("memo", event.target.value)} /></TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center">
        <Button size="sm" onClick={onSave}>저장</Button>
        <Button size="sm" variant="outline" className="ml-1" onClick={onCancel}>취소</Button>
      </TableCell>
    </TableRow>
  );
}
