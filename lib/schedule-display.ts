import type { ScheduleMasterRef } from "@/lib/types";

export function formatPersonWithPhone(person: ScheduleMasterRef) {
  const name = person.name === "-" ? "" : person.name;
  const phone = person.phone ?? "";
  return [name, phone].filter(Boolean).join(" ") || "-";
}
