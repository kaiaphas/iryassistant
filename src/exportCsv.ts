import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { stringify } from "csv-stringify/sync";
import type { MySqlScheduleRow } from "./types";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function createTimestamp(date = new Date()) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "_",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

export async function exportReservationsCsv(rows: MySqlScheduleRow[]) {
  await mkdir("exports", { recursive: true });
  const fileName = `reservation_schedules_${createTimestamp()}.csv`;
  const filePath = path.join("exports", fileName);

  const csv = stringify(rows, {
    header: true,
    bom: true,
    columns: [
      "source_schedule_key",
      "product_code",
      "product_name",
      "tour_date",
      "days",
      "nights",
      "tour_type",
      "departure_time",
      "return_time",
      "progress_status",
      "vehicle_no",
      "bus_company",
      "vehicle_capacity",
      "driver_name",
      "guide_name",
      "hotel_name",
      "hotel_status",
      "schedule_memo",
      "notice_memo",
      "updated_at",
    ],
    cast: {
      string(value) {
        return value;
      },
    },
  });

  await writeFile(filePath, csv, "utf8");
  return { fileName, filePath };
}
