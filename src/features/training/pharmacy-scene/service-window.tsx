import type { ReactNode } from "react";

export function ServiceWindow({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#dce8dd]">
      {children}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 ring-1 ring-inset ring-white/30" />
    </div>
  );
}
