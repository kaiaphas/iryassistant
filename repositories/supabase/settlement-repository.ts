import type { SettlementItem, SettlementType } from "@/lib/types";
import { createSupabaseServerClient } from "@/repositories/supabase/reservation-repository";

type SettlementPaymentStatus = "BEFORE" | "PAID" | "HOLD";

type SettlementItemRow = {
  id: string;
  settlement_month: string;
  settlement_type: SettlementType;
  schedule_id: string;
  person_id: string;
  person_name: string;
  person_phone: string | null;
  bank_account: string | null;
  tour_date: string;
  tour_type_label?: "당일" | "숙박" | null;
  product_name: string;
  bus_company: string | null;
  amount: number | string | null;
  withholding_rate: number | string | null;
  withholding_amount?: number | string | null;
  net_amount?: number | string | null;
  payment_status: SettlementPaymentStatus;
  payment_date: string | null;
  memo: string | null;
};

type ScheduleSettlementSourceRow = {
  id: string;
  tour_date: string;
  tour_type_label: "당일" | "숙박" | null;
  product_name: string | null;
  bus_company: string | null;
  guide_id: string | null;
  guide_name: string | null;
  guide_phone: string | null;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
};

type MasterAccountRow = {
  id: string;
  name?: string | null;
  phone?: string | null;
  bank_account: string | null;
};

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
  return Number(value) || 0;
}

function getMonthRange(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("정산월 형식이 올바르지 않습니다.");
  }

  const [year, monthIndex] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = new Date(Date.UTC(year, monthIndex, 0)).toISOString().slice(0, 10);
  return { start, end };
}

function calculateWithholding(amount: number, rate: number) {
  return Math.round((amount * rate) / 100);
}

function getDefaultWithholdingRate(type: SettlementType) {
  return type === "GUIDE" || type === "DRIVER" ? 3.3 : 0;
}

function normalizeName(value: string | null | undefined) {
  return value?.replace(/\s+/g, "") || "";
}

function normalizeTourType(value: string | null | undefined): SettlementItem["tourType"] {
  return value === "숙박" ? "숙박" : "당일";
}

function mapSettlementItem(row: SettlementItemRow): SettlementItem {
  const amount = numberValue(row.amount);
  const withholdingRate = numberValue(row.withholding_rate);
  const withholdingAmount = row.withholding_amount === undefined
    ? calculateWithholding(amount, withholdingRate)
    : numberValue(row.withholding_amount);

  return {
    id: row.id,
    settlementMonth: row.settlement_month,
    settlementType: row.settlement_type,
    scheduleId: row.schedule_id,
    personId: row.person_id,
    personName: row.person_name,
    personPhone: row.person_phone ?? undefined,
    bankAccount: row.bank_account ?? undefined,
    tourDate: row.tour_date,
    tourType: normalizeTourType(row.tour_type_label),
    productName: row.product_name,
    busCompany: row.bus_company ?? undefined,
    amount,
    withholdingRate,
    withholdingAmount,
    netAmount: row.net_amount === undefined ? amount - withholdingAmount : numberValue(row.net_amount),
    memo: row.memo ?? undefined,
  };
}

async function fetchMasterPeople(type: SettlementType) {
  const supabase = createSupabaseServerClient();
  const table = type === "GUIDE" ? "master_guides" : "master_drivers";
  const { data, error } = await supabase.from(table).select("id,name,phone,bank_account");
  if (error) throw new Error(`마스터 조회 실패: ${error.message}`);

  const byId = new Map<string, MasterAccountRow>();
  const byName = new Map<string, MasterAccountRow | null>();

  for (const row of (data ?? []) as MasterAccountRow[]) {
    byId.set(row.id, row);

    const key = normalizeName(row.name);
    if (!key) continue;
    byName.set(key, byName.has(key) ? null : row);
  }

  return { byId, byName };
}

async function fetchMasterBankAccount(type: SettlementType, personId: string) {
  const supabase = createSupabaseServerClient();
  const table = type === "GUIDE" ? "master_guides" : "master_drivers";
  const { data, error } = await supabase
    .from(table)
    .select("bank_account")
    .eq("id", personId)
    .maybeSingle();

  if (error) throw new Error(`마스터 계좌 조회 실패: ${error.message}`);
  return (data as Pick<MasterAccountRow, "bank_account"> | null)?.bank_account ?? null;
}

