"use client";

import * as React from "react";
import { CalendarDays, Plus } from "lucide-react";
import type { AdminUser, RefundItem, RefundPayment } from "@/lib/types";
import { getKstDateInput } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination, tablePageSize } from "@/components/common/TablePagination";
import { SortableTableHead } from "@/components/common/SortableTableHead";
import { useTableSort } from "@/lib/table-sort";
import { useUnsavedChanges } from "@/lib/unsaved-changes";

const emptyRefund: RefundItem = {
  id: "",
  no: 0,
  refundDate: "",
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
  status: "환불신청",
  bankAccount: "",
  memo: "",
  payments: [],
};

function numberValue(value: string) {
  return Number(value.replaceAll(",", "")) || 0;
}

function formatNumberInput(value: number | undefined) {
  if (!value) return "";
  return new Intl.NumberFormat("ko-KR").format(value);
}

function parseDateText(value: string) {
  const trimmed = value.trim();
  const dashed = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const compact = trimmed.replace(/\D/g, "").match(/^(\d{4})(\d{2})(\d{2})$/);
  const match = dashed ?? compact;
  if (!match) return "";

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() + 1 !== Number(month)
    || date.getUTCDate() !== Number(day)
  ) {
    return "";
  }
  return `${year}-${month}-${day}`;
}

function addDays(dateText: string, days: number) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function newDraft(nextNo: number, refundDate: string, registeredBy: string): RefundItem {
  return {
    ...emptyRefund,
    id: `DRAFT-${Date.now()}`,
    no: nextNo,
    refundDate,
    registeredBy,
  };
}

