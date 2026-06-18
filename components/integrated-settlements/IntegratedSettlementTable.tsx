"use client";

import * as React from "react";
import type { IntegratedSettlementRow, IntegratedSettlementStatus } from "@/lib/types";
import {
  calculateIntegratedSettlementRow,
  evaluateFormulaInput,
  getFormulaContext,
  getPeopleCount,
  getProductName,
} from "@/lib/integrated-settlement-calculator";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type IntegratedSettlementTableProps = {
  initialRows: IntegratedSettlementRow[];
  initialYear: number;
  initialMonth: number;
};

type FormulaValueKey =
  | "totalIncome"
  | "operationCost"
  | "vehicleCost"
  | "guideCost";

type FormulaKey =
  | "totalIncomeFormula"
  | "operationCostFormula"
  | "vehicleCostFormula"
  | "guideCostFormula";

const years = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 1 + index);
const months = Array.from({ length: 12 }, (_, index) => index + 1);

function numberValue(value: string) {
  return Math.round(Number(value.replaceAll(",", ""))) || 0;
}

function formatNumberInput(value: number) {
  if (!value) return "";
  return new Intl.NumberFormat("ko-KR").format(value);
}

function statusLabel(status: IntegratedSettlementStatus) {
  return status === "CONFIRMED" ? "완료" : "작성중";
}

const readOnlyHeadClass = "bg-slate-100 text-slate-600";
const inputHeadClass = "bg-white";
const readOnlyCellClass = "bg-slate-50/70 text-slate-700";

function HeadLabel({ label, hint }: { label: string; hint: "연동" | "입력" | "자동" | "저장" }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span>{label}</span>
      <span className="text-[10px] font-medium text-slate-500">{hint}</span>
    </div>
  );
}

function ReadOnlyAmount({ value, hint = "자동계산" }: { value: number; hint?: string }) {
  return (
    <div className="rounded-md border bg-slate-50 px-2 py-1.5 text-right" title={hint}>
      <p className="text-xs font-semibold text-slate-800">{formatNumberInput(value) || "0"}</p>
    </div>
  );
}

function ReadOnlyText({ value, title }: { value: string; title?: string }) {
  return (
    <div className="rounded-md border bg-slate-50 px-2 py-1.5 text-xs text-slate-700" title={title}>
      {value || "-"}
    </div>
  );
}

function FormulaAmountInput({
  value,
  formula,
  onCommit,
}: {
  value: number;
  formula?: string;
  onCommit: (input: string) => void;
}) {
  const [focused, setFocused] = React.useState(false);
  const [text, setText] = React.useState(formatNumberInput(value));

  React.useEffect(() => {
    if (!focused) setText(formatNumberInput(value));
  }, [focused, value]);

  return (
    <Input
      className="h-8 text-right text-xs"
      value={text}
      title={formula || String(value)}
      onFocus={() => {
        setFocused(true);
        setText(formula || (value ? String(value) : ""));
      }}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => {
        setFocused(false);
        onCommit(text);
      }}
      placeholder="0 또는 =수식"
    />
  );
}

function MiniNumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder: string;
}) {
  return (
    <Input
      className="h-7 min-w-0 text-right text-[11px]"
      value={value ? String(value) : ""}
      onChange={(event) => onChange(numberValue(event.target.value))}
      placeholder={placeholder}
      inputMode="numeric"
    />
  );
}

