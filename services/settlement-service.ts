import type { SettlementType } from "@/lib/types";
import { findSettlementItemsFromSupabase } from "@/repositories/supabase/settlement-repository";

export async function getSettlementItems(month: string, type: SettlementType) {
  return findSettlementItemsFromSupabase(month, type);
}
