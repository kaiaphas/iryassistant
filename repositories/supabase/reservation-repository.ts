import { createClient } from "@supabase/supabase-js";
import type { FacilityBookingStatus, HotelBooking, RestaurantBooking, ScheduleGroup } from "@/lib/types";

type ReservationScheduleOverviewRow = {
  id: string;
  source_schedule_key: string | null;
  tour_date: string;
  tour_type_label: "당일" | "숙박" | null;
  product_code: string | null;
  product_name: string | null;
  reservation_count: number | null;
  not_bus_count: number | null;
  departure_time: string | null;
  return_time: string | null;
  vehicle_no: string | null;
  bus_company: string | null;
  vehicle_capacity: string | null;
  guide_id: string | null;
  guide_name: string | null;
  guide_phone: string | null;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  restaurant_names: string | null;
  restaurant_status_labels: string[] | null;
  restaurant_bookings?: RestaurantBooking[];
  hotel_name: string | null;
  hotel_phone?: string | null;
  hotel_memo?: string | null;
  hotel_status_label: FacilityBookingStatus | null;
  hotel_provisional_status_label?: FacilityBookingStatus | null;
  room_assignments: string | null;
  progress_status_label: string | null;
  memo: string | null;
  notice_memo: string | null;
};

type RestaurantBookingRow = {
  id: string;
  schedule_id: string;
  meal_type: "BREAKFAST" | "LUNCH" | "DINNER";
  restaurant_name: string;
  restaurant_phone: string | null;
  restaurant_memo: string | null;
  booking_status: "BEFORE" | "COMPLETED" | "CANCELED";
  sort_order: number;
};

type HotelBookingRow = {
  id: string;
  schedule_id: string;
  hotel_name: string;
  hotel_phone: string | null;
  hotel_memo: string | null;
  provisional_booking_status?: "BEFORE" | "COMPLETED" | "CANCELED" | null;
  provisional_double_room_count?: number | null;
  provisional_triple_room_count?: number | null;
  provisional_quad_room_count?: number | null;
  booking_status: "BEFORE" | "COMPLETED" | "CANCELED";
  sort_order?: number | null;
};

type HotelRoomAssignmentRow = {
  hotel_booking_id: string;
  room_type: "DOUBLE" | "TRIPLE" | "QUAD";
  room_count: number;
};

type SourceScheduleVehicleRow = {
  id: string;
  source_schedule_key: string | null;
  departure_time: string | null;
  vehicle_no: string | null;
  bus_company: string | null;
  vehicle_capacity: string | null;
};

const overviewSelectWithContacts =
  "id,source_schedule_key,tour_date,tour_type_label,product_code,product_name,reservation_count,not_bus_count,departure_time,return_time,vehicle_no,bus_company,vehicle_capacity,guide_id,guide_name,guide_phone,driver_id,driver_name,driver_phone,restaurant_names,restaurant_status_labels,hotel_name,hotel_status_label,room_assignments,progress_status_label,memo,notice_memo";

const overviewSelectWithoutNotBusCount =
  "id,source_schedule_key,tour_date,tour_type_label,product_code,product_name,reservation_count,departure_time,return_time,vehicle_no,bus_company,vehicle_capacity,guide_id,guide_name,guide_phone,driver_id,driver_name,driver_phone,restaurant_names,restaurant_status_labels,hotel_name,hotel_status_label,room_assignments,progress_status_label,memo,notice_memo";

const overviewSelectFallback =
  "id,source_schedule_key,tour_date,tour_type_label,product_code,product_name,departure_time,return_time,vehicle_no,vehicle_capacity,guide_name,driver_name,restaurant_names,restaurant_status_labels,hotel_name,hotel_status_label,room_assignments,progress_status_label,memo,notice_memo";

