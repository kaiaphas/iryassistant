import type { IntegratedSettlementRow } from "@/lib/types";
import { calculateIntegratedSettlementRow } from "@/lib/integrated-settlement-calculator";
import { getIntegratedSettlementDefaultsFromSupabase, type IntegratedSettlementDefaults } from "@/repositories/supabase/master-repository";
import { createSupabaseServerClient } from "@/repositories/supabase/reservation-repository";

type ScheduleSourceRow = {
  id: string;
  tour_date: string;
  tour_type_label: "당일" | "숙박" | null;
  product_name: string | null;
  reservation_count: number | null;
  not_bus_count: number | null;
  vehicle_no: string | null;
  bus_company: string | null;
  vehicle_capacity: string | null;
  guide_id: string | null;
  guide_name: string | null;
};

type IntegratedSettlementDbRow = {
  id: string;
  batch_id: string | null;
  schedule_id: string;
  settlement_year: number;
  settlement_month: number;
  sort_no: number;
  tour_date: string;
  tour_type_label: "당일" | "숙박" | null;
  source_product_name: string | null;
  override_product_name: string | null;
  source_people_count: number | null;
  override_people_count: number | null;
  not_bus_count: number | null;
  vehicle_no: string | null;
  bus_company: string | null;
  vehicle_capacity: string | null;
  unit_price: number | string | null;
  total_income: number | string | null;
  total_income_formula: string | null;
  operation_cost: number | string | null;
  operation_cost_formula: string | null;
  vehicle_cost: number | string | null;
  vehicle_cost_formula: string | null;
  guide_cost: number | string | null;
  guide_cost_formula: string | null;
  kimbap_qty: number | string | null;
  kimbap_unit_price: number | string | null;
  kimbap_cost: number | string | null;
  kimbap_formula: string | null;
  fruit_qty: number | string | null;
  fruit_unit_price: number | string | null;
  fruit_cost: number | string | null;
  fruit_formula: string | null;
  rice_cake_water_qty: number | string | null;
  rice_cake_water_unit_price: number | string | null;
  rice_cake_water_extra_cost: number | string | null;
  rice_cake_water_cost: number | string | null;
  rice_cake_water_formula: string | null;
  snack_box_qty: number | string | null;
  snack_box_unit_price: number | string | null;
  snack_box_cost: number | string | null;
  snack_box_formula: string | null;
  balance: number | string | null;
  balance_formula: string | null;
  adjustment_amount: number | string | null;
  final_balance: number | string | null;
  memo: string | null;
  guide_id: string | null;
  guide_name: string | null;
  status: "DRAFT" | "CONFIRMED" | null;
};

type SettlementCostRow = {
  schedule_id: string;
  settlement_type: "GUIDE" | "DRIVER";
  amount: number | string | null;
};

type SettlementCosts = {
  guideCost: number;
  vehicleCost: number;
};

const selectColumns = [
  "id",
  "batch_id",
  "schedule_id",
  "settlement_year",
  "settlement_month",
  "sort_no",
  "tour_date",
  "tour_type_label",
  "source_product_name",
  "override_product_name",
  "source_people_count",
  "override_people_count",
  "not_bus_count",
  "vehicle_no",
  "bus_company",
  "vehicle_capacity",
  "unit_price",
  "total_income",
  "total_income_formula",
  "operation_cost",
  "operation_cost_formula",
  "vehicle_cost",
  "vehicle_cost_formula",
  "guide_cost",
  "guide_cost_formula",
  "kimbap_qty",
  "kimbap_unit_price",
  "kimbap_cost",
  "kimbap_formula",
  "fruit_qty",
  "fruit_unit_price",
  "fruit_cost",
  "fruit_formula",
  "rice_cake_water_qty",
  "rice_cake_water_unit_price",
  "rice_cake_water_extra_cost",
  "rice_cake_water_cost",
  "rice_cake_water_formula",
  "snack_box_qty",
  "snack_box_unit_price",
  "snack_box_cost",
  "snack_box_formula",
  "balance",
  "balance_formula",
  "adjustment_amount",
  "final_balance",
  "memo",
  "guide_id",
  "guide_name",
  "status",
].join(",");

function isMissingTable(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? "";
  return (
    error?.code === "42P01"
    || error?.code === "PGRST205"
    || message.includes("does not exist")
    || message.includes("schema cache")
    || message.includes("Could not find the table")
  );
}

function numberValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Math.round(Number(value)) || 0;
}

function normalizeMonth(year: number, month: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error("정산 연도가 올바르지 않습니다.");
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error("정산 월이 올바르지 않습니다.");
  const monthText = String(month).padStart(2, "0");
  const start = `${year}-${monthText}-01`;
  const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return { start, end };
}

