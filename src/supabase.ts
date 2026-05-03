import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

export const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function getSupabaseErrorMessage(error: unknown) {
  if (!error) return "알 수 없는 Supabase 오류";
  if (typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return String(error);
}