export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getDayLabel(date: string) {
  const labels = ["일", "월", "화", "수", "목", "금", "토"];
  const [year, month, dayOfMonth] = date.split(/[-/]/).map(Number);
  if (!year || !month || !dayOfMonth) return "";
  const day = new Date(Date.UTC(year, month - 1, dayOfMonth)).getUTCDay();
  return labels[day] ?? "";
}

function parseRoomAssignments(value: string | null) {
  const rooms = { double: 0, triple: 0, quadruple: 0 };
  if (!value || value === "-") return rooms;

  for (const part of value.split(",")) {
    const match = part.trim().match(/(2|3|4)인실\s*x\s*(\d+)/);
    if (!match) continue;

    const count = Number(match[2]);
    if (match[1] === "2") rooms.double = count;
    if (match[1] === "3") rooms.triple = count;
    if (match[1] === "4") rooms.quadruple = count;
  }

  return rooms;
}

function normalizeFacilityStatus(value: string | null | undefined): FacilityBookingStatus {
  if (value === "예약완료" || value === "예약취소") return value;
  if (value === "COMPLETED") return "예약완료";
  if (value === "CANCELED") return "예약취소";
  return "예약전";
}

function parseRestaurantBookings(row: ReservationScheduleOverviewRow): RestaurantBooking[] {
  if (row.restaurant_bookings) return row.restaurant_bookings;
  if (!row.restaurant_names || row.restaurant_names === "-") return [];

  const statuses = row.restaurant_status_labels ?? [];
  return row.restaurant_names.split(" / ").map((item, index) => {
    const [mealType, name] = item.split(" · ");
    const normalizedMealType = mealType?.trim();
    return {
      id: `${row.id}-restaurant-${index + 1}`,
      name: name?.trim() || item.trim(),
      mealType: normalizedMealType === "조식" || normalizedMealType === "BREAKFAST" ? "조식" : normalizedMealType === "석식" || normalizedMealType === "DINNER" ? "석식" : "중식",
      status: normalizeFacilityStatus(statuses[index]),
      phone: "",
      memo: "",
    };
  });
}

function mapRestaurantRow(row: RestaurantBookingRow): RestaurantBooking {
  return {
    id: row.id,
    name: row.restaurant_name,
    phone: row.restaurant_phone ?? "",
    memo: row.restaurant_memo ?? "",
    mealType: row.meal_type === "BREAKFAST" ? "조식" : row.meal_type === "DINNER" ? "석식" : "중식",
    status: normalizeFacilityStatus(row.booking_status),
  };
}

function mapHotelRow(row: HotelBookingRow, roomAssignments: HotelRoomAssignmentRow[]): HotelBooking {
  const rooms = { double: 0, triple: 0, quadruple: 0 };
  for (const assignment of roomAssignments) {
    if (assignment.room_type === "DOUBLE") rooms.double = assignment.room_count;
    if (assignment.room_type === "TRIPLE") rooms.triple = assignment.room_count;
    if (assignment.room_type === "QUAD") rooms.quadruple = assignment.room_count;
  }

  return {
    id: row.id,
    name: row.hotel_name,
    phone: row.hotel_phone ?? "",
    provisionalRooms: {
      double: row.provisional_double_room_count ?? 0,
      triple: row.provisional_triple_room_count ?? 0,
      quadruple: row.provisional_quad_room_count ?? 0,
    },
    rooms,
    provisionalStatus: normalizeFacilityStatus(row.provisional_booking_status),
    status: normalizeFacilityStatus(row.booking_status),
  };
}