export async function findSettlementItemsFromSupabase(month: string, type: SettlementType) {
  const { start, end } = getMonthRange(month);
  const supabase = createSupabaseServerClient();

  const { data: scheduleData, error: scheduleError } = await supabase
    .from("reservation_schedule_overview")
    .select("id,tour_date,tour_type_label,product_name,bus_company,guide_id,guide_name,guide_phone,driver_id,driver_name,driver_phone")
    .eq("is_active", true)
    .gte("tour_date", start)
    .lte("tour_date", end)
    .order("tour_date", { ascending: true });

  if (scheduleError) throw new Error(`예약현황 정산 대상 조회 실패: ${scheduleError.message}`);

  const sourceRows = (scheduleData ?? []) as ScheduleSettlementSourceRow[];
  const masterPeople = await fetchMasterPeople(type);
  const resolvedSourceRows = sourceRows.flatMap((row) => {
    const currentId = type === "GUIDE" ? row.guide_id : row.driver_id;
    const currentName = type === "GUIDE" ? row.guide_name : row.driver_name;
    const currentPhone = type === "GUIDE" ? row.guide_phone : row.driver_phone;
    const master = currentId ? masterPeople.byId.get(currentId) : masterPeople.byName.get(normalizeName(currentName));
    const personId = currentId ?? master?.id;

    if (!personId) return [];

    return [{
      row,
      personId,
      personName: master?.name || currentName || "이름 미정",
      personPhone: master?.phone || currentPhone || null,
      bankAccount: master?.bank_account || null,
    }];
  });
  const [settlementResult] = await Promise.all([
    supabase
      .from("settlement_items")
      .select("id,settlement_month,settlement_type,schedule_id,person_id,person_name,person_phone,bank_account,tour_date,tour_type_label,product_name,bus_company,amount,withholding_rate,withholding_amount,net_amount,payment_status,payment_date,memo")
      .eq("settlement_month", month)
      .eq("settlement_type", type),
  ]);
  const savedData = settlementResult.error?.message.includes("tour_type_label")
    ? await supabase
      .from("settlement_items")
      .select("id,settlement_month,settlement_type,schedule_id,person_id,person_name,person_phone,bank_account,tour_date,product_name,bus_company,amount,withholding_rate,withholding_amount,net_amount,payment_status,payment_date,memo")
      .eq("settlement_month", month)
      .eq("settlement_type", type)
    : settlementResult;

  if (!isMissingTable(savedData.error) && savedData.error) {
    throw new Error(`정산 저장값 조회 실패: ${savedData.error.message}`);
  }

  const savedByKey = new Map(
    ((savedData.data ?? []) as unknown as SettlementItemRow[])
      .map((row) => [`${row.schedule_id}:${row.person_id}`, mapSettlementItem(row)]),
  );

  return resolvedSourceRows.map(({ row, personId, personName, personPhone, bankAccount }) => {
    const saved = savedByKey.get(`${row.id}:${personId}`);
    if (saved) {
      return [{
        ...saved,
        tourDate: row.tour_date,
        tourType: normalizeTourType(row.tour_type_label),
        productName: row.product_name || saved.productName,
        busCompany: row.bus_company ?? saved.busCompany,
        bankAccount: bankAccount ?? undefined,
      }];
    }

    const amount = 0;
    const withholdingRate = getDefaultWithholdingRate(type);
    const withholdingAmount = calculateWithholding(amount, withholdingRate);

    return [{
      id: `draft:${month}:${type}:${row.id}:${personId}`,
      settlementMonth: month,
      settlementType: type,
      scheduleId: row.id,
      personId,
      personName,
      personPhone: personPhone ?? undefined,
      bankAccount: bankAccount ?? undefined,
      tourDate: row.tour_date,
      tourType: normalizeTourType(row.tour_type_label),
      productName: row.product_name || "상품명 미정",
      busCompany: row.bus_company ?? undefined,
      amount,
      withholdingRate,
      withholdingAmount,
      netAmount: amount - withholdingAmount,
    }];
  }).flat().sort((a, b) => a.personName.localeCompare(b.personName, "ko") || a.tourDate.localeCompare(b.tourDate));
}

async function getOrCreateBatch(month: string, type: SettlementType) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("settlement_batches")
    .upsert({ settlement_month: month, settlement_type: type }, { onConflict: "settlement_month,settlement_type" })
    .select("id")
    .single();

  if (error) throw new Error(`정산 배치 생성 실패: ${error.message}`);
  return data.id as string;
}

export async function saveSettlementItemToSupabase(item: SettlementItem) {
  const supabase = createSupabaseServerClient();
  const batchId = await getOrCreateBatch(item.settlementMonth, item.settlementType);
  const payload = {
    batch_id: batchId,
    settlement_month: item.settlementMonth,
    settlement_type: item.settlementType,
    schedule_id: item.scheduleId,
    person_id: item.personId,
    person_name: item.personName,
    person_phone: item.personPhone ?? null,
    bank_account: null,
    tour_date: item.tourDate,
    tour_type_label: item.tourType,
    product_name: item.productName,
    bus_company: item.busCompany ?? null,
    amount: Number(item.amount) || 0,
    withholding_rate: Number(item.withholdingRate) || 0,
    payment_status: "BEFORE" as SettlementPaymentStatus,
    payment_date: null,
    memo: item.memo || null,
  };
  const legacyPayload = { ...payload } as Partial<typeof payload>;
  delete legacyPayload.tour_type_label;
  const result = await supabase
    .from("settlement_items")
    .upsert(payload, { onConflict: "settlement_month,settlement_type,schedule_id,person_id" })
    .select("id,settlement_month,settlement_type,schedule_id,person_id,person_name,person_phone,bank_account,tour_date,tour_type_label,product_name,bus_company,amount,withholding_rate,withholding_amount,net_amount,payment_status,payment_date,memo")
    .single();
  const fallbackResult = result.error?.message.includes("tour_type_label")
    ? await supabase
      .from("settlement_items")
      .upsert(legacyPayload, { onConflict: "settlement_month,settlement_type,schedule_id,person_id" })
      .select("id,settlement_month,settlement_type,schedule_id,person_id,person_name,person_phone,bank_account,tour_date,product_name,bus_company,amount,withholding_rate,withholding_amount,net_amount,payment_status,payment_date,memo")
      .single()
    : result;

  if (fallbackResult.error) throw new Error(`정산 항목 저장 실패: ${fallbackResult.error.message}`);
  const masterBankAccount = await fetchMasterBankAccount(item.settlementType, item.personId);
  return {
    ...mapSettlementItem(fallbackResult.data as unknown as SettlementItemRow),
    bankAccount: masterBankAccount ?? undefined,
    tourType: item.tourType,
  };
}
