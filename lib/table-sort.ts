"use client";

import * as React from "react";
import type { SortDirection } from "@/components/common/SortableTableHead";

type SortValue = string | number | boolean | null | undefined;

function compareValues(left: SortValue, right: SortValue) {
  if (typeof left === "number" && typeof right === "number") return left - right;
  if (typeof left === "boolean" && typeof right === "boolean") return Number(left) - Number(right);
  return String(left ?? "").localeCompare(String(right ?? ""), "ko", { numeric: true });
}

export function useTableSort<T, K extends string>(
  items: T[],
  defaultKey: K,
  getValue: (item: T, key: K) => SortValue,
  defaultDirection: SortDirection = "asc",
) {
  const [sortKey, setSortKey] = React.useState<K>(defaultKey);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(defaultDirection);
  const [sortApplied, setSortApplied] = React.useState(false);

  const sortedItems = React.useMemo(() => {
    if (!sortApplied) return items;
    return [...items].sort((left, right) => {
      const result = compareValues(getValue(left, sortKey), getValue(right, sortKey));
      return sortDirection === "asc" ? result : -result;
    });
  }, [items, sortApplied, sortDirection, sortKey, getValue]);

  function toggleSort(nextKey: K) {
    if (nextKey === sortKey) {
      if (sortApplied && sortDirection === "desc") {
        setSortApplied(false);
        setSortKey(defaultKey);
        setSortDirection(defaultDirection);
        return;
      }
      setSortApplied(true);
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }
    setSortApplied(true);
    setSortKey(nextKey);
    setSortDirection("asc");
  }

  return { sortedItems, sortKey, sortDirection, sortApplied, toggleSort };
}
