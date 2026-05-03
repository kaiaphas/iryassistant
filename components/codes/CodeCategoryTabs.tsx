"use client";

import { codeCategories } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";

export function CodeCategoryTabs({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <>
      <div className="hidden w-64 shrink-0 space-y-2 lg:block">
        {codeCategories.map((category) => {
          const Icon = category.icon;
          const active = value === category.group;
          return (
            <button
              key={category.group}
              onClick={() => onChange(category.group)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm font-medium shadow-soft",
                active ? "border-emerald-700 text-emerald-800" : "text-slate-600 hover:bg-emerald-50",
              )}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </button>
          );
        })}
      </div>
      <div className="lg:hidden">
        <Select value={value} onChange={(event) => onChange(event.target.value)}>
          {codeCategories.map((category) => (
            <option key={category.group} value={category.group}>{category.label}</option>
          ))}
        </Select>
      </div>
    </>
  );
}
