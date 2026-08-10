import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type CardProps = ComponentPropsWithoutRef<"section">;

export function Card({ className, ...props }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_8px_30px_rgb(19_33_60/0.05)]",
        className,
      )}
      {...props}
    />
  );
}
