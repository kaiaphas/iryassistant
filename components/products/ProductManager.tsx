"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateProduct, emptyProduct, productNumberFields, type ProductEstimate, type ProductNumberField } from "@/lib/product-estimate";
import { useUnsavedForm } from "@/lib/unsaved-changes";

type Draft = { id?: string; code: string; name: string; incentiveCondition: string } & Record<ProductNumberField, string>;
type Entry = { key: string; original: Draft | null; draft: Draft };
type Tab = "calculation" | "detail";

const columns: { key: ProductNumberField; label: string }[] = [
  { key: "headcount", label: "기준 인원" }, { key: "price", label: "상품가 / 인" },
  { key: "vehicleCost", label: "차량 / 전체" }, { key: "guideCost", label: "가이드 / 인" },
  { key: "snackCost", label: "간식 / 인" }, { key: "admissionCost", label: "입장료 / 인" },
  { key: "mealCost", label: "식대 / 인" }, { key: "taxRate", label: "부가세율 (%)" },
  { key: "incentive", label: "인센티브 / 전체" },
];

function toDraft(product: ProductEstimate): Draft {
  const numbers = Object.fromEntries(productNumberFields.map((key) => [key, product[key] === null ? "" : String(key === "taxRate" ? product[key]! * 100 : product[key])])) as Record<ProductNumberField, string>;
  return { id: product.id, code: product.code, name: product.name, incentiveCondition: product.incentiveCondition, ...numbers };
}

function toProduct(draft: Draft): ProductEstimate {
  const numbers = Object.fromEntries(productNumberFields.map((key) => {
    const value = draft[key].trim();
    const number = value === "" ? null : Number(value);
    return [key, number === null ? null : key === "taxRate" ? number / 100 : number];
  })) as Record<ProductNumberField, number | null>;
  return { id: draft.id, code: draft.code, name: draft.name, incentiveCondition: draft.incentiveCondition, ...numbers };
}

export function copyProductDraft(draft: Draft): Draft {
  return { ...draft, id: undefined, code: "", name: "" };
}

const money = (value: number | null | undefined) => value === null || value === undefined || !Number.isFinite(value) ? "—" : value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
const cellInput = "min-w-0 px-2";

