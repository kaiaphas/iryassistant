import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getRoleFromEmail, type AppRole } from "@/lib/access-control";
import { authCookieNames } from "@/lib/auth-constants";

export { authCookieNames };

export function createSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY;

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

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.accessToken)?.value;
  if (!accessToken) return null;

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;

  return data.user;
}

export async function getCurrentUserRole(): Promise<AppRole> {
  const cookieStore = await cookies();
  const cookieRole = cookieStore.get(authCookieNames.role)?.value;
  if (cookieRole === "admin" || cookieRole === "staff") return cookieRole;

  const user = await getCurrentUser();
  return getRoleFromEmail(user?.email);
}