function mapDbRow(row: IntegratedSettlementDbRow): IntegratedSettlementRow {
  return calculateIntegratedSettlementRow({
    id: row.id,
    batchId: row.batch_id ?? undefined,
    scheduleId: row.schedule_id,
    settlementYear: row.settlement_year,
    settlementMonth: row.settlement_month,
    sortNo: row.sort_no,
    tourDate: row.tour_date,
    tourType: row.tour_type_label === "숙박" ? "숙박" : "당일",
    sourceProductName: row.source_product_name || "상품명 미정",
    overrideProductName: row.override_product_name ?? undefined,
    sourcePeopleCount: numberValue(row.source_people_count),
    overridePeopleCount: row.override_people_count === null ? undefined : numberValue(row.override_people_count),
    notBusCount: numberValue(row.not_bus_count),
    vehicleNo: row.vehicle_no ?? undefined,
    busCompany: row.bus_company ?? undefined,
    vehicleCapacity: row.vehicle_capacity ?? undefined,
    unitPrice: numberValue(row.unit_price),
    totalIncome: numberValue(row.total_income),
    totalIncomeFormula: row.total_income_formula ?? undefined,
    operationCost: numberValue(row.operation_cost),
    operationCostFormula: row.operation_cost_formula ?? undefined,
    vehicleCost: numberValue(row.vehicle_cost),
    vehicleCostFormula: row.vehicle_cost_formula ?? undefined,
    guideCost: numberValue(row.guide_cost),
    guideCostFormula: row.guide_cost_formula ?? undefined,
    kimbapQty: numberValue(row.kimbap_qty),
    kimbapUnitPrice: numberValue(row.kimbap_unit_price),
    kimbapCost: numberValue(row.kimbap_cost),
    kimbapFormula: row.kimbap_formula ?? undefined,
    fruitQty: numberValue(row.fruit_qty),
    fruitUnitPrice: numberValue(row.fruit_unit_price),
    fruitCost: numberValue(row.fruit_cost),
    fruitFormula: row.fruit_formula ?? undefined,
    riceCakeWaterQty: numberValue(row.rice_cake_water_qty),
    riceCakeWaterUnitPrice: numberValue(row.rice_cake_water_unit_price),
    riceCakeWaterExtraCost: numberValue(row.rice_cake_water_extra_cost),
    riceCakeWaterCost: numberValue(row.rice_cake_water_cost),
    riceCakeWaterFormula: row.rice_cake_water_formula ?? undefined,
    snackBoxQty: numberValue(row.snack_box_qty),
    snackBoxUnitPrice: numberValue(row.snack_box_unit_price),
    snackBoxCost: numberValue(row.snack_box_cost),
    snackBoxFormula: row.snack_box_formula ?? undefined,
    balance: numberValue(row.balance),
    balanceFormula: row.balance_formula ?? undefined,
    adjustmentAmount: numberValue(row.adjustment_amount),
    finalBalance: numberValue(row.final_balance),
    memo: row.memo ?? undefined,
    guideId: row.guide_id ?? undefined,
    guideName: row.guide_name ?? undefined,
    status: row.status ?? "DRAFT",
  });
}

function createDraftRow(
  source: ScheduleSourceRow,
  year: number,
  month: number,
  sortNo: number,
  defaults: IntegratedSettlementDefaults,
  costs?: SettlementCosts,
): IntegratedSettlementRow {
  const peopleCount = source.reservation_count ?? 0;
  return calculateIntegratedSettlementRow({
    id: `draft:${year}:${month}:${source.id}`,
    scheduleId: source.id,
    settlementYear: year,
    settlementMonth: month,
    sortNo,
    tourDate: source.tour_date,
    tourType: source.tour_type_label === "숙박" ? "숙박" : "당일",
    sourceProductName: source.product_name || "상품명 미정",
    sourcePeopleCount: peopleCount,
    notBusCount: source.not_bus_count ?? 0,
    vehicleNo: source.vehicle_no ?? undefined,
    busCompany: source.bus_company ?? undefined,
    vehicleCapacity: source.vehicle_capacity ?? undefined,
    unitPrice: 0,
    totalIncome: 0,
    totalIncomeFormula: "=D4*E4",
    operationCost: 0,
    vehicleCost: costs?.vehicleCost ?? 0,
    guideCost: costs?.guideCost ?? 0,
    kimbapQty: peopleCount,
    kimbapUnitPrice: defaults.kimbapUnitPrice,
    kimbapCost: 0,
    fruitQty: peopleCount,
    fruitUnitPrice: defaults.fruitUnitPrice,
    fruitCost: 0,
    riceCakeWaterQty: peopleCount,
    riceCakeWaterUnitPrice: defaults.riceCakeWaterUnitPrice,
    riceCakeWaterExtraCost: 0,
    riceCakeWaterCost: 0,
    snackBoxQty: peopleCount,
    snackBoxUnitPrice: defaults.snackBoxUnitPrice,
    snackBoxCost: 0,
    balance: 0,
    balanceFormula: undefined,
    adjustmentAmount: 0,
    finalBalance: 0,
    guideId: source.guide_id ?? undefined,
    guideName: source.guide_name ?? undefined,
    status: "DRAFT",
  });
}

