import { createHash, randomUUID } from "node:crypto";
import { supabase, getSupabaseErrorMessage } from "./supabase";
import { config } from "./config";
import type {
  ImportBatchUpdate,
  MealType,
  MySqlScheduleRow,
  NormalizedRestaurantBooking,
  NormalizedSchedule,
  ReservationWorkStatus,
  ScheduleProgressStatus,
  SyncMode,
  TourType,
  ValidationResult,
} from "./types";

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function toNullableString(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim();
}

function normalizePersonName(value: string | null) {
  return value?.replace(/\s+/g, " ").trim() || null;
}

function getPersonMatchKey(value: string | null) {
  return normalizePersonName(value)?.replace(/\s+/g, "") ?? null;
}

function parsePersonText(value: unknown) {
  const text = toNullableString(value);
  if (!text) return { name: null, phone: null };

  const phoneMatch = text.match(/(?:\+?82[-.\s]?)?0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/);
  const phone = phoneMatch?.[0].replace(/\s+/g, "-") ?? null;
  const name = normalizePersonName(
    text
      .replace(/(?:\+?82[-.\s]?)?0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/g, "")
      .replace(/[()[\]{}]/g, " ")
      .replace(/[\/,|·]+/g, " ")
      .replace(/\s*\d+$/, ""),
  );

  return { name: name || text, phone };
}

type MasterPerson = {
  id: string;
  name: string;
  phone: string | null;
};

function createUniquePersonMap(people: MasterPerson[]) {
  const map = new Map<string, MasterPerson | null>();

  for (const person of people) {
    const key = getPersonMatchKey(person.name);
    if (!key) continue;

    if (map.has(key)) {
      map.set(key, null);
      continue;
    }

    map.set(key, person);
  }

  return map;
}

function applyMasterPerson(personText: unknown, masterMap: Map<string, MasterPerson | null>) {
  const parsed = parsePersonText(personText);
  const key = getPersonMatchKey(parsed.name);
  const master = key ? masterMap.get(key) : undefined;

  if (!master) {
    return {
      id: null,
      name: parsed.name,
      phone: parsed.phone,
    };
  }

  return {
    id: master.id,
    name: master.name,
    phone: master.phone ?? parsed.phone,
  };
}

function normalizeDate(value: unknown) {
  const text = toNullableString(value);
  if (!text) throw new Error("tour_date 누락");
  const dateOnly = text.slice(0, 10).replaceAll("/", "-");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    throw new Error(`날짜 포맷 오류: ${text}`);
  }
  const time = Date.parse(`${dateOnly}T00:00:00Z`);
  if (Number.isNaN(time)) {
    throw new Error(`날짜 값이 올바르지 않습니다: ${text}`);
  }
  return dateOnly;
}

function normalizeTimeText(value: unknown) {
  const text = toNullableString(value);
  if (!text) return null;
  return text;
}

