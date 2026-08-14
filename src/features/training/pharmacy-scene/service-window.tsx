import type { ReactNode } from "react";

export function ServiceWindow({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-[2%] top-[4%] h-[72%] overflow-hidden rounded-t-[1.8rem] border-[5px] border-b-0 border-emerald-950 bg-[#dce8dd] shadow-[inset_0_0_0_3px_rgb(255_255_255/.32),0_12px_30px_rgb(19_33_60/.18)] sm:inset-x-[3%] sm:border-[7px] sm:border-b-0">
      {children}
      <div aria-hidden="true" className="absolute inset-x-0 top-[56%] z-10 h-1 bg-emerald-950/12" />
      <div aria-hidden="true" className="absolute inset-y-0 left-[49.6%] z-10 w-1 bg-white/16" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-30 h-2 bg-emerald-950" />
    </div>
  );
}