export function IntegratedSettlementTable({ initialRows, initialYear, initialMonth }: IntegratedSettlementTableProps) {
  const [rows, setRows] = React.useState(initialRows);
  const [year, setYear] = React.useState(initialYear);
  const [month, setMonth] = React.useState(initialMonth);
  const [tourType, setTourType] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [guideQuery, setGuideQuery] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");

  const filteredRows = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    const guide = guideQuery.trim().toLowerCase();
    return (!tourType || row.tourType === tourType)
      && (!status || row.status === status)
      && (!q || [getProductName(row), row.vehicleNo, row.busCompany, row.memo].some((value) => value?.toLowerCase().includes(q)))
      && (!guide || row.guideName?.toLowerCase().includes(guide));
  });

  const summary = filteredRows.reduce((acc, row) => {
    const totalExpense = row.operationCost + row.vehicleCost + row.guideCost + row.kimbapCost + row.fruitCost + row.riceCakeWaterCost + row.snackBoxCost;
    acc.totalIncome += row.totalIncome;
    acc.totalExpense += totalExpense;
    acc.finalBalance += row.finalBalance;
    return acc;
  }, { totalIncome: 0, totalExpense: 0, finalBalance: 0 });

  function replaceRow(row: IntegratedSettlementRow) {
    setRows((current) => current.map((item) => (item.id === row.id ? row : item)));
  }

  function patchRow(id: string, patch: Partial<IntegratedSettlementRow>) {
    try {
      setMessage("");
      setRows((current) => current.map((row) => (
        row.id === id ? calculateIntegratedSettlementRow({ ...row, ...patch }) : row
      )));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "계산 중 오류가 발생했습니다.");
    }
  }

  function commitFormula(row: IntegratedSettlementRow, valueKey: FormulaValueKey, formulaKey: FormulaKey, input: string) {
    try {
      const result = evaluateFormulaInput(input, getFormulaContext(row));
      patchRow(row.id, {
        [valueKey]: result.value,
        [formulaKey]: result.formula,
      } as Partial<IntegratedSettlementRow>);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "수식을 계산할 수 없습니다.");
    }
  }

  async function fetchRows(nextYear = year, nextMonth = month) {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/integrated-settlements?year=${nextYear}&month=${nextMonth}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "통합정산서 조회에 실패했습니다.");
      setRows(payload);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "통합정산서 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function syncRows() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/integrated-settlements/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "통합정산서 연동 생성에 실패했습니다.");
      setRows(payload);
      setMessage("예약현황 기준 정산 행을 연동했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "통합정산서 연동 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function saveRow(row: IntegratedSettlementRow) {
    setSavingId(row.id);
    setMessage("");
    try {
      const calculated = calculateIntegratedSettlementRow(row);
      const response = await fetch(`/api/integrated-settlements/rows/${encodeURIComponent(row.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calculated),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "통합정산 행 저장에 실패했습니다.");
      replaceRow(payload);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "통합정산 행 저장에 실패했습니다.");
    } finally {
      setSavingId(null);
    }
  }

  function resetLinkedValues(row: IntegratedSettlementRow) {
    patchRow(row.id, {
      overrideProductName: undefined,
      overridePeopleCount: undefined,
      kimbapQty: row.sourcePeopleCount,
      fruitQty: row.sourcePeopleCount,
      riceCakeWaterQty: row.sourcePeopleCount,
      snackBoxQty: row.sourcePeopleCount,
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-lg border bg-white p-3 shadow-soft lg:grid-cols-[120px_100px_120px_1fr_180px_140px_auto_auto]">
        <Select value={String(year)} onChange={(event) => { const nextYear = Number(event.target.value); setYear(nextYear); void fetchRows(nextYear, month); }}>
          {years.map((item) => <option key={item} value={item}>{item}년</option>)}
        </Select>
        <Select value={String(month)} onChange={(event) => { const nextMonth = Number(event.target.value); setMonth(nextMonth); void fetchRows(year, nextMonth); }}>
          {months.map((item) => <option key={item} value={item}>{item}월</option>)}
        </Select>
        <Select value={tourType} onChange={(event) => setTourType(event.target.value)}>
          <option value="">전체</option>
          <option value="당일">당일</option>
          <option value="숙박">숙박</option>
        </Select>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="행선지, 차량, 비고 검색" />
        <Input value={guideQuery} onChange={(event) => setGuideQuery(event.target.value)} placeholder="가이드 검색" />
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">상태 전체</option>
          <option value="DRAFT">작성중</option>
          <option value="CONFIRMED">완료</option>
        </Select>
        <Button variant="outline" onClick={() => fetchRows()} disabled={loading}>조회</Button>
        <Button
          onClick={syncRows}
          disabled={loading}
          title="예약현황에는 있지만 통합정산서에 아직 저장되지 않은 행을 생성합니다."
        >
          누락행 생성
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">정산 행 수</p>
          <p className="mt-1 text-xl font-semibold">{filteredRows.length}건</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">총입금액</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(summary.totalIncome)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">총지출</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(summary.totalExpense)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">총잔액</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(summary.finalBalance)}</p>
        </div>
      </div>

      {message ? <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div> : null}

      <div className="rounded-lg border bg-white px-3 py-2 text-xs text-slate-600">
        입력창이 없는 항목은 연동값 또는 자동계산값입니다. 간식류 총액과 잔액은 수량/단가/추가금액으로만 계산됩니다.
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-soft">
        <div className="max-h-[calc(100vh-320px)] overflow-auto">
          <Table className="min-w-[2480px]">
            <TableHeader className="sticky top-0 z-10">
              <TableRow>
                <TableHead className={`w-[60px] text-center ${readOnlyHeadClass}`}><HeadLabel label="순번" hint="연동" /></TableHead>
                <TableHead className={`w-[110px] text-center ${readOnlyHeadClass}`}><HeadLabel label="날짜" hint="연동" /></TableHead>
                <TableHead className={`w-[90px] text-center ${readOnlyHeadClass}`}><HeadLabel label="구분" hint="연동" /></TableHead>
                <TableHead className={`w-[260px] text-center ${readOnlyHeadClass}`}><HeadLabel label="행선지" hint="연동" /></TableHead>
                <TableHead className={`w-[90px] text-center ${inputHeadClass}`}><HeadLabel label="인원" hint="입력" /></TableHead>
                <TableHead className={`w-[110px] text-center ${inputHeadClass}`}><HeadLabel label="단가" hint="입력" /></TableHead>
                <TableHead className={`w-[130px] text-center ${inputHeadClass}`}><HeadLabel label="총입금액" hint="입력" /></TableHead>
                <TableHead className={`w-[130px] text-center ${inputHeadClass}`}><HeadLabel label="일정진행비" hint="입력" /></TableHead>
                <TableHead className={`w-[130px] text-center ${inputHeadClass}`}><HeadLabel label="차량비" hint="입력" /></TableHead>
                <TableHead className={`w-[130px] text-center ${inputHeadClass}`}><HeadLabel label="가이드비" hint="입력" /></TableHead>
                <TableHead className={`w-[180px] text-center ${readOnlyHeadClass}`}><HeadLabel label="김밥" hint="자동" /></TableHead>
                <TableHead className={`w-[180px] text-center ${readOnlyHeadClass}`}><HeadLabel label="과일" hint="자동" /></TableHead>
                <TableHead className={`w-[220px] text-center ${readOnlyHeadClass}`}><HeadLabel label="떡,생수" hint="자동" /></TableHead>
                <TableHead className={`w-[180px] text-center ${readOnlyHeadClass}`}><HeadLabel label="간식상자" hint="자동" /></TableHead>
                <TableHead className={`w-[130px] text-center ${readOnlyHeadClass}`}><HeadLabel label="잔액" hint="자동" /></TableHead>
                <TableHead className={`w-[220px] text-center ${inputHeadClass}`}><HeadLabel label="비고" hint="입력" /></TableHead>
                <TableHead className={`w-[130px] text-center ${readOnlyHeadClass}`}><HeadLabel label="가이드명" hint="연동" /></TableHead>
                <TableHead className={`w-[110px] text-center ${inputHeadClass}`}><HeadLabel label="정산상태" hint="입력" /></TableHead>
                <TableHead className={`w-[140px] text-center ${inputHeadClass}`}><HeadLabel label="관리" hint="저장" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className={`text-center ${readOnlyCellClass}`}>{row.sortNo}</TableCell>
                  <TableCell className={`whitespace-nowrap text-center ${readOnlyCellClass}`}>{row.tourDate}</TableCell>
                  <TableCell className={`text-center ${readOnlyCellClass}`}>
                    <Badge variant={row.tourType === "숙박" ? "blue" : "secondary"}>{row.tourType}</Badge>
                  </TableCell>
                  <TableCell className={readOnlyCellClass}>
                    <ReadOnlyText value={getProductName(row)} title={row.sourceProductName} />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 text-right text-xs"
                      value={String(getPeopleCount(row) || "")}
                      onChange={(event) => patchRow(row.id, { overridePeopleCount: numberValue(event.target.value) })}
                      title={`연동 인원 ${row.sourcePeopleCount} / 미배정 ${row.notBusCount}`}
                      inputMode="numeric"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 text-right text-xs"
                      value={formatNumberInput(row.unitPrice)}
                      onChange={(event) => patchRow(row.id, { unitPrice: numberValue(event.target.value) })}
                      inputMode="numeric"
                    />
                  </TableCell>
                  <TableCell>
                    <FormulaAmountInput value={row.totalIncome} formula={row.totalIncomeFormula} onCommit={(input) => commitFormula(row, "totalIncome", "totalIncomeFormula", input)} />
                  </TableCell>
                  <TableCell>
                    <FormulaAmountInput value={row.operationCost} formula={row.operationCostFormula} onCommit={(input) => commitFormula(row, "operationCost", "operationCostFormula", input)} />
                  </TableCell>
                  <TableCell>
                    <div title="기사 정산 금액을 기본값으로 불러옵니다.">
                      <FormulaAmountInput value={row.vehicleCost} formula={row.vehicleCostFormula} onCommit={(input) => commitFormula(row, "vehicleCost", "vehicleCostFormula", input)} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div title="가이드 정산 금액을 기본값으로 불러옵니다.">
                      <FormulaAmountInput value={row.guideCost} formula={row.guideCostFormula} onCommit={(input) => commitFormula(row, "guideCost", "guideCostFormula", input)} />
                    </div>
                  </TableCell>
                  <TableCell className={readOnlyCellClass}>
                    <ReadOnlyAmount value={row.kimbapCost} />
                    <div className="mt-1 grid grid-cols-2 gap-1">
                      <MiniNumberInput value={row.kimbapQty} onChange={(value) => patchRow(row.id, { kimbapQty: value })} placeholder="수량" />
                      <MiniNumberInput value={row.kimbapUnitPrice} onChange={(value) => patchRow(row.id, { kimbapUnitPrice: value })} placeholder="단가" />
                    </div>
                  </TableCell>
                  <TableCell className={readOnlyCellClass}>
                    <ReadOnlyAmount value={row.fruitCost} />
                    <div className="mt-1 grid grid-cols-2 gap-1">
                      <MiniNumberInput value={row.fruitQty} onChange={(value) => patchRow(row.id, { fruitQty: value })} placeholder="수량" />
                      <MiniNumberInput value={row.fruitUnitPrice} onChange={(value) => patchRow(row.id, { fruitUnitPrice: value })} placeholder="단가" />
                    </div>
                  </TableCell>
                  <TableCell className={readOnlyCellClass}>
                    <ReadOnlyAmount value={row.riceCakeWaterCost} />
                    <div className="mt-1 grid grid-cols-3 gap-1">
                      <MiniNumberInput value={row.riceCakeWaterQty} onChange={(value) => patchRow(row.id, { riceCakeWaterQty: value })} placeholder="수량" />
                      <MiniNumberInput value={row.riceCakeWaterUnitPrice} onChange={(value) => patchRow(row.id, { riceCakeWaterUnitPrice: value })} placeholder="단가" />
                      <MiniNumberInput value={row.riceCakeWaterExtraCost} onChange={(value) => patchRow(row.id, { riceCakeWaterExtraCost: value })} placeholder="추가" />
                    </div>
                  </TableCell>
                  <TableCell className={readOnlyCellClass}>
                    <ReadOnlyAmount value={row.snackBoxCost} />
                    <div className="mt-1 grid grid-cols-2 gap-1">
                      <MiniNumberInput value={row.snackBoxQty} onChange={(value) => patchRow(row.id, { snackBoxQty: value })} placeholder="수량" />
                      <MiniNumberInput value={row.snackBoxUnitPrice} onChange={(value) => patchRow(row.id, { snackBoxUnitPrice: value })} placeholder="단가" />
                    </div>
                  </TableCell>
                  <TableCell className={readOnlyCellClass}>
                    <ReadOnlyAmount value={row.finalBalance} hint="잔액+조정" />
                    <Input
                      className="mt-1 h-7 text-right text-[11px]"
                      value={row.adjustmentAmount ? String(row.adjustmentAmount) : ""}
                      onChange={(event) => patchRow(row.id, { adjustmentAmount: numberValue(event.target.value) })}
                      placeholder="조정"
                    />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8 text-xs" value={row.memo ?? ""} onChange={(event) => patchRow(row.id, { memo: event.target.value })} placeholder="비고" />
                  </TableCell>
                  <TableCell className={`whitespace-nowrap text-center ${readOnlyCellClass}`}>{row.guideName || "-"}</TableCell>
                  <TableCell>
                    <Select value={row.status} onChange={(event) => patchRow(row.id, { status: event.target.value as IntegratedSettlementStatus })}>
                      <option value="DRAFT">작성중</option>
                      <option value="CONFIRMED">완료</option>
                    </Select>
                    <p className="mt-1 text-center text-[11px] text-slate-500">{statusLabel(row.status)}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resetLinkedValues(row)}
                      title="인원과 간식 수량을 예약현황 연동값으로 되돌립니다."
                    >
                      연동값 복원
                    </Button>
                    <Button
                      size="sm"
                      className="ml-1"
                      onClick={() => saveRow(row)}
                      disabled={savingId === row.id}
                      title="현재 행의 입력값과 수식 결과를 저장합니다."
                    >
                      {savingId === row.id ? "저장중" : "저장"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={19} className="h-28 text-center text-slate-500">해당 조건의 통합정산 행이 없습니다.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
