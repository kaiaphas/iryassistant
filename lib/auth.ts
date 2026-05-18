import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { normalizeAppRole, type AppRole } from "@/lib/access-control";
import { authCookieNames, authSessionMaxAge } from "@/lib/auth-constants";
import { createSupabaseServerClient } from "@/repositories/supabase/reservation-repository";

export { authCookieNames, authSessionMaxAge };

export function createSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL 또는 SUPABASE_ANON_KEY 환경변수가 없습니다.");
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
  const member = await getCurrentMember();
  return member?.role ?? "staff";
}

export async function getCurrentMember() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_members")
    .select("id,email,role,status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !data || data.status !== "active") return null;

  return {
    id: data.id as string,
    email: data.email as string,
    role: normalizeAppRole(data.role as string | null),
  };
}

export async function isCurrentAdmin() {
  const member = await getCurrentMember();
  return member?.role === "admin";
}
