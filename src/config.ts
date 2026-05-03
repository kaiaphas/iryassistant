import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`환경변수 ${name} 값이 없습니다. .env 파일을 확인하세요.`);
  }
  return value;
}

function optionalNumberEnv(name: string, defaultValue: number) {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`환경변수 ${name} 값은 숫자여야 합니다.`);
  }
  return parsed;
}

export const config = {
  mysql: {
    host: requireEnv("MYSQL_HOST"),
    port: optionalNumberEnv("MYSQL_PORT", 3306),
    user: requireEnv("MYSQL_USER"),
    password: requireEnv("MYSQL_PASSWORD"),
    database: requireEnv("MYSQL_DATABASE"),
    scheduleView: process.env.MYSQL_SCHEDULE_VIEW || "reservation_schedule_sync_view",
    charset: process.env.MYSQL_CHARSET || "euckr",
    syncDateFrom: process.env.MYSQL_SYNC_DATE_FROM || "20260101",
    syncDateTo: process.env.MYSQL_SYNC_DATE_TO || "20261231",
  },
  supabase: {
    url: requireEnv("SUPABASE_URL"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  },
  batch: {
    chunkSize: optionalNumberEnv("BATCH_CHUNK_SIZE", 500),
  },
};