async function fetchScheduleSources(year: number, month: number) {
  const { start, end } = normalizeMonth(year, month);
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reservation_schedule_overview")
    .select("id,tour_date,tour_type_label,product_name,reservation_count,not_bus_count,vehicle_no,bus_company,vehicle_capacity,guide_id,guide_name")
    .eq("is_active", true)
    .gte("tour_date", start)
    .lte("tour_date", end)
    .order("tour_date", { ascending: true })
    .order("product_name", { ascending: true });

  if (error) throw new Error(`통합정산 예약현황 조회 실패: ${error.message}`);
  return (data ?? []) as ScheduleSourceRow[];
}

async function fetchSettlementCosts(year: number, month: number) {
  const supabase = createSupabaseServerClient();
  const settlementMonth = `${year}-${String(month).padStart(2, "0")}`;
  const { data, error } = await supabase
    .from("settlement_items")
    .select("schedule_id,settlement_type,amount")
    .eq("settlement_month", settlementMonth)
    .in("settlement_type", ["GUIDE", "DRIVER"]);

  if (isMissingTable(error)) return new Map<string, SettlementCosts>();
  if (error) throw new Error(`정산서 차량비/가이드비 조회 실패: ${error.message}`);

  const costsByScheduleId = new Map<string, SettlementCosts>();
  for (const row of (data ?? []) as unknown as SettlementCostRow[]) {
    const current = costsByScheduleId.get(row.schedule_id) ?? { guideCost: 0, vehicleCost: 0 };
    if (row.settlement_type === "GUIDE") current.guideCost += numberValue(row.amount);
    if (row.settlement_type === "DRIVER") current.vehicleCost += numberValue(row.amount);
    costsByScheduleId.set(row.schedule_id, current);
  }
  return costsByScheduleId;
}

async function fetchSavedRows(year: number, month: number) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("integrated_settlement_rows")
    .select(selectColumns)
    .eq("settlement_year", year)
    .eq("settlement_month", month);

  if (isMissingTable(error)) return { rows: [], missingTable: true };
  if (error) throw new Error(`통합정산 저장값 조회 실패: ${error.message}`);
  return { rows: ((data ?? []) as unknown as IntegratedSettlementDbRow[]).map(mapDbRow), missingTable: false };
}

function applySettlementCosts(row: IntegratedSettlementRow, costs?: SettlementCosts) {
  if (!costs) return row;
  return calculateIntegratedSettlementRow({
    ...row,
    vehicleCost: row.vehicleCost || row.vehicleCostFormula ? row.vehicleCost : costs.vehicleCost,
    guideCost: row.guideCost || row.guideCostFormula ? row.guideCost : costs.guideCost,
  });
}

async function getOrCreateBatch(year: number, month: number) {
  const supabase = createSupabaseServerClient();
  const title = `${year}년 ${String(month).padStart(2, "0")}월 통합정산서`;
  const { data, error } = await supabase
    .from("integrated_settlement_batches")
    .upsert({ settlement_year: year, settlement_month: month, title }, { onConflict: "settlement_year,settlement_month" })
    .select("id")
    .single();

  if (error) throw new Error(`통합정산 배치 생성 실패: ${error.message}`);
  return data.id as string;
}

export async function findIntegratedSettlementRowsFromSupabase(year: number, month: number) {
  const [sources, savedResult, settlementCosts, defaults] = await Promise.all([
    fetchScheduleSources(year, month),
    fetchSavedRows(year, month),
    fetchSettlementCosts(year, month),
    getIntegratedSettlementDefaultsFromSupabase(),
  ]);
  const savedByScheduleId = new Map(savedResult.rows.map((row) => [row.scheduleId, row]));

  return sources.map((source, index) => {
    const saved = savedByScheduleId.get(source.id);
    const costs = settlementCosts.get(source.id);
    if (!saved) return createDraftRow(source, year, month, index + 1, defaults, costs);
    return applySettlementCosts({
      ...saved,
      sortNo: saved.sortNo || index + 1,
      tourDate: source.tour_date,
      tourType: source.tour_type_label === "숙박" ? "숙박" : "당일",
      sourceProductName: source.product_name || saved.sourceProductName,
      sourcePeopleCount: source.reservation_count ?? saved.sourcePeopleCount,
      notBusCount: source.not_bus_count ?? saved.notBusCount,
      vehicleNo: source.vehicle_no ?? saved.vehicleNo,
      busCompany: source.bus_company ?? saved.busCompany,
      vehicleCapacity: source.vehicle_capacity ?? saved.vehicleCapacity,
      guideId: source.guide_id ?? saved.guideId,
      guideName: source.guide_name ?? saved.guideName,
    }, costs);
  }).sort((a, b) => a.sortNo - b.sortNo || a.tourDate.localeCompare(b.tourDate));
}

