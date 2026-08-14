"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import type { WorkspaceArea } from "./scene-types";

const hotspotPositions: Record<Exclude<WorkspaceArea, "service">, string> = {
  system: "bottom-[10%] left-[1.5%] h-[39%] w-[25%]",
  storage: "right-[1%] top-[18%] h-[52%] w-[15%]",
  preparation: "bottom-[5%] right-[17%] h-[27%] w-[27%]",
  verification: "bottom-[5%] right-[1.5%] h-[25%] w-[14%]",
};

export function WorkspaceHotspots({ activeArea }: { activeArea: WorkspaceArea }) {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-label="Zonas del puesto de atención" className="pointer-events-none absolute inset-0 z-40" role="group">
      {Object.entries(hotspotPositions).map(([area, position]) => {
        const active = activeArea === area;
        return (
          <motion.div
            animate={active && !reduceMotion ? { opacity: [0.55, 1, 0.55] } : { opacity: active ? 0.85 : 0 }}
            aria-label={`${area}${active ? ", zona activa" : ""}`}
            className={cn("absolute rounded-2xl border-2 border-amber-200 bg-amber-100/10 shadow-[0_0_32px_rgb(253_230_138/.72)]", position)}
            key={area}
            role="img"
            transition={{ duration: 1.5, repeat: active && !reduceMotion ? Infinity : 0 }}
          />
        );
      })}
    </div>
  );
}

export function CounterWorkspace({ activeArea }: { activeArea: WorkspaceArea }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-40 h-[35%] border-t-[7px] border-[#75472f] bg-[linear-gradient(160deg,#c68a5d_0%,#a76643_52%,#8c5337_100%)] shadow-[0_-14px_32px_rgb(19_33_60/.28)]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-3 bg-[#dfa575]" />
      <div aria-hidden="true" className="absolute inset-x-[2%] bottom-[4%] top-[18%] rounded-2xl border border-[#74442e]/50 bg-[#b97750]/72 shadow-inner" />

      <WorkspaceTool active={activeArea === "system"} className="bottom-[13%] left-[3%] h-[72%] w-[24%]" label="Sistema">
        <ClinicalTerminal />
      </WorkspaceTool>
      <WorkspaceTool active={activeArea === "service"} className="bottom-[7%] left-[29%] h-[66%] w-[25%]" label="Solicitud">
        <RequestDocument />
      </WorkspaceTool>
      <WorkspaceTool active={activeArea === "preparation"} className="bottom-[8%] right-[21%] h-[64%] w-[23%]" label="Preparación">
        <PreparationTray />
      </WorkspaceTool>
      <WorkspaceTool active={activeArea === "verification"} className="bottom-[12%] right-[3%] h-[58%] w-[15%]" label="Verificación">
        <VerificationStation />
      </WorkspaceTool>
    </div>
  );
}

function WorkspaceTool({
  active,
  children,
  className,
  label,
}: {
  active: boolean;
  children: React.ReactNode;
  className: string;
  label: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      animate={active && !reduceMotion ? { scale: 1.025, y: -4 } : { scale: 1, y: 0 }}
      aria-label={`${label}${active ? ", área activa" : ""}`}
      className={cn(
        "absolute rounded-xl border-2 bg-white/90 p-1.5 shadow-[0_7px_16px_rgb(49_29_18/.30)] transition-colors sm:p-2",
        active ? "border-amber-300 ring-4 ring-amber-300/55" : "border-white/75",
        className,
      )}
      initial={false}
      role="img"
      transition={{ duration: 0.28 }}
    >
      {children}
      <span className={cn("absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-[0.46rem] font-black tracking-wide shadow sm:text-[0.55rem]", active ? "bg-amber-300 text-amber-950" : "bg-slate-800 text-white")}>
        {label}
      </span>
    </motion.div>
  );
}

