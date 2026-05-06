import mysql from "mysql2/promise";
import iconv from "iconv-lite";
import { config } from "./config";
import type { MySqlScheduleRow } from "./types";

export async function createMySqlConnection() {
  try {
    return await mysql.createConnection({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      charset: config.mysql.charset,
      dateStrings: true,
    });
  } catch (error) {
    throw new Error(`MySQL 접속 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function buildScheduleConditionQuery(whereClause = "") {
  return `
    SELECT
      CONCAT(c.tid, '|', a.tour_date) AS source_schedule_key,
      c.tid AS product_code,
      c.shot_subject AS product_name,
      a.tour_date AS tour_date,
      c.days AS days,
      c.days2 AS nights,
      a.time1 AS departure_time,
      a.time2 AS return_time,
      a.status AS progress_status,
      a.bus_info AS bus_company,
      a.bus AS vehicle_no,
      a.bus_type AS vehicle_capacity,
      a.driver AS driver_name,
      a.guide AS guide_name,
      a.hotel AS hotel_name,
      a.hotel_status AS hotel_status,
      a.memo AS schedule_memo,
      d.memo AS notice_memo,
      CASE
        WHEN IFNULL(c.days2, 0) > 0 THEN 'STAY'
        WHEN a.hotel IS NOT NULL AND a.hotel <> '' THEN 'STAY'
        ELSE 'DAY'
      END AS tour_type,
      NULL AS restaurant_bookings_json,
      NULL AS meal_type,
      NULL AS restaurant_name,
      NULL AS restaurant_phone,
      NULL AS restaurant_memo,
      NULL AS restaurant_status,
      NULL AS hotel_phone,
      NULL AS hotel_memo,
      NULL AS room_double_count,
      NULL AS room_triple_count,
      NULL AS room_quad_count,
      a.tour_date AS updated_at
    FROM ez_condition AS a
    LEFT JOIN ez_tour AS c
      ON a.tid = c.tid
    LEFT JOIN ez_condition_memo AS d
      ON d.info_code = CONCAT(a.tid, '_', REPLACE(a.tour_date, '/', ''))
    WHERE REPLACE(a.tour_date, '/', '') BETWEEN ? AND ?
    ${whereClause}
    and a.status = '출발확정'
    ORDER BY a.tour_date ASC, c.tid ASC
  `;
}

function decodeMysqlValue(value: unknown): unknown {
  if (Buffer.isBuffer(value)) {
    return iconv.decode(value, config.mysql.charset);
  }

  return value;
}

function decodeMysqlRows(rows: mysql.RowDataPacket[]) {
  return rows.map((row) => {
    const decoded: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      decoded[key] = decodeMysqlValue(value);
    }
    return decoded as MySqlScheduleRow;
  });
}

export async function fetchReservationSchedules() {
  const connection = await createMySqlConnection();
  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      buildScheduleConditionQuery(),
      [config.mysql.syncDateFrom, config.mysql.syncDateTo],
    );
    return decodeMysqlRows(rows);
  } finally {
    await connection.end();
  }
}

export async function fetchRecentReservationSchedules(updatedSince: Date) {
  const dateText = [
    updatedSince.getFullYear(),
    String(updatedSince.getMonth() + 1).padStart(2, "0"),
    String(updatedSince.getDate()).padStart(2, "0"),
  ].join("");

  const connection = await createMySqlConnection();
  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      buildScheduleConditionQuery("AND REPLACE(a.tour_date, '/', '') >= ?"),
      [config.mysql.syncDateFrom, config.mysql.syncDateTo, dateText],
    );
    return decodeMysqlRows(rows);
  } finally {
    await connection.end();
  }
}

export const legacyReservationQuerySql = buildScheduleConditionQuery();