function normalizeNumber(value: unknown, field: string) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} 숫자 변환 오류: ${value}`);
  }
  return parsed;
}

function deterministicUuid(namespace: string, key: string) {
  const hash = createHash("sha1").update(`${namespace}:${key}`).digest("hex").slice(0, 32);
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0") + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join("-");
}

function normalizeTourType(value: unknown, hotelName: string | null, productName: string, nights?: unknown): TourType {
  const text = toNullableString(value)?.toUpperCase();
  if (text === "STAY" || text === "숙박") return "STAY";
  if (text === "DAY" || text === "당일") return "DAY";
  if (normalizeNumber(nights, "nights") > 0) return "STAY";
  if (hotelName || productName.includes("박")) return "STAY";
  return "DAY";
}

function normalizeWorkStatus(value: unknown): ReservationWorkStatus {
  const text = toNullableString(value)?.toUpperCase();
  if (text === "COMPLETED" || text === "예약완료" || text === "완료") return "COMPLETED";
  if (text === "CANCELED" || text === "CANCELLED" || text === "예약취소" || text === "취소") return "CANCELED";
  return "BEFORE";
}

function normalizeProgressStatus(value: unknown): ScheduleProgressStatus {
  const text = toNullableString(value)?.toUpperCase();
  if (text === "COMPLETED" || text === "예약완료" || text === "확정" || text === "완료") return "COMPLETED";
  if (text === "CANCELED" || text === "CANCELLED" || text === "예약취소" || text === "취소") return "CANCELED";
  return "IN_PROGRESS";
}

function normalizeMealType(value: unknown): MealType {
  const text = toNullableString(value)?.toUpperCase();
  if (text === "DINNER" || text === "석식") return "DINNER";
  return "LUNCH";
}

type RestaurantJsonItem = {
  meal_type?: string;
  restaurant_name?: string;
  restaurant_phone?: string;
  restaurant_memo?: string;
  restaurant_status?: string;
};

function parseRestaurantBookings(row: MySqlScheduleRow, scheduleId: string) {
  const jsonText = toNullableString(row.restaurant_bookings_json);
  const items: RestaurantJsonItem[] = [];

  if (jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        items.push(...parsed);
      }
    } catch (error) {
      throw new Error(`restaurant_bookings_json 파싱 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const fallbackName = toNullableString(row.restaurant_name);
  if (items.length === 0 && fallbackName) {
    items.push({
      meal_type: toNullableString(row.meal_type) ?? "LUNCH",
      restaurant_name: fallbackName,
      restaurant_phone: toNullableString(row.restaurant_phone) ?? undefined,
      restaurant_memo: toNullableString(row.restaurant_memo) ?? undefined,
      restaurant_status: toNullableString(row.restaurant_status) ?? "BEFORE",
    });
  }

  return items
    .filter((item) => toNullableString(item.restaurant_name))
    .map<NormalizedRestaurantBooking>((item, index) => {
      const restaurantName = toNullableString(item.restaurant_name);
      if (!restaurantName) {
        throw new Error("restaurant_name 누락");
      }

      return {
        id: deterministicUuid("restaurant", `${scheduleId}:${index}:${restaurantName}`),
        schedule_id: scheduleId,
        meal_type: normalizeMealType(item.meal_type),
        restaurant_name: restaurantName,
        restaurant_phone: toNullableString(item.restaurant_phone),
        restaurant_memo: toNullableString(item.restaurant_memo),
        booking_status: normalizeWorkStatus(item.restaurant_status),
        sort_order: index + 1,
      };
    });
}