export function ProductManager() {
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [selected, setSelected] = React.useState("");
  const [tab, setTab] = React.useState<Tab>("calculation");
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  useUnsavedForm("product-estimates", !loading, entries.map((entry) => entry.original), entries.map((entry) => entry.draft));

  React.useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/products", { signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message ?? "상품 목록을 불러오지 못했습니다.");
        const next = (body as ProductEstimate[]).map((product) => ({ key: product.id!, original: toDraft(product), draft: toDraft(product) }));
        setEntries(next);
        setSelected(next[0]?.key ?? "");
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "상품 목록을 불러오지 못했습니다.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, []);

  function change(key: string, field: keyof Draft, value: string) {
    setEntries((current) => current.map((entry) => entry.key === key ? { ...entry, draft: { ...entry.draft, [field]: value } } : entry));
    setMessage(""); setError("");
  }

  function add() {
    const key = `new-${crypto.randomUUID()}`;
    setEntries((current) => [{ key, original: null, draft: toDraft(emptyProduct) }, ...current]);
    setSelected(key); setTab("calculation"); setMessage(""); setError("");
  }

  function copy(entry: Entry) {
    const key = `new-${crypto.randomUUID()}`;
    setEntries((current) => [{ key, original: null, draft: copyProductDraft(entry.draft) }, ...current]);
    setSelected(key); setMessage("복사한 상품의 코드와 상품명을 입력한 후 저장하세요."); setError("");
  }

  async function save(entry: Entry) {
    setBusy(entry.key); setError(""); setMessage("");
    try {
      const response = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toProduct(entry.draft)) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "상품을 저장하지 못했습니다.");
      const saved = toDraft(body as ProductEstimate);
      setEntries((current) => current.map((item) => item.key === entry.key ? { key: saved.id!, original: saved, draft: saved } : item));
      setSelected((current) => current === entry.key ? saved.id! : current);
      setMessage("상품을 저장했습니다.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "상품을 저장하지 못했습니다."); }
    finally { setBusy(""); }
  }

  async function remove(entry: Entry) {
    if (!window.confirm(entry.draft.id ? `‘${entry.draft.name}’ 상품을 삭제하시겠습니까?` : "작성 중인 상품을 삭제하시겠습니까?")) return;
    setBusy(entry.key); setError(""); setMessage("");
    try {
      if (entry.draft.id) {
        const response = await fetch(`/api/products?id=${encodeURIComponent(entry.draft.id)}`, { method: "DELETE" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message ?? "상품을 삭제하지 못했습니다.");
      }
      const next = entries.filter((item) => item.key !== entry.key);
      setEntries(next); if (selected === entry.key) setSelected(next[0]?.key ?? "");
      setMessage("상품을 삭제했습니다.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "상품을 삭제하지 못했습니다."); }
    finally { setBusy(""); }
  }

  const selectedEntry = entries.find((entry) => entry.key === selected);
  const product = selectedEntry ? toProduct(selectedEntry.draft) : null;
  const calculation = product ? calculateProduct(product) : null;

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-3 shadow-soft">
      <div role="tablist" aria-label="상품관리" className="flex flex-wrap gap-2">
        {([{ key: "calculation", label: "상품별 계산" }, { key: "detail", label: "상품 상세" }] as const).map((item) =>
          <button key={item.key} type="button" role="tab" id={`tab-${item.key}`} aria-selected={tab === item.key} aria-controls={`panel-${item.key}`} tabIndex={tab === item.key ? 0 : -1} onClick={() => setTab(item.key)} onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); const next = item.key === "calculation" ? "detail" : "calculation"; setTab(next); document.getElementById(`tab-${next}`)?.focus(); } }} className={`inline-flex h-9 items-center rounded-md border px-3.5 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${tab === item.key ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-emerald-600 hover:bg-emerald-50"}`}>{item.label}</button>)}
      </div>
      <Button onClick={add} disabled={loading || !!busy || !!error && entries.length === 0}>+ 상품 추가</Button>
    </div>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    {loading ? <p className="p-4 text-sm text-slate-500">상품을 불러오는 중입니다.</p> : <>
      {tab === "calculation" && <div role="tabpanel" id="panel-calculation" aria-labelledby="tab-calculation" className="space-y-2">
        <p className="text-sm text-slate-500">항목을 입력하고 각 행의 저장 버튼을 누르세요. 비용이 없으면 0을 입력합니다. 부가세율과 인센티브 조건을 확인하세요.</p>
        {entries.length === 0 ? <p className="rounded-lg border bg-white p-6 text-sm text-slate-500">등록된 상품이 없습니다. 상품을 추가해주세요.</p> :
        <div className="overflow-hidden rounded-xl border bg-white shadow-soft"><div className="overflow-x-auto"><Table className="min-w-[2600px]">
          <TableHeader className="[&_th]:whitespace-nowrap"><TableRow><TableHead className="w-[75px] text-center">선택</TableHead><TableHead className="w-[75px] text-center">복사</TableHead><TableHead className="w-[145px] text-center">상품 코드</TableHead><TableHead className="w-[260px] text-center">상품명</TableHead><TableHead className="text-right">예상 이익 / 인</TableHead><TableHead className="text-right">예상 이익 / 전체</TableHead>{columns.map((column) => <TableHead key={column.key} className="text-center">{column.label}</TableHead>)}<TableHead className="text-right">비용 소계</TableHead><TableHead className="text-right">부가세</TableHead><TableHead className="text-right">진행비 / 전체</TableHead><TableHead className="text-right">예상 매출</TableHead><TableHead className="w-[300px]">인센티브 조건</TableHead><TableHead className="w-[150px] text-center">관리</TableHead></TableRow></TableHeader>
          <TableBody>{entries.map((entry) => {
            const result = calculateProduct(toProduct(entry.draft));
            return <TableRow key={entry.key} className={selected === entry.key ? "bg-emerald-50/50" : ""}>
              <TableCell className="text-center"><Button size="sm" variant="outline" onClick={() => { setSelected(entry.key); setTab("detail"); }}>상세</Button></TableCell>
              <TableCell className="text-center"><Button size="sm" variant="outline" disabled={!!busy} aria-label={`${entry.draft.name || "새 상품"} 복사`} onClick={() => copy(entry)}>복사</Button></TableCell>
              <TableCell><Input aria-label="상품 코드" className={cellInput} disabled={!!busy} value={entry.draft.code} maxLength={100} onChange={(event) => change(entry.key, "code", event.target.value)} /></TableCell>
              <TableCell><Input aria-label="상품명" className={cellInput} disabled={!!busy} value={entry.draft.name} maxLength={300} onChange={(event) => change(entry.key, "name", event.target.value)} /></TableCell>
              <TableCell className="text-right font-semibold">{money(result?.perPerson)}</TableCell><TableCell className="text-right font-semibold">{money(result?.profit)}</TableCell>
              {columns.map((column) => <TableCell key={column.key}><Input aria-label={`${entry.draft.name || "새 상품"} ${column.label}`} className={`${cellInput} text-right`} type="number" disabled={!!busy} min={column.key === "headcount" ? 1 : 0} max={column.key === "taxRate" ? 100 : column.key === "headcount" ? 100000 : 1000000000} step={column.key === "headcount" ? 1 : "any"} value={entry.draft[column.key]} onChange={(event) => change(entry.key, column.key, event.target.value)} /></TableCell>)}
              <TableCell className="text-right">{money(result?.cost)}</TableCell><TableCell className="text-right">{money(result?.tax)}</TableCell><TableCell className="text-right">{money(result?.expense)}</TableCell><TableCell className="text-right">{money(result?.revenue)}</TableCell>
              <TableCell><textarea aria-label="인센티브 조건" className="flex min-h-9 w-full resize-y rounded-md border border-input bg-white px-3 py-1.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-700" disabled={!!busy} maxLength={2000} value={entry.draft.incentiveCondition} onChange={(event) => change(entry.key, "incentiveCondition", event.target.value)} /></TableCell>
              <TableCell className="whitespace-nowrap text-center"><div className="flex justify-center gap-1"><Button size="sm" disabled={!!busy} onClick={() => void save(entry)}>{busy === entry.key ? "처리 중" : "저장"}</Button><Button size="sm" variant="outline" className="text-rose-700" disabled={!!busy} onClick={() => void remove(entry)}>삭제</Button></div></TableCell>
            </TableRow>;
          })}</TableBody>
        </Table></div></div>}
      </div>}
      {tab === "detail" && <div role="tabpanel" id="panel-detail" aria-labelledby="tab-detail" className="max-w-3xl space-y-4 rounded-lg border bg-white p-4 shadow-soft">
        <label className="block text-sm font-medium">상품 선택<Select className="mt-1" value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">상품을 선택하세요</option>{entries.map((entry) => <option key={entry.key} value={entry.key}>{entry.draft.code || "새 상품"} · {entry.draft.name || "상품명 미입력"}</option>)}</Select></label>
        {product ? <><p className="text-sm text-slate-600">기준 인원: {product.headcount ?? "미입력"}명 · 부가세율: {product.taxRate === null ? "미입력" : `${money(product.taxRate * 100)}%`}</p>
          <div className="overflow-hidden rounded-xl border"><div className="overflow-x-auto"><Table className="min-w-[440px]"><TableHeader><TableRow><TableHead>항목</TableHead><TableHead className="text-right">개인</TableHead><TableHead className="text-right">전체</TableHead></TableRow></TableHeader><TableBody>
            {[
              ["차량", product.headcount && product.vehicleCost !== null ? product.vehicleCost / product.headcount : null, product.vehicleCost],
              ...([["가이드", product.guideCost], ["간식", product.snackCost], ["입장료", product.admissionCost], ["식대", product.mealCost]] as const).map(([label, value]) => [label, value, value !== null && product.headcount ? value * product.headcount : null]),
              ["비용 소계", calculation?.cost != null && product.headcount ? calculation.cost / product.headcount : null, calculation?.cost],
              ["부가세", calculation?.tax != null && product.headcount ? calculation.tax / product.headcount : null, calculation?.tax],
              ["진행비", calculation?.expense != null && product.headcount ? calculation.expense / product.headcount : null, calculation?.expense],
              ["인센티브", product.headcount && product.incentive !== null ? product.incentive / product.headcount : null, product.incentive],
              ["상품가(회비)", product.price, product.price !== null && product.headcount ? product.price * product.headcount : null],
              ["예상 이익", calculation?.perPerson, calculation?.profit],
            ].map(([label, personal, total]) => <TableRow key={String(label)} className={label === "예상 이익" ? "bg-emerald-50 font-semibold" : ""}><th scope="row" className="px-2 py-1.5 text-left font-medium">{label}</th><TableCell className="text-right">{money(personal as number | null | undefined)}</TableCell><TableCell className="text-right">{money(total as number | null | undefined)}</TableCell></TableRow>)}
          </TableBody></Table></div></div><p className="whitespace-pre-wrap text-sm text-slate-600">인센티브 조건: {product.incentiveCondition || "미입력"}</p><p className="text-xs text-slate-500">계산 탭의 현재 입력값을 표시합니다. 저장 전 변경사항도 반영됩니다.</p></> : <p className="text-sm text-slate-500">상품을 선택해주세요.</p>}
      </div>}
    </>}
  </div>;
}
