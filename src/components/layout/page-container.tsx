import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type PageContainerProps = ComponentPropsWithoutRef<"main">;

export function PageContainer({ className, ...props }: PageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-5xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-8",
        className,
      )}
      {...props}
    />
  );
}