export function normalizeScheduleRow(
  row: MySqlScheduleRow,
  index: number,
  masterRefs?: {
    guides: Map<string, MasterPerson | null>;
    drivers: Map<string, MasterPerson | null>;
  },
): NormalizedSchedule {
  const sourceScheduleKey = toNullableString(row.source_schedule_key);
  if (!sourceScheduleKey) {
    throw new Error("source_schedule_key 누락");
  }

  const productName = toNullableString(row.product_name);
  if (!productName) {
    throw new Error("product_name 누락");
  }

  const hotelName = toNullableString(row.hotel_name);
  const scheduleId = deterministicUuid("schedule", sourceScheduleKey);
  const tourType = normalizeTourType(row.tour_type, hotelName, productName, row.nights);
  const restaurants = parseRestaurantBookings(row, scheduleId);
  const hotelStatus = normalizeWorkStatus(row.hotel_status);
  const guide = applyMasterPerson(row.guide_name, masterRefs?.guides ?? new Map());
  const driver = applyMasterPerson(row.driver_name, masterRefs?.drivers ?? new Map());
  const hotel = tourType === "STAY" && hotelName
    ? {
        id: deterministicUuid("hotel", scheduleId),
        schedule_id: scheduleId,
        hotel_name: hotelName,
        hotel_phone: toNullableString(row.hotel_phone),
        hotel_memo: toNullableString(row.hotel_memo),
        booking_status: hotelStatus,
      }
    : null;

  const rooms = hotel
    ? [
        { hotel_booking_id: hotel.id, room_type: "DOUBLE" as const, room_count: normalizeNumber(row.room_double_count, "room_double_count") },
        { hotel_booking_id: hotel.id, room_type: "TRIPLE" as const, room_count: normalizeNumber(row.room_triple_count, "room_triple_count") },
        { hotel_booking_id: hotel.id, room_type: "QUAD" as const, room_count: normalizeNumber(row.room_quad_count, "room_quad_count") },
      ]
    : [];

  return {
    id: scheduleId,
    source_schedule_key: sourceScheduleKey,
    tour_date: normalizeDate(row.tour_date),
    tour_type: tourType,
    product_code: toNullableString(row.product_code),
    product_name: productName,
    departure_time: normalizeTimeText(row.departure_time),
    return_time: normalizeTimeText(row.return_time),
    vehicle_no: toNullableString(row.vehicle_no),
    bus_company: toNullableString(row.bus_company),
    vehicle_capacity: toNullableString(row.vehicle_capacity),
    guide_id: guide.id,
    guide_name: guide.name,
    guide_phone: guide.phone,
    driver_id: driver.id,
    driver_name: driver.name,
    driver_phone: driver.phone,
    progress_status: normalizeProgressStatus(row.progress_status),
    memo: toNullableString(row.schedule_memo),
    notice_memo: toNullableString(row.notice_memo),
    reservation_count: normalizeNumber(row.reservation_count, "reservation_count"),
    not_bus_count: normalizeNumber(row.not_bus_count, "not_bus_count"),
    sort_order: index + 1,
    is_active: true,
    restaurants,
    hotel,
    rooms,
  };
}

