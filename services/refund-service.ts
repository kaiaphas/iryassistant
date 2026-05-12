import { findRefundsFromSupabase } from "@/repositories/supabase/refund-repository";

export async function getRefunds() {
  return findRefundsFromSupabase();
}