export function ClinicalTerminal() {
  return (
    <div className="relative h-full overflow-hidden rounded-lg border-[3px] border-slate-800 bg-slate-900 p-[5%]">
      <div className="h-[80%] rounded bg-[#eaf5ef] p-[6%] shadow-inner">
        <div className="flex items-center justify-between">
          <div className="h-1.5 w-1/2 rounded bg-emerald-600" />
          <div className="size-2 rounded-full bg-emerald-400" />
        </div>
        <div className="mt-[8%] grid grid-cols-2 gap-[5%]">
          {[0, 1, 2, 3].map((item) => (
            <div className="aspect-[1.5] rounded border border-slate-300 bg-white p-[8%]" key={item}>
              <div className="size-[35%] rounded-full bg-emerald-100" />
              <div className="mt-[8%] h-1 w-4/5 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-[4%] h-1.5 w-1/3 rounded bg-slate-600" />
    </div>
  );
}

export function RequestDocument() {
  return (
    <div className="h-full -rotate-2 rounded-md border border-slate-400 bg-[#fffdf2] p-[7%] shadow-md">
      <div className="flex items-center justify-between border-b border-slate-300 pb-[5%]">
        <span className="text-[0.4rem] font-black tracking-wider text-emerald-800 sm:text-[0.5rem]">SOLICITUD FICTICIA</span>
        <span className="rounded bg-emerald-50 px-1 text-[0.4rem] font-bold text-emerald-800">A-01</span>
      </div>
      <div className="mt-[9%] h-1.5 w-3/4 rounded bg-slate-300" />
      <div className="mt-[5%] h-1.5 w-full rounded bg-slate-200" />
      <div className="mt-[5%] h-1.5 w-5/6 rounded bg-slate-200" />
      <div className="mt-[10%] grid grid-cols-[1fr_auto] gap-2">
        <div className="space-y-1">
          <div className="h-1 w-full rounded bg-slate-200" />
          <div className="h-1 w-4/5 rounded bg-slate-200" />
        </div>
        <div className="size-6 rounded border border-emerald-300 bg-[repeating-linear-gradient(45deg,#d7e8df_0_2px,#fff_2px_4px)]" />
      </div>
    </div>
  );
}

export function PreparationTray() {
  return (
    <div className="relative flex h-full items-end justify-center gap-[7%] rounded-lg border-[5px] border-[#315c5a] bg-[#4f8883] p-[7%] shadow-inner">
      <div aria-hidden="true" className="absolute inset-x-[7%] top-[8%] h-1.5 rounded bg-white/40" />
      <FictionalBox color="bg-emerald-100" stripe="bg-emerald-500" />
      <FictionalBottle />
      <FictionalBox color="bg-sky-100" stripe="bg-sky-500" />
    </div>
  );
}

function FictionalBox({ color, stripe }: { color: string; stripe: string }) {
  return (
    <div className={cn("relative h-[52%] w-[30%] rounded-sm border border-slate-400 shadow", color)}>
      <div className={cn("absolute inset-x-0 top-[16%] h-[16%]", stripe)} />
      <div className="absolute bottom-[17%] left-[12%] h-1 w-3/5 rounded bg-slate-400/50" />
    </div>
  );
}

function FictionalBottle() {
  return (
    <div className="relative h-[48%] w-[18%] rounded-b-lg rounded-t-sm border border-amber-900/40 bg-amber-700 shadow">
      <div className="absolute -top-[16%] left-1/2 h-[18%] w-[72%] -translate-x-1/2 rounded-t bg-white" />
      <div className="absolute inset-x-[10%] top-[30%] h-[36%] rounded-sm bg-white/85" />
    </div>
  );
}

export function VerificationStation() {
  return (
    <div className="grid h-full place-items-center rounded-lg border-[4px] border-slate-800 bg-slate-900 p-[8%]">
      <div className="grid aspect-square w-[72%] place-items-center rounded-full border-[4px] border-emerald-300 bg-emerald-950 shadow-[0_0_18px_rgb(110_231_183/.42)]">
        <svg aria-hidden="true" className="h-1/2 w-1/2" viewBox="0 0 40 40">
          <path d="M7 21L16 30L34 10" fill="none" stroke="#6ee7b7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
        </svg>
      </div>
    </div>
  );
}

export function StorageDrawers({ active }: { active: boolean }) {
  return (
    <div aria-label={`Gavetas de productos ficticios${active ? ", área activa" : ""}`} className={cn("absolute right-[1.5%] top-[19%] z-20 h-[48%] w-[16%] rounded-xl border-4 bg-[#315c50] p-1.5 shadow-xl transition", active ? "border-amber-300 ring-4 ring-amber-300/50" : "border-emerald-950") } role="img">
      <div className="grid h-full grid-rows-5 gap-1">
        {["A", "B", "C", "D", "E"].map((label, index) => (
          <div className="relative rounded bg-[#e6e1d4] shadow-inner" key={label}>
            <span className="absolute left-[8%] top-[18%] text-[0.42rem] font-black text-slate-600 sm:text-[0.5rem]">{label}</span>
            <span className={cn("absolute right-[8%] top-[18%] size-1.5 rounded-sm", index % 2 ? "bg-amber-400" : "bg-emerald-500")} />
            <span className="absolute bottom-[17%] left-1/2 h-[16%] w-[32%] -translate-x-1/2 rounded border border-slate-600 bg-slate-400" />
          </div>
        ))}
      </div>
    </div>
  );
}