function mapOverviewRow(row: ReservationScheduleOverviewRow): ScheduleGroup {
  const productName = row.product_name ?? "상품명 미정";
  const tourDate = row.tour_date;
  const vehicleLabel = row.vehicle_capacity || "";

  return {
    id: row.id,
    sourceScheduleKey: row.source_schedule_key ?? undefined,
    tourType: row.tour_type_label === "숙박" ? "숙박" : "당일",
    tourDate,
    dayLabel: getDayLabel(tourDate),
    productCode: row.product_code ?? row.source_schedule_key ?? row.id,
    productName,
    reservationCount: row.reservation_count ?? 0,
    notBusCount: row.not_bus_count ?? 0,
    departureTime: row.departure_time ?? "-",
    returnTime: row.return_time ?? "-",
    busNo: row.vehicle_no ?? "",
    vehicle: {
      busInfo: row.vehicle_no ?? "",
      busType: vehicleLabel,
      busCompany: row.bus_company ?? "",
      seatCount: Number.parseInt(vehicleLabel, 10) || 0,
    },
    guide: { id: row.guide_id ?? undefined, name: row.guide_name ?? "-", phone: row.guide_phone ?? undefined },
    driver: { id: row.driver_id ?? undefined, name: row.driver_name ?? "-", phone: row.driver_phone ?? undefined },
    restaurant: { name: row.restaurant_names ?? "-" },
    hotel: row.hotel_name ? { name: row.hotel_name } : undefined,
    restaurantBookings: parseRestaurantBookings(row),
    hotelBooking: {
      id: undefined,
      name: row.hotel_name ?? "",
      phone: row.hotel_phone ?? "",
      provisionalRooms: { double: 0, triple: 0, quadruple: 0 },
      rooms: parseRoomAssignments(row.room_assignments),
      provisionalStatus: normalizeFacilityStatus(row.hotel_provisional_status_label),
      status: normalizeFacilityStatus(row.hotel_status_label),
    },
    progressStatus: row.progress_status_label ?? "진행중",
    reservations: [],
    dispatchMemo: row.memo || row.notice_memo || "",
  };
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function needsLegacyOverviewFallback(message: string | undefined) {
  return Boolean(
    message?.includes("bus_company")
    || message?.includes("guide_id")
    || message?.includes("guide_phone")
    || message?.includes("driver_id")
    || message?.includes("driver_phone")
    || message?.includes("reservation_count")
    || message?.includes("not_bus_count"),
  );
}

function getErrorMessage(error: unknown) {
  if (!error) return "알 수 없는 오류";
  if (error instanceof Error) return error.message;
  if (typeof error !== "object") return String(error);

  const record = error as Record<string, unknown>;
  const parts = [record.message, record.details, record.hint, record.code]
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  return parts.length > 0 ? parts.join(" / ") : JSON.stringify(record);
}

function getSourceFallbackValue(current: string | null | undefined, source: string | null | undefined) {
  const normalizedCurrent = current?.trim();
  const normalizedSource = source?.trim();
  if ((!normalizedCurrent || normalizedCurrent === "-") && normalizedSource && normalizedSource !== "-") {
    return source ?? null;
  }
  return current ?? null;
}

async function fetchOverviewRows(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  select: string,
  withFallbackColumns: boolean,
) {
  const rows: ReservationScheduleOverviewRow[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("reservation_schedule_overview")
      .select(select)
      .eq("is_active", true)
      .order("tour_date", { ascending: true })
      .order("vehicle_no", { ascending: true, nullsFirst: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    const page = ((data ?? []) as Partial<ReservationScheduleOverviewRow>[]).map((row) => ({
      ...row,
      bus_company: withFallbackColumns ? row.bus_company : null,
      guide_id: withFallbackColumns ? row.guide_id : null,
      guide_phone: withFallbackColumns ? row.guide_phone : null,
      driver_id: withFallbackColumns ? row.driver_id : null,
      driver_phone: withFallbackColumns ? row.driver_phone : null,
    })) as ReservationScheduleOverviewRow[];

    rows.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function applySourceOperationFields(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  rows: ReservationScheduleOverviewRow[],
) {
  const sourceVehicleRows: SourceScheduleVehicleRow[] = [];

  for (const ids of chunk(rows.map((row) => row.id), 1000)) {
    const { data, error } = await supabase
      .from("reservation_schedule_sources")
      .select("id,source_schedule_key,departure_time,vehicle_no,bus_company,vehicle_capacity")
      .in("id", ids);

    if (error) {
      throw new Error(`원본 차량번호 조회 실패: ${error.message}`);
    }

    sourceVehicleRows.push(...((data ?? []) as SourceScheduleVehicleRow[]));
  }

  const sourceById = new Map(sourceVehicleRows.map((row) => [row.id, row]));
  const sourceBySourceKey = new Map(sourceVehicleRows.map((row) => [row.source_schedule_key, row]));

  return rows.map((row) => ({
    ...row,
    departure_time: getSourceFallbackValue(row.departure_time, sourceById.get(row.id)?.departure_time ?? sourceBySourceKey.get(row.source_schedule_key)?.departure_time),
    vehicle_no: sourceById.get(row.id)?.vehicle_no ?? sourceBySourceKey.get(row.source_schedule_key)?.vehicle_no ?? row.vehicle_no,
    bus_company: getSourceFallbackValue(row.bus_company, sourceById.get(row.id)?.bus_company ?? sourceBySourceKey.get(row.source_schedule_key)?.bus_company),
    vehicle_capacity: getSourceFallbackValue(row.vehicle_capacity, sourceById.get(row.id)?.vehicle_capacity ?? sourceBySourceKey.get(row.source_schedule_key)?.vehicle_capacity),
  }));
}

export async function findScheduleGroupsFromSupabase() {
  const supabase = createSupabaseServerClient();

  let rows: ReservationScheduleOverviewRow[];
  try {
    rows = await fetchOverviewRows(supabase, overviewSelectWithContacts, true);
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.includes("not_bus_count")) {
      try {
        rows = await fetchOverviewRows(supabase, overviewSelectWithoutNotBusCount, true);
      } catch (notBusFallbackError) {
        const notBusFallbackMessage = getErrorMessage(notBusFallbackError);
        if (!needsLegacyOverviewFallback(notBusFallbackMessage)) {
          throw new Error(`예약현황 Supabase 조회 실패: ${notBusFallbackMessage}`);
        }

        try {
          rows = await fetchOverviewRows(supabase, overviewSelectFallback, false);
        } catch (fallbackError) {
          const fallbackMessage = getErrorMessage(fallbackError);
          throw new Error(`예약현황 Supabase 조회 실패: ${fallbackMessage}`);
        }
      }
    } else if (!needsLegacyOverviewFallback(message)) {
      throw new Error(`예약현황 Supabase 조회 실패: ${message}`);
    } else {
      try {
        rows = await fetchOverviewRows(supabase, overviewSelectFallback, false);
      } catch (fallbackError) {
        const fallbackMessage = getErrorMessage(fallbackError);
        throw new Error(`예약현황 Supabase 조회 실패: ${fallbackMessage}`);
      }
    }
  }

  const scheduleIds = rows.map((row) => row.id);

  if (scheduleIds.length === 0) return [];

  rows = await applySourceOperationFields(supabase, rows);

  const restaurantRows: RestaurantBookingRow[] = [];
  const hotelRows: HotelBookingRow[] = [];
  const hotelRoomRows: HotelRoomAssignmentRow[] = [];
  const detailLookupChunkSize = 100;

  for (const ids of chunk(scheduleIds, detailLookupChunkSize)) {
    const [{ data: restaurantData, error: restaurantError }, hotelResult] = await Promise.all([
      supabase
        .from("schedule_restaurant_bookings")
        .select("id,schedule_id,meal_type,restaurant_name,restaurant_phone,restaurant_memo,booking_status,sort_order")
        .in("schedule_id", ids)
        .order("sort_order", { ascending: true }),
      supabase
        .from("schedule_hotel_bookings")
        .select("id,schedule_id,hotel_name,hotel_phone,hotel_memo,provisional_booking_status,provisional_double_room_count,provisional_triple_room_count,provisional_quad_room_count,booking_status,sort_order")
        .in("schedule_id", ids)
        .order("sort_order", { ascending: true }),
    ]);
    let hotelData = hotelResult.data;
    let hotelError = hotelResult.error;

    if (hotelError?.message?.includes("provisional_")) {
      const fallback = await supabase
        .from("schedule_hotel_bookings")
        .select("id,schedule_id,hotel_name,hotel_phone,hotel_memo,booking_status")
        .in("schedule_id", ids);
      hotelData = (fallback.data ?? []).map((row, index) => ({
        ...row,
        provisional_booking_status: null,
        provisional_double_room_count: null,
        provisional_triple_room_count: null,
        provisional_quad_room_count: null,
        sort_order: index + 1,
      }));
      hotelError = fallback.error;
    }

    if (hotelError?.message?.includes("sort_order")) {
      const fallback = await supabase
        .from("schedule_hotel_bookings")
        .select("id,schedule_id,hotel_name,hotel_phone,hotel_memo,provisional_booking_status,provisional_double_room_count,provisional_triple_room_count,provisional_quad_room_count,booking_status")
        .in("schedule_id", ids);
      hotelData = (fallback.data ?? []).map((row, index) => ({ ...row, sort_order: index + 1 }));
      hotelError = fallback.error;
    }

    if (restaurantError) {
      throw new Error(`식당 예약현황 Supabase 조회 실패: ${restaurantError.message}`);
    }

    if (hotelError) {
      throw new Error(`숙소 예약현황 Supabase 조회 실패: ${hotelError.message}`);
    }

    restaurantRows.push(...((restaurantData ?? []) as RestaurantBookingRow[]));
    hotelRows.push(...((hotelData ?? []) as HotelBookingRow[]));
  }

  for (const hotelIds of chunk(hotelRows.map((row) => row.id), detailLookupChunkSize)) {
    if (hotelIds.length === 0) continue;
    const { data, error } = await supabase
      .from("schedule_hotel_room_assignments")
      .select("hotel_booking_id,room_type,room_count")
      .in("hotel_booking_id", hotelIds);

    if (error) {
      throw new Error(`숙소 객실 배정 Supabase 조회 실패: ${error.message}`);
    }

    hotelRoomRows.push(...((data ?? []) as HotelRoomAssignmentRow[]));
  }

  const restaurantsBySchedule = new Map<string, RestaurantBooking[]>();
  for (const row of restaurantRows) {
    const items = restaurantsBySchedule.get(row.schedule_id) ?? [];
    items.push(mapRestaurantRow(row));
    restaurantsBySchedule.set(row.schedule_id, items);
  }

  const roomAssignmentsByHotel = new Map<string, HotelRoomAssignmentRow[]>();
  for (const row of hotelRoomRows) {
    const items = roomAssignmentsByHotel.get(row.hotel_booking_id) ?? [];
    items.push(row);
    roomAssignmentsByHotel.set(row.hotel_booking_id, items);
  }

  const hotelsBySchedule = new Map<string, HotelBooking[]>();
  for (const row of hotelRows) {
    const items = hotelsBySchedule.get(row.schedule_id) ?? [];
    items.push(mapHotelRow(row, roomAssignmentsByHotel.get(row.id) ?? []));
    hotelsBySchedule.set(row.schedule_id, items);
  }

  return rows.map((row) => {
    const hotels = hotelsBySchedule.get(row.id) ?? [];
    const hotel = hotels[0];
    const schedule = mapOverviewRow({
      ...row,
      restaurant_bookings: restaurantsBySchedule.get(row.id),
      hotel_name: hotel?.name ?? row.hotel_name,
      hotel_phone: hotel?.phone ?? row.hotel_phone,
      hotel_memo: row.hotel_memo,
      hotel_provisional_status_label: hotel?.provisionalStatus,
      hotel_status_label: hotel?.status ?? row.hotel_status_label,
    });
    if (!hotel) return schedule;
    return {
      ...schedule,
      hotelBooking: hotel,
      hotelBookings: hotels,
    };
  });
}