function toPayload(row: IntegratedSettlementRow, batchId: string) {
  const calculated = calculateIntegratedSettlementRow(row);
  return {
    batch_id: batchId,
    schedule_id: calculated.scheduleId,
    settlement_year: calculated.settlementYear,
    settlement_month: calculated.settlementMonth,
    sort_no: calculated.sortNo,
    tour_date: calculated.tourDate,
    tour_type_label: calculated.tourType,
    source_product_name: calculated.sourceProductName,
    override_product_name: calculated.overrideProductName || null,
    source_people_count: calculated.sourcePeopleCount,
    override_people_count: calculated.overridePeopleCount ?? null,
    not_bus_count: calculated.notBusCount,
    vehicle_no: calculated.vehicleNo ?? null,
    bus_company: calculated.busCompany ?? null,
    vehicle_capacity: calculated.vehicleCapacity ?? null,
    unit_price: calculated.unitPrice,
    total_income: calculated.totalIncome,
    total_income_formula: calculated.totalIncomeFormula || null,
    operation_cost: calculated.operationCost,
    operation_cost_formula: calculated.operationCostFormula || null,
    vehicle_cost: calculated.vehicleCost,
    vehicle_cost_formula: calculated.vehicleCostFormula || null,
    guide_cost: calculated.guideCost,
    guide_cost_formula: calculated.guideCostFormula || null,
    kimbap_qty: calculated.kimbapQty,
    kimbap_unit_price: calculated.kimbapUnitPrice,
    kimbap_cost: calculated.kimbapCost,
    kimbap_formula: null,
    fruit_qty: calculated.fruitQty,
    fruit_unit_price: calculated.fruitUnitPrice,
    fruit_cost: calculated.fruitCost,
    fruit_formula: null,
    rice_cake_water_qty: calculated.riceCakeWaterQty,
    rice_cake_water_unit_price: calculated.riceCakeWaterUnitPrice,
    rice_cake_water_extra_cost: calculated.riceCakeWaterExtraCost,
    rice_cake_water_cost: calculated.riceCakeWaterCost,
    rice_cake_water_formula: null,
    snack_box_qty: calculated.snackBoxQty,
    snack_box_unit_price: calculated.snackBoxUnitPrice,
    snack_box_cost: calculated.snackBoxCost,
    snack_box_formula: null,
    balance: calculated.balance,
    balance_formula: null,
    adjustment_amount: calculated.adjustmentAmount,
    final_balance: calculated.finalBalance,
    memo: calculated.memo || null,
    guide_id: calculated.guideId ?? null,
    guide_name: calculated.guideName ?? null,
    status: calculated.status,
  };
}

export async function saveIntegratedSettlementRowToSupabase(row: IntegratedSettlementRow) {
  const supabase = createSupabaseServerClient();
  const batchId = await getOrCreateBatch(row.settlementYear, row.settlementMonth);
  const { data, error } = await supabase
    .from("integrated_settlement_rows")
    .upsert(toPayload(row, batchId), { onConflict: "settlement_year,settlement_month,schedule_id" })
    .select(selectColumns)
    .single();

  if (error) throw new Error(`통합정산 행 저장 실패: ${error.message}`);
  return mapDbRow(data as unknown as IntegratedSettlementDbRow);
}

export async function syncIntegratedSettlementRowsToSupabase(year: number, month: number) {
  const rows = await findIntegratedSettlementRowsFromSupabase(year, month);
  const batchId = await getOrCreateBatch(year, month);
  const drafts = rows.filter((row) => row.id.startsWith("draft:"));
  if (drafts.length === 0) return rows;

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("integrated_settlement_rows")
    .upsert(drafts.map((row) => toPayload(row, batchId)), { onConflict: "settlement_year,settlement_month,schedule_id" });

  if (error) throw new Error(`통합정산 연동 생성 실패: ${error.message}`);
  return findIntegratedSettlementRowsFromSupabase(year, month);
}
