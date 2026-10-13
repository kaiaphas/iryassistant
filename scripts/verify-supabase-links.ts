import dotenv from "dotenv";
import assert from "node:assert/strict";
import { chunkForFilter } from "../lib/supabase-batch";
import { createSupabaseServerClient, findScheduleGroupsFromSupabase } from "../repositories/supabase/reservation-repository";
import { findRefundsFromSupabase } from "../repositories/supabase/refund-repository";
import { findAdminMembersFromSupabase, findCodeItemsFromSupabase, findDriversFromSupabase, findGuidesFromSupabase, findHotelsFromSupabase, findRestaurantsFromSupabase } from "../repositories/supabase/master-repository";
import { findSettlementItemsFromSupabase } from "../repositories/supabase/settlement-repository";
import { findIntegratedSettlementRowsFromSupabase } from "../repositories/supabase/integrated-settlement-repository";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const supabase = createSupabaseServerClient();
  async function count(table: string, column?: string, ids?: string[]) {
    let total = 0;
    for (const batch of ids ? chunkForFilter(ids) : [null]) {
      let query = supabase.from(table).select("*", { count: "exact", head: true });
      if (column && batch) query = query.in(column, batch);
      const result = await query;
      assert.equal(result.error, null, `${table}: count failed`);
      assert.notEqual(result.count, null, `${table}: missing count`);
      total += result.count ?? 0;
    }
    return total;
  }
  function check(label: string, actual: number, expected: number) {
    assert.equal(actual, expected, `${label}: count mismatch`);
    console.log(`${label}: PASS (${actual})`);
  }

  const groups = await findScheduleGroupsFromSupabase();
  const overview = await supabase.from("reservation_schedule_overview").select("id", { count: "exact", head: true }).eq("is_active", true);
  assert.equal(overview.error, null);
  check("active schedules", groups.length, overview.count ?? -1);
  const ids = groups.map((group) => group.id);
  check("reservation customers", groups.reduce((n, group) => n + group.reservations.length, 0), await count("source_schedule_reservation_customers", "schedule_id", ids));
  check("restaurant bookings", groups.reduce((n, group) => n + group.restaurantBookings.length, 0), await count("schedule_restaurant_bookings", "schedule_id", ids));
  check("hotel bookings", groups.reduce((n, group) => n + (group.hotelBookings?.length ?? 0), 0), await count("schedule_hotel_bookings", "schedule_id", ids));
  const masters = [
    ["master_codes", findCodeItemsFromSupabase],
    ["admin_members", findAdminMembersFromSupabase],
    ["master_guides", findGuidesFromSupabase],
    ["master_drivers", findDriversFromSupabase],
    ["master_restaurants", findRestaurantsFromSupabase],
    ["master_hotels", findHotelsFromSupabase],
  ] as const;
  for (const [table, read] of masters) check(table, (await read()).length, await count(table));
  const refunds = await findRefundsFromSupabase();
  check("refunds", refunds.length, await count("refunds"));
  check("refund payments", refunds.reduce((n, refund) => n + (refund.payments?.length ?? 0), 0), await count("refund_payments"));
  const month = process.argv[2] ?? new Date().toISOString().slice(0, 7);
  assert.match(month, /^\d{4}-(0[1-9]|1[0-2])$/);
  for (const type of ["GUIDE", "DRIVER"] as const) {
    const rows = await findSettlementItemsFromSupabase(month, type);
    console.log(`${type} settlements: PASS (${rows.length})`);
  }
  const [year, monthNumber] = month.split("-").map(Number);
  const integrated = await findIntegratedSettlementRowsFromSupabase(year, monthNumber);
  check("integrated settlements", integrated.length, groups.filter((group) => group.tourDate.startsWith(month)).length);
}

main().catch(() => {
  console.error("Integration verification failed; inspect the failing check without logging personal data.");
  process.exitCode = 1;
});
