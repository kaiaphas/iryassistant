import type { IntegratedSettlementRow } from "@/lib/types";
import {
  findIntegratedSettlementRowsFromSupabase,
  saveIntegratedSettlementRowToSupabase,
  syncIntegratedSettlementRowsToSupabase,
} from "@/repositories/supabase/integrated-settlement-repository";

export async function getIntegratedSettlementRows(year: number, month: number) {
  return findIntegratedSettlementRowsFromSupabase(year, month);
}

export async function saveIntegratedSettlementRow(row: IntegratedSettlementRow) {
  return saveIntegratedSettlementRowToSupabase(row);
}

export async function syncIntegratedSettlementRows(year: number, month: number) {
  return syncIntegratedSettlementRowsToSupabase(year, month);
}
