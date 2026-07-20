import { exportReservationsCsv } from "./exportCsv";
import {
  fetchRecentReservationCustomers,
  fetchRecentReservationSchedules,
  fetchReservationCustomers,
  fetchReservationSchedules,
  legacyReservationQuerySql,
  reservationCustomerQuerySql,
} from "./mysql";
import { importReservationSchedules } from "./importReservations";
import { supabase, getSupabaseErrorMessage } from "./supabase";
import type { ScheduleOverviewRow } from "./types";

function getRecentSince() {
  const since = new Date();
  since.setDate(since.getDate() - 1);
  return since;
}

async function main() {
  const command = process.argv[2] ?? "sync";

  if (command === "export:csv") {
    const rows = await fetchReservationSchedules();
    const exported = await exportReservationsCsv(rows);
    console.log(`CSV 생성 완료: ${exported.filePath} (${rows.length}건)`);
    return;
  }

  if (command === "sync") {
    const [rows, reservationCustomers] = await Promise.all([
      fetchReservationSchedules(),
      fetchReservationCustomers(),
    ]);
    const exported = await exportReservationsCsv(rows);
    const result = await importReservationSchedules(rows, "full", exported.fileName, reservationCustomers);
    console.log(
      `전체 동기화 완료: batch=${result.batchId}, total=${result.totalCount}, success=${result.successCount}, fail=${result.failCount}, inactive=${result.deactivatedCount}`,
    );
    return;
  }

  if (command === "sync:recent") {
    const since = getRecentSince();
    const [rows, reservationCustomers] = await Promise.all([
      fetchRecentReservationSchedules(since),
      fetchRecentReservationCustomers(since),
    ]);
    const result = await importReservationSchedules(rows, "recent", null, reservationCustomers);
    console.log(
      `최근 데이터 동기화 완료: since=${since.toISOString()}, batch=${result.batchId}, total=${result.totalCount}, success=${result.successCount}, fail=${result.failCount}`,
    );
    return;
  }

  if (command === "query:schedules") {
    const { data, error } = await supabase
      .from("reservation_schedule_overview")
      .select("id,source_schedule_key,tour_date,tour_type_label,product_name,departure_time,return_time,reservation_count,not_bus_count,vehicle_no,bus_company,vehicle_capacity,guide_name,driver_name,restaurant_names,hotel_name,room_assignments,progress_status_label,notice_memo")
      .eq("is_active", true)
      .order("tour_date", { ascending: true })
      .order("departure_time", { ascending: true })
      .limit(20);

    if (error) {
      throw new Error(`reservation_schedule_overview 조회 실패: ${getSupabaseErrorMessage(error)}`);
    }

    console.table((data ?? []) as ScheduleOverviewRow[]);
    return;
  }

  if (command === "print:mysql-query") {
    console.log(legacyReservationQuerySql);
    return;
  }

  if (command === "print:mysql-reservation-query") {
    console.log(reservationCustomerQuerySql);
    return;
  }

  throw new Error(`지원하지 않는 명령입니다: ${command}. sync, export:csv, sync:recent, query:schedules, print:mysql-query, print:mysql-reservation-query 중 하나를 사용하세요.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
