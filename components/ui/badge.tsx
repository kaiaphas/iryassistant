import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-transparent bg-emerald-100 text-emerald-800",
        secondary: "border-transparent bg-slate-100 text-slate-700",
        warning: "border-transparent bg-amber-100 text-amber-800",
        danger: "border-transparent bg-rose-100 text-rose-700",
        blue: "border-transparent bg-sky-100 text-sky-700",
        outline: "text-slate-700",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