export function validateRows(
  rows: MySqlScheduleRow[],
  masterRefs?: {
    guides: Map<string, MasterPerson | null>;
    drivers: Map<string, MasterPerson | null>;
  },
): ValidationResult {
  const validRows: NormalizedSchedule[] = [];
  const invalidRows: ValidationResult["invalidRows"] = [];
  const rowsBySchedule = new Map<string, MySqlScheduleRow>();

  for (const row of rows) {
    const sourceScheduleKey = toNullableString(row.source_schedule_key);
    if (!sourceScheduleKey) {
      invalidRows.push({ row, reason: "source_schedule_key 누락" });
      continue;
    }

    if (!rowsBySchedule.has(sourceScheduleKey)) {
      rowsBySchedule.set(sourceScheduleKey, row);
    }
  }

  Array.from(rowsBySchedule.values()).forEach((row, index) => {
    try {
      validRows.push(normalizeScheduleRow(row, index, masterRefs));
    } catch (error) {
      invalidRows.push({
        row,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return { validRows, invalidRows };
}

async function fetchMasterRefs() {
  const [{ data: guideData, error: guideError }, { data: driverData, error: driverError }] = await Promise.all([
    supabase.from("master_guides").select("id,name,phone"),
    supabase.from("master_drivers").select("id,name,phone"),
  ]);

  if (guideError) {
    throw new Error(`master_guides 조회 실패: ${getSupabaseErrorMessage(guideError)}`);
  }

  if (driverError) {
    throw new Error(`master_drivers 조회 실패: ${getSupabaseErrorMessage(driverError)}`);
  }

  return {
    guides: createUniquePersonMap((guideData ?? []) as MasterPerson[]),
    drivers: createUniquePersonMap((driverData ?? []) as MasterPerson[]),
  };
}

export async function createImportBatch(batchId: string, fileName?: string | null) {
  const { error } = await supabase.from("import_batches").insert({
    id: batchId,
    file_name: fileName ?? null,
    status: "PROCESSING",
    total_count: 0,
    success_count: 0,
    fail_count: 0,
  });

  if (error) {
    throw new Error(`import_batches 시작 로그 저장 실패: ${getSupabaseErrorMessage(error)}`);
  }
}

export async function updateImportBatch(batchId: string, update: ImportBatchUpdate) {
  const { error } = await supabase.from("import_batches").update(update).eq("id", batchId);

  if (error) {
    throw new Error(`import_batches 상태 업데이트 실패: ${getSupabaseErrorMessage(error)}`);
  }
}

async function upsertSourceSchedules(rows: NormalizedSchedule[]) {
  const scheduleRows = rows.map((row) => ({
    id: row.id,
    source_schedule_key: row.source_schedule_key,
    tour_date: row.tour_date,
    tour_type: row.tour_type,
    product_code: row.product_code,
    product_name: row.product_name,
    departure_time: row.departure_time,
    return_time: row.return_time,
    vehicle_no: row.vehicle_no,
    bus_company: row.bus_company,
    vehicle_capacity: row.vehicle_capacity,
    guide_name: row.guide_name,
    guide_id: row.guide_id,
    guide_phone: row.guide_phone,
    driver_name: row.driver_name,
    driver_id: row.driver_id,
    driver_phone: row.driver_phone,
    progress_status: row.progress_status,
    memo: row.memo,
    notice_memo: row.notice_memo,
    reservation_count: row.reservation_count,
    not_bus_count: row.not_bus_count,
    sort_order: row.sort_order,
    is_active: row.is_active,
  }));

  for (const chunkRows of chunk(scheduleRows, config.batch.chunkSize)) {
    const { error } = await supabase
      .from("reservation_schedule_sources")
      .upsert(chunkRows, { onConflict: "source_schedule_key" });

    if (error) {
      throw new Error(`reservation_schedule_sources upsert 실패: ${getSupabaseErrorMessage(error)}`);
    }
  }
}

async function syncSourceRestaurantBookings(rows: NormalizedSchedule[]) {
  const scheduleIds = rows.map((row) => row.id);
  if (scheduleIds.length === 0) return;

  for (const ids of chunk(scheduleIds, config.batch.chunkSize)) {
    const { error } = await supabase.from("source_schedule_restaurant_bookings").delete().in("schedule_id", ids);
    if (error) {
      throw new Error(`기존 원본 식당 예약현황 삭제 실패: ${getSupabaseErrorMessage(error)}`);
    }
  }

  const restaurantRows = rows.flatMap((row) => row.restaurants);
  for (const chunkRows of chunk(restaurantRows, config.batch.chunkSize)) {
    const { error } = await supabase
      .from("source_schedule_restaurant_bookings")
      .upsert(chunkRows, { onConflict: "id" });
    if (error) {
      throw new Error(`원본 식당 예약현황 upsert 실패: ${getSupabaseErrorMessage(error)}`);
    }
  }
}

async function syncSourceHotelBookings(rows: NormalizedSchedule[]) {
  const scheduleIds = rows.map((row) => row.id);
  if (scheduleIds.length === 0) return;

  const schedulesWithoutHotel = rows
    .filter((row) => !row.hotel)
    .map((row) => row.id);

  for (const ids of chunk(schedulesWithoutHotel, config.batch.chunkSize)) {
    const { error } = await supabase.from("source_schedule_hotel_bookings").delete().in("schedule_id", ids);
    if (error) {
      throw new Error(`기존 원본 숙소 예약현황 삭제 실패: ${getSupabaseErrorMessage(error)}`);
    }
  }

  const hotelRows = rows.flatMap((row) => row.hotel ? [row.hotel] : []);
  for (const chunkRows of chunk(hotelRows, config.batch.chunkSize)) {
    const { error } = await supabase
      .from("source_schedule_hotel_bookings")
      .upsert(chunkRows, { onConflict: "id" });
    if (error) {
      throw new Error(`원본 숙소 예약현황 upsert 실패: ${getSupabaseErrorMessage(error)}`);
    }
  }

  const hotelIds = hotelRows.map((row) => row.id);
  for (const ids of chunk(hotelIds, config.batch.chunkSize)) {
    const { error } = await supabase.from("source_schedule_hotel_room_assignments").delete().in("hotel_booking_id", ids);
    if (error) {
      throw new Error(`기존 원본 객실배정 삭제 실패: ${getSupabaseErrorMessage(error)}`);
    }
  }

  const roomRows = rows.flatMap((row) => row.rooms).filter((row) => row.room_count > 0);
  for (const chunkRows of chunk(roomRows, config.batch.chunkSize)) {
    const { error } = await supabase
      .from("source_schedule_hotel_room_assignments")
      .upsert(chunkRows, { onConflict: "hotel_booking_id,room_type" });
    if (error) {
      throw new Error(`원본 객실배정 upsert 실패: ${getSupabaseErrorMessage(error)}`);
    }
  }
}

async function fetchActiveScheduleIds() {
  const ids: string[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
      const { data, error } = await supabase
      .from("reservation_schedule_sources")
      .select("id")
      .eq("is_active", true)
      .range(from, to);

    if (error) {
      throw new Error(`기존 reservation_schedule_sources 조회 실패: ${getSupabaseErrorMessage(error)}`);
    }

    if (!data || data.length === 0) break;
    ids.push(...data.map((row) => row.id as string));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return ids;
}

export async function deactivateMissingSchedules(validRows: NormalizedSchedule[]) {
  const currentIds = await fetchActiveScheduleIds();
  const importedIds = new Set(validRows.map((row) => row.id));
  const missingIds = currentIds.filter((id) => !importedIds.has(id));

  for (const ids of chunk(missingIds, config.batch.chunkSize)) {
    const { error } = await supabase
      .from("reservation_schedule_sources")
      .update({ is_active: false })
      .in("id", ids);

    if (error) {
      throw new Error(`기존 원본 일정 비활성화 실패: ${getSupabaseErrorMessage(error)}`);
    }
  }

  return missingIds.length;
}

export async function importReservationSchedules(rows: MySqlScheduleRow[], mode: SyncMode, fileName?: string | null) {
  const batchId = randomUUID();
  await createImportBatch(batchId, fileName);

  try {
    if (rows.length === 0) {
      await updateImportBatch(batchId, {
        status: "SUCCESS",
        total_count: 0,
        success_count: 0,
        fail_count: 0,
        error_message: "MySQL 일정 View 조회 결과 0건",
        finished_at: new Date().toISOString(),
      });
      return { batchId, totalCount: 0, successCount: 0, failCount: 0, deactivatedCount: 0 };
    }

    const masterRefs = await fetchMasterRefs();
    const validation = validateRows(rows, masterRefs);
    await upsertSourceSchedules(validation.validRows);
    await syncSourceRestaurantBookings(validation.validRows);
    await syncSourceHotelBookings(validation.validRows);
    const deactivatedCount = mode === "full" ? await deactivateMissingSchedules(validation.validRows) : 0;

    const status = validation.invalidRows.length > 0 ? "PARTIAL_FAILED" : "SUCCESS";
    const errorMessage = validation.invalidRows.length > 0
      ? validation.invalidRows.slice(0, 10).map((item) => item.reason).join(" | ")
      : null;

    await updateImportBatch(batchId, {
      status,
      total_count: rows.length,
      success_count: validation.validRows.length,
      fail_count: validation.invalidRows.length,
      error_message: errorMessage,
      finished_at: new Date().toISOString(),
    });

    return {
      batchId,
      totalCount: rows.length,
      successCount: validation.validRows.length,
      failCount: validation.invalidRows.length,
      deactivatedCount,
    };
  } catch (error) {
    await updateImportBatch(batchId, {
      status: "FAILED",
      error_message: error instanceof Error ? error.message : String(error),
      finished_at: new Date().toISOString(),
    });
    throw error;
  }
}
