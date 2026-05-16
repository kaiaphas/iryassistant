import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
  {
    variants: {
      variant: {
        default: "bg-emerald-700 text-white ring-1 ring-emerald-800/20 hover:bg-emerald-800 hover:shadow-md",
        outline: "border border-slate-300 bg-white text-slate-800 hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-900 hover:shadow-md",
        ghost: "shadow-none hover:bg-emerald-50 hover:text-emerald-900",
        secondary: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200 hover:bg-emerald-200 hover:shadow-md",
      },
      size: {
        default: "h-9 px-3.5 py-1.5",
        sm: "h-7 px-2.5 text-xs",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button type="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
