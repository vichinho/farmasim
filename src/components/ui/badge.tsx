import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "brand" | "neutral" | "warning";

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  brand: "bg-emerald-100 text-emerald-800",
  neutral: "bg-slate-100 text-slate-700",
  warning: "bg-amber-100 text-amber-900",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