export function RefundTable({ refunds, activeAdminUsers }: { refunds: RefundItem[]; activeAdminUsers: AdminUser[] }) {
  const [items, setItems] = React.useState(refunds);
  const [drafts, setDrafts] = React.useState<RefundItem[]>([]);
  const [startDate, setStartDate] = React.useState(() => getKstDateInput());
  const [endDate, setEndDate] = React.useState(() => getKstDateInput());
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<RefundItem | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [openIds, setOpenIds] = React.useState<string[]>([]);
  const [paymentDrafts, setPaymentDrafts] = React.useState<Record<string, Omit<RefundPayment, "id">>>({});
  const [editingPayment, setEditingPayment] = React.useState<RefundPayment | null>(null);
  const { setUnsavedChanges, clearUnsavedChanges } = useUnsavedChanges();

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase();
    return (
      (!startDate || item.refundDate >= startDate)
      && (!endDate || item.refundDate <= endDate)
      && (!q || [
        item.customerName,
        item.phone,
        item.bankAccount,
        item.memo,
        ...item.payments.flatMap((payment) => [payment.depositor, payment.memo]),
      ].some((value) => value?.toLowerCase().includes(q)))
      && (!status || item.status === status)
    );
  });
  const getSortValue = React.useCallback((item: RefundItem, key: "no" | "refundDate" | "customerName" | "departureDate" | "peopleCount" | "phone" | "paymentMethod" | "productAmount" | "depositAmount" | "refundRequestAmount" | "registeredBy" | "status" | "bankAccount") => ({
    no: item.no,
    refundDate: item.refundDate,
    customerName: item.customerName,
    departureDate: item.departureDate,
    peopleCount: item.peopleCount,
    phone: item.phone,
    paymentMethod: item.paymentMethod,
    productAmount: item.productAmount,
    depositAmount: item.depositAmount,
    refundRequestAmount: item.refundRequestAmount,
    registeredBy: item.registeredBy,
    status: item.status,
    bankAccount: item.bankAccount,
  }[key]), []);
  const { sortedItems, sortKey, sortDirection, sortApplied, toggleSort } = useTableSort<RefundItem, "no" | "refundDate" | "customerName" | "departureDate" | "peopleCount" | "phone" | "paymentMethod" | "productAmount" | "depositAmount" | "refundRequestAmount" | "registeredBy" | "status" | "bankAccount">(filtered, "refundDate", getSortValue, "desc");
  const totalPages = Math.max(1, Math.ceil(filtered.length / tablePageSize));
  const visibleItems = sortedItems.slice((page - 1) * tablePageSize, page * tablePageSize);
  const totalRefund = filtered.reduce((sum, item) => sum + item.refundRequestAmount, 0);
  const hasUnsavedRefundChanges = drafts.length > 0 || Boolean(draft) || Object.keys(paymentDrafts).length > 0 || Boolean(editingPayment);

  React.useEffect(() => {
    setPage(1);
  }, [startDate, endDate, query, status]);

  React.useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  React.useEffect(() => {
    setUnsavedChanges("refunds", hasUnsavedRefundChanges);
  }, [hasUnsavedRefundChanges, setUnsavedChanges]);

  React.useEffect(() => () => clearUnsavedChanges("refunds"), [clearUnsavedChanges]);

  function addRow() {
    const defaultRefundDate = startDate || getKstDateInput();
    const sameDateItems = [...items, ...drafts].filter((row) => row.refundDate === defaultRefundDate);
    const nextNo = Math.max(0, ...sameDateItems.map((row) => row.no)) + 1;
    const row = newDraft(nextNo, defaultRefundDate, activeAdminUsers[0]?.name ?? "");
    setDrafts((current) => [row, ...current]);
    setMessage("");
  }

  function editRow(item: RefundItem) {
    setDraft({ ...item });
    setEditingId(item.id);
    setMessage("");
  }

  function cancelEdit() {
    setDraft(null);
    setEditingId(null);
  }

  function removeDraft(id: string) {
    setDrafts((current) => current.filter((item) => item.id !== id));
  }

  function setRelativeRange(days: number) {
    const today = getKstDateInput();
    setStartDate(addDays(today, -days));
    setEndDate(today);
  }

  function toggleOpen(id: string) {
    setOpenIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function startPaymentDraft(item: RefundItem) {
    setOpenIds((current) => current.includes(item.id) ? current : [...current, item.id]);
    setPaymentDrafts((current) => ({
      ...current,
      [item.id]: {
        refundId: item.id,
        depositDate: getKstDateInput(),
        depositAmount: 0,
        depositor: item.customerName,
        memo: "",
      },
    }));
  }

  function updatePaymentDraft<K extends keyof Omit<RefundPayment, "id">>(refundId: string, key: K, value: Omit<RefundPayment, "id">[K]) {
    setPaymentDrafts((current) => ({
      ...current,
      [refundId]: { ...current[refundId], [key]: value },
    }));
  }

  async function savePayment(refundId: string) {
    const draftPayment = paymentDrafts[refundId];
    if (!draftPayment) return;

    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/refunds/${refundId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftPayment),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.message ?? "입금내역 저장에 실패했습니다.");

      setItems((current) => current.map((item) => {
        if (item.id !== refundId) return item;
        const payments = [...item.payments, saved as RefundPayment];
        return {
          ...item,
          payments,
          depositAmount: payments.reduce((sum, payment) => sum + payment.depositAmount, 0),
        };
      }));
      setPaymentDrafts((current) => {
        const next = { ...current };
        delete next[refundId];
        return next;
      });
      setMessage("입금내역이 저장되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "입금내역 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function removePayment(refundId: string, paymentId: string) {
    if (!window.confirm("입금내역을 삭제할까요?")) return;

    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/refund-payments?id=${encodeURIComponent(paymentId)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "입금내역 삭제에 실패했습니다.");

      setItems((current) => current.map((item) => {
        if (item.id !== refundId) return item;
        const payments = item.payments.filter((payment) => payment.id !== paymentId);
        return {
          ...item,
          payments,
          depositAmount: payments.reduce((sum, payment) => sum + payment.depositAmount, 0),
        };
      }));
      setMessage("입금내역이 삭제되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "입금내역 삭제 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function startEditPayment(payment: RefundPayment) {
    setEditingPayment({ ...payment });
  }

  function updateEditingPayment<K extends keyof RefundPayment>(key: K, value: RefundPayment[K]) {
    setEditingPayment((current) => current ? { ...current, [key]: value } : current);
  }

  async function saveEditingPayment() {
    if (!editingPayment) return;

    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/refund-payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPayment),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.message ?? "입금내역 수정에 실패했습니다.");

      setItems((current) => current.map((item) => {
        if (item.id !== saved.refundId) return item;
        const payments = item.payments.map((payment) => payment.id === saved.id ? saved as RefundPayment : payment);
        return {
          ...item,
          payments,
          depositAmount: payments.reduce((sum, payment) => sum + payment.depositAmount, 0),
        };
      }));
      setEditingPayment(null);
      setMessage("입금내역이 수정되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "입금내역 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function updateDraft<K extends keyof RefundItem>(key: K, value: RefundItem[K]) {
    setDraft((current) => {
      if (!current) return current;
      if (key === "customerName") {
        const customerName = String(value);
        return {
          ...current,
          customerName,
          depositor: !current.depositor || current.depositor === current.customerName ? customerName : current.depositor,
        };
      }
      return { ...current, [key]: value };
    });
  }

  function updateNewDraft<K extends keyof RefundItem>(id: string, key: K, value: RefundItem[K]) {
    setDrafts((current) => current.map((draftItem) => {
      if (draftItem.id !== id) return draftItem;
      if (key === "customerName") {
        const customerName = String(value);
        return {
          ...draftItem,
          customerName,
          depositor: !draftItem.depositor || draftItem.depositor === draftItem.customerName ? customerName : draftItem.depositor,
        };
      }
      return { ...draftItem, [key]: value };
    }));
  }

  async function saveRefund(refund: RefundItem) {
    const response = await fetch("/api/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(refund),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "환불명단 저장에 실패했습니다.");
    }
    return result as RefundItem;
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    setMessage("");

    try {
      const saved = await saveRefund(draft);

      setItems((current) => (
        current.map((item) => item.id === draft.id ? saved : item)
      ));

      if (saved.refundDate) {
        setStartDate((current) => current && current <= saved.refundDate ? current : saved.refundDate);
        setEndDate((current) => current && current >= saved.refundDate ? current : saved.refundDate);
      }
      setDraft(null);
      setEditingId(null);
      setMessage("저장되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "환불명단 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function saveDrafts() {
    const targets = drafts.filter((item) => item.refundDate && item.customerName.trim());
    if (targets.length === 0) {
      setMessage("저장할 신규 환불 내역을 입력해주세요.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const savedItems = await Promise.all(targets.map(saveRefund));
      const savedIds = new Set(targets.map((item) => item.id));
      setItems((current) => [...savedItems, ...current]);
      setDrafts((current) => current.filter((item) => !savedIds.has(item.id)));

      for (const saved of savedItems) {
        if (!saved.refundDate) continue;
        setStartDate((current) => current && current <= saved.refundDate ? current : saved.refundDate);
        setEndDate((current) => current && current >= saved.refundDate ? current : saved.refundDate);
      }
      setMessage(`${savedItems.length}건 저장되었습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "환불명단 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function removeRefund(refund: RefundItem) {
    if (!window.confirm(`${refund.customerName} 환불 내역을 삭제할까요?`)) return;

    setDeletingId(refund.id);
    setMessage("");
    try {
      const response = await fetch(`/api/refunds?id=${encodeURIComponent(refund.id)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "환불명단 삭제에 실패했습니다.");

      setItems((current) => current.filter((item) => item.id !== refund.id));
      setMessage("삭제되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "환불명단 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-white p-3 shadow-soft">
        <div className="grid gap-3 xl:grid-cols-[560px_1fr_180px_auto]">
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
              <DateFilterInput label="환불일자 시작일" value={startDate} onChange={setStartDate} />
              <span className="hidden items-center justify-center text-sm text-slate-500 sm:flex">~</span>
              <DateFilterInput label="환불일자 종료일" value={endDate} onChange={setEndDate} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" onClick={() => {
                const today = getKstDateInput();
                setStartDate(today);
                setEndDate(today);
              }}>당일</Button>
              <Button size="sm" variant="outline" onClick={() => setRelativeRange(1)}>하루전</Button>
              <Button size="sm" variant="outline" onClick={() => setRelativeRange(7)}>일주전</Button>
              <Button size="sm" variant="outline" onClick={() => setRelativeRange(30)}>한달전</Button>
            </div>
          </div>
          <SearchInput placeholder="고객명, 전화번호, 입금자, 계좌, 메모 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">상태 전체</option>
            <option>환불신청</option>
            <option>환불완료</option>
          </Select>
          <Button onClick={addRow} disabled={Boolean(editingId)}>
            <Plus className="h-4 w-4" />
            환불 등록
          </Button>
        </div>
        {drafts.length > 0 ? (
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" onClick={saveDrafts} disabled={saving}>{saving ? "저장중" : `신규 ${drafts.length}건 저장`}</Button>
            <Button size="sm" variant="outline" onClick={() => setDrafts([])} disabled={saving}>신규 전체 취소</Button>
          </div>
        ) : null}
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <SummaryCard label="총 건수" value={`${filtered.length}건`} />
        <SummaryCard label="환불요청금액 합계" value={formatCurrency(totalRefund)} strong />
        <SummaryCard label="환불완료" value={`${filtered.filter((item) => item.status === "환불완료").length}건`} />
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-soft">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">환불 내역</p>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <Table className="min-w-[1620px]">
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[112px] whitespace-nowrap text-center">관리</TableHead>
                <SortableTableHead label="no." className="w-[54px] whitespace-nowrap text-center" active={sortApplied && sortKey === "no"} direction={sortDirection} onClick={() => toggleSort("no")} />
                <SortableTableHead label="환불일자" className="w-[112px] whitespace-nowrap text-center" active={sortApplied && sortKey === "refundDate"} direction={sortDirection} onClick={() => toggleSort("refundDate")} />
                <SortableTableHead label="고객명" className="w-[84px] whitespace-nowrap text-center" active={sortApplied && sortKey === "customerName"} direction={sortDirection} onClick={() => toggleSort("customerName")} />
                <SortableTableHead label="출발일" className="w-[112px] whitespace-nowrap text-center" active={sortApplied && sortKey === "departureDate"} direction={sortDirection} onClick={() => toggleSort("departureDate")} />
                <SortableTableHead label="인원" className="w-[58px] whitespace-nowrap text-center" active={sortApplied && sortKey === "peopleCount"} direction={sortDirection} onClick={() => toggleSort("peopleCount")} />
                <SortableTableHead label="전화번호" className="w-[132px] whitespace-nowrap text-center" active={sortApplied && sortKey === "phone"} direction={sortDirection} onClick={() => toggleSort("phone")} />
                <SortableTableHead label="결제방식" className="w-[98px] whitespace-nowrap text-center" active={sortApplied && sortKey === "paymentMethod"} direction={sortDirection} onClick={() => toggleSort("paymentMethod")} />
                <SortableTableHead label="상품총액" className="w-[90px] whitespace-nowrap text-center" active={sortApplied && sortKey === "productAmount"} direction={sortDirection} onClick={() => toggleSort("productAmount")} />
                <SortableTableHead label="입금액" className="w-[90px] whitespace-nowrap text-center" active={sortApplied && sortKey === "depositAmount"} direction={sortDirection} onClick={() => toggleSort("depositAmount")} />
                <SortableTableHead label="환불요청금액" className="w-[108px] whitespace-nowrap text-center" active={sortApplied && sortKey === "refundRequestAmount"} direction={sortDirection} onClick={() => toggleSort("refundRequestAmount")} />
                <SortableTableHead label="등록자" className="w-[96px] whitespace-nowrap text-center" active={sortApplied && sortKey === "registeredBy"} direction={sortDirection} onClick={() => toggleSort("registeredBy")} />
                <SortableTableHead label="상태" className="w-[100px] whitespace-nowrap text-center" active={sortApplied && sortKey === "status"} direction={sortDirection} onClick={() => toggleSort("status")} />
                <SortableTableHead label="은행 / 계좌번호 / 예금주" className="min-w-[220px] whitespace-nowrap text-center" active={sortApplied && sortKey === "bankAccount"} direction={sortDirection} onClick={() => toggleSort("bankAccount")} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((item) => (
                <RefundEditRow
                  key={item.id}
                  item={item}
                  activeAdminUsers={activeAdminUsers}
                  saving={saving}
                  onChange={(key, value) => updateNewDraft(item.id, key, value)}
                  onSave={saveDrafts}
                  onCancel={() => removeDraft(item.id)}
                />
              ))}
              {visibleItems.map((item) => (
                editingId === item.id && draft ? (
                  <RefundEditRow key={item.id} item={draft} activeAdminUsers={activeAdminUsers} saving={saving} onChange={updateDraft} onSave={saveDraft} onCancel={cancelEdit} />
                ) : (
                  <React.Fragment key={item.id}>
                    <RefundReadRow
                      item={item}
                      open={openIds.includes(item.id)}
                      deleting={deletingId === item.id}
                      onToggle={toggleOpen}
                      onEdit={editRow}
                      onDelete={removeRefund}
                      disabled={Boolean(editingId)}
                    />
                    {openIds.includes(item.id) ? (
                      <RefundPaymentDetailRow
                        item={item}
                        draft={paymentDrafts[item.id]}
                        saving={saving}
                        onAdd={startPaymentDraft}
                        onDraftChange={updatePaymentDraft}
                        onSave={savePayment}
                        onCancelDraft={(refundId) => setPaymentDrafts((current) => {
                          const next = { ...current };
                          delete next[refundId];
                          return next;
                        })}
                        onDelete={removePayment}
                        editingPayment={editingPayment}
                        onEdit={startEditPayment}
                        onEditChange={updateEditingPayment}
                        onEditSave={saveEditingPayment}
                        onEditCancel={() => setEditingPayment(null)}
                      />
                    ) : null}
                  </React.Fragment>
                )
              ))}
              {filtered.length === 0 && drafts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="h-32 text-center text-slate-500">선택한 기간의 환불 내역이 없습니다.</TableCell>
                </TableRow>
              ) : null}
              <TableRow className="bg-emerald-50/70 font-bold hover:bg-emerald-50/70">
                <TableCell colSpan={10} className="text-center">합계</TableCell>
                <TableCell className="text-right text-rose-700">{formatCurrency(totalRefund)}</TableCell>
                <TableCell colSpan={3} />
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <TablePagination totalCount={filtered.length} page={page} onPageChange={setPage} />
      </div>
    </div>
  );
}

function DateFilterInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative">
      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input aria-label={label} className="pl-9" type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SummaryCard({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-soft">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${strong ? "text-rose-700" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}

function RefundReadRow({
  item,
  open,
  deleting,
  onToggle,
  onEdit,
  onDelete,
  disabled,
}: {
  item: RefundItem;
  open: boolean;
  deleting: boolean;
  onToggle: (id: string) => void;
  onEdit: (item: RefundItem) => void;
  onDelete: (item: RefundItem) => void;
  disabled: boolean;
}) {
  return (
    <TableRow className={`cursor-pointer odd:bg-white even:bg-slate-50/40 ${open ? "bg-emerald-50/60" : ""}`} onClick={() => onToggle(item.id)}>
      <TableCell className="whitespace-nowrap px-2 text-center">
        <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); onEdit(item); }} disabled={disabled || deleting}>수정</Button>
        <Button size="sm" variant="outline" className="ml-1 text-rose-700" onClick={(event) => { event.stopPropagation(); onDelete(item); }} disabled={disabled || deleting}>{deleting ? "삭제중" : "삭제"}</Button>
      </TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center text-slate-500">{item.no}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center">{item.refundDate}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center font-semibold">{item.customerName}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center">{item.departureDate || "-"}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center">{item.peopleCount}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center">{item.phone || "-"}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center"><PaymentMethodBadge value={item.paymentMethod} /></TableCell>
      <TableCell className="whitespace-nowrap px-2 text-right">{formatCurrency(item.productAmount)}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-right">{formatCurrency(item.depositAmount)}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-right font-semibold text-rose-700">{formatCurrency(item.refundRequestAmount)}</TableCell>
      <TableCell className="whitespace-nowrap px-2 text-center">{item.registeredBy || "-"}</TableCell>
      <TableCell className="px-2 text-center"><StatusBadge value={item.status} /></TableCell>
      <TableCell className="max-w-[260px] truncate px-2" title={item.bankAccount}>{item.bankAccount || "-"}</TableCell>
    </TableRow>
  );
}

function RefundPaymentDetailRow({
  item,
  draft,
  saving,
  onAdd,
  onDraftChange,
  onSave,
  onCancelDraft,
  onDelete,
  editingPayment,
  onEdit,
  onEditChange,
  onEditSave,
  onEditCancel,
}: {
  item: RefundItem;
  draft?: Omit<RefundPayment, "id">;
  saving: boolean;
  onAdd: (item: RefundItem) => void;
  onDraftChange: <K extends keyof Omit<RefundPayment, "id">>(refundId: string, key: K, value: Omit<RefundPayment, "id">[K]) => void;
  onSave: (refundId: string) => void;
  onCancelDraft: (refundId: string) => void;
  onDelete: (refundId: string, paymentId: string) => void;
  editingPayment: RefundPayment | null;
  onEdit: (payment: RefundPayment) => void;
  onEditChange: <K extends keyof RefundPayment>(key: K, value: RefundPayment[K]) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
}) {
  const inputClass = "h-8 min-w-0 px-2 text-xs";

  return (
    <TableRow className="bg-emerald-50/30 hover:bg-emerald-50/30">
      <TableCell colSpan={14} className="p-3">
        <div className="rounded-lg border border-emerald-100 bg-white p-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => onAdd(item)} disabled={Boolean(draft)}>
              <Plus className="h-3.5 w-3.5" />
              입금 추가
            </Button>
            <div>
              <p className="font-semibold">입금내역</p>
              <p className="text-sm text-slate-500">상세 입금액의 합계가 마스터 행의 입금액으로 표시됩니다.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px] text-center">관리</TableHead>
                <TableHead className="w-[140px] text-center">입금일</TableHead>
                <TableHead className="w-[140px] text-right">입금액</TableHead>
                <TableHead className="w-[140px] text-center">입금자</TableHead>
                <TableHead>메모</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {draft ? (
                <TableRow className="bg-emerald-50/80 hover:bg-emerald-50/80">
                  <TableCell className="px-1 text-center">
                    <Button size="sm" onClick={() => onSave(item.id)} disabled={saving || !draft.depositDate || !draft.depositAmount}>저장</Button>
                    <Button size="sm" variant="outline" className="ml-1" onClick={() => onCancelDraft(item.id)} disabled={saving}>취소</Button>
                  </TableCell>
                  <TableCell className="px-1"><DateCellInput className={inputClass} value={draft.depositDate} onChange={(value) => onDraftChange(item.id, "depositDate", value)} /></TableCell>
                  <TableCell className="px-1"><MoneyCellInput className={inputClass} value={draft.depositAmount} onChange={(value) => onDraftChange(item.id, "depositAmount", value)} /></TableCell>
                  <TableCell className="px-1"><Input className={`${inputClass} w-[130px]`} value={draft.depositor} onChange={(event) => onDraftChange(item.id, "depositor", event.target.value)} /></TableCell>
                  <TableCell className="px-1"><Input className={`${inputClass} w-full`} value={draft.memo ?? ""} onChange={(event) => onDraftChange(item.id, "memo", event.target.value)} /></TableCell>
                </TableRow>
              ) : null}
              {item.payments.map((payment) => (
                editingPayment?.id === payment.id ? (
                  <TableRow key={payment.id} className="bg-amber-50/70 hover:bg-amber-50/70">
                    <TableCell className="px-1 text-center">
                      <Button size="sm" onClick={onEditSave} disabled={saving || !editingPayment.depositDate || !editingPayment.depositAmount}>저장</Button>
                      <Button size="sm" variant="outline" className="ml-1" onClick={onEditCancel} disabled={saving}>취소</Button>
                    </TableCell>
                    <TableCell className="px-1"><DateCellInput className={inputClass} value={editingPayment.depositDate} onChange={(value) => onEditChange("depositDate", value)} /></TableCell>
                    <TableCell className="px-1"><MoneyCellInput className={inputClass} value={editingPayment.depositAmount} onChange={(value) => onEditChange("depositAmount", value)} /></TableCell>
                    <TableCell className="px-1"><Input className={`${inputClass} w-[130px]`} value={editingPayment.depositor} onChange={(event) => onEditChange("depositor", event.target.value)} /></TableCell>
                    <TableCell className="px-1"><Input className={`${inputClass} w-full`} value={editingPayment.memo ?? ""} onChange={(event) => onEditChange("memo", event.target.value)} /></TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={payment.id}>
                    <TableCell className="text-center">
                      <Button size="sm" variant="outline" onClick={() => onEdit(payment)} disabled={saving || Boolean(editingPayment)}>수정</Button>
                      <Button size="sm" variant="outline" className="ml-1 text-rose-700" onClick={() => onDelete(item.id, payment.id)} disabled={saving || Boolean(editingPayment)}>삭제</Button>
                    </TableCell>
                    <TableCell className="text-center">{payment.depositDate}</TableCell>
                    <TableCell className="text-right">{formatCurrency(payment.depositAmount)}</TableCell>
                    <TableCell className="text-center">{payment.depositor || "-"}</TableCell>
                    <TableCell>{[item.memo, payment.memo].filter(Boolean).join(" / ") || "-"}</TableCell>
                  </TableRow>
                )
              ))}
              {!draft && item.payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-5 text-center text-slate-500">등록된 입금내역이 없습니다.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </TableCell>
    </TableRow>
  );
}

function PaymentMethodBadge({ value }: { value: string }) {
  const variant =
    value === "계좌이체"
      ? "default"
      : value === "홈페이지결제"
        ? "blue"
        : value === "사무실단말기"
          ? "warning"
          : value === "위약금"
            ? "danger"
            : "secondary";

  return <Badge variant={variant} className="whitespace-nowrap">{value}</Badge>;
}

function RefundEditRow({
  item,
  activeAdminUsers,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  item: RefundItem;
  activeAdminUsers: AdminUser[];
  saving: boolean;
  onChange: <K extends keyof RefundItem>(key: K, value: RefundItem[K]) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inputClass = "h-8 min-w-0 px-2 text-xs";
  const hasRegisteredBy = activeAdminUsers.some((user) => user.name === item.registeredBy);
  const canSave = Boolean(item.refundDate && item.customerName.trim());

  return (
    <TableRow className="bg-emerald-50/80 hover:bg-emerald-50/80">
      <TableCell className="whitespace-nowrap px-2 text-center">
        <Button size="sm" onClick={onSave} disabled={!canSave || saving}>{saving ? "저장중" : "저장"}</Button>
        <Button size="sm" variant="outline" className="ml-1" onClick={onCancel} disabled={saving}>취소</Button>
      </TableCell>
      <TableCell className="px-2 text-center font-semibold">{item.no}</TableCell>
      <TableCell className="px-1"><DateCellInput className={inputClass} value={item.refundDate} onChange={(value) => onChange("refundDate", value)} /></TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[80px]`} value={item.customerName} onChange={(event) => onChange("customerName", event.target.value)} /></TableCell>
      <TableCell className="px-1"><DateCellInput className={inputClass} value={item.departureDate} onChange={(value) => onChange("departureDate", value)} /></TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-16 text-center`} inputMode="numeric" value={item.peopleCount ? String(item.peopleCount) : ""} onChange={(event) => onChange("peopleCount", Math.max(0, numberValue(event.target.value)))} /></TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[128px]`} value={item.phone} onChange={(event) => onChange("phone", event.target.value)} /></TableCell>
      <TableCell className="px-1">
        <Select className="h-8 w-[94px] px-2 text-xs" value={item.paymentMethod} onChange={(event) => onChange("paymentMethod", event.target.value)}>
          <option>계좌이체</option>
          <option>홈페이지결제</option>
          <option>사무실단말기</option>
          <option>위약금</option>
        </Select>
      </TableCell>
      <TableCell className="px-1"><MoneyCellInput className={inputClass} value={item.productAmount} onChange={(value) => onChange("productAmount", value)} /></TableCell>
      <TableCell className="px-2 text-right text-slate-500">{formatCurrency(item.depositAmount)}</TableCell>
      <TableCell className="px-1"><MoneyCellInput className={`${inputClass} font-semibold text-rose-700`} width="w-[104px]" value={item.refundRequestAmount} onChange={(value) => onChange("refundRequestAmount", value)} /></TableCell>
      <TableCell className="px-1">
        <Select className="h-8 w-[92px] text-xs" value={item.registeredBy} onChange={(event) => onChange("registeredBy", event.target.value)}>
          <option value="">선택</option>
          {item.registeredBy && !hasRegisteredBy ? <option value={item.registeredBy}>{item.registeredBy}</option> : null}
          {activeAdminUsers.map((user) => (
            <option key={user.id} value={user.name}>{user.name}</option>
          ))}
        </Select>
      </TableCell>
      <TableCell className="px-1">
        <Select className="h-8 w-[96px] text-xs" value={item.status} onChange={(event) => onChange("status", event.target.value as RefundItem["status"])}>
          <option>환불신청</option>
          <option>환불완료</option>
        </Select>
      </TableCell>
      <TableCell className="px-1"><Input className={`${inputClass} w-[210px]`} value={item.bankAccount} onChange={(event) => onChange("bankAccount", event.target.value)} /></TableCell>
    </TableRow>
  );
}

function MoneyCellInput({ className, width = "w-[86px]", value, onChange }: { className: string; width?: string; value: number; onChange: (value: number) => void }) {
  return (
    <Input
      className={`${className} ${width} text-right`}
      inputMode="numeric"
      value={formatNumberInput(value)}
      onChange={(event) => onChange(numberValue(event.target.value))}
    />
  );
}

function DateCellInput({ className, value, onChange }: { className: string; value: string; onChange: (value: string) => void }) {
  const pickerRef = React.useRef<HTMLInputElement>(null);
  const [text, setText] = React.useState(value);

  React.useEffect(() => {
    setText(value);
  }, [value]);

  function openPicker() {
    pickerRef.current?.showPicker?.();
  }

  function changeText(nextText: string) {
    setText(nextText);
    const parsed = parseDateText(nextText);
    if (parsed) onChange(parsed);
  }

  function normalizeText() {
    const parsed = parseDateText(text);
    setText(parsed || value);
  }

  return (
    <div className="relative w-[130px]">
      <Input
        className={`${className} w-full pr-8`}
        inputMode="numeric"
        placeholder="YYYYMMDD"
        value={text}
        onBlur={normalizeText}
        onChange={(event) => changeText(event.target.value)}
      />
      <input
        ref={pickerRef}
        className="sr-only"
        tabIndex={-1}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        aria-label="날짜 선택"
        className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
        onClick={openPicker}
      >
        <CalendarDays className="h-4 w-4" />
      </button>
    </div>
  );
}
