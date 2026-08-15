"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import type { WorkspaceArea } from "./scene-types";

export type TrayStatus =
  | "idle"
  | "preparing"
  | "ready-for-review"
  | "intercepted";

const hotspotAreas: Record<
  WorkspaceArea,
  { height: number; label: string; width: number; x: number; y: number }
> = {
  service: { height: 430, label: "Paciente y documentos", width: 450, x: 55, y: 250 },
  system: { height: 365, label: "Sistema clínico ficticio", width: 390, x: 1160, y: 165 },
  storage: { height: 275, label: "Gavetas", width: 270, x: 1370, y: 385 },
  preparation: { height: 255, label: "Bandeja de medicamentos", width: 435, x: 620, y: 570 },
  verification: { height: 220, label: "Verificación final", width: 330, x: 1040, y: 600 },
};

export function WorkspaceHotspots({
  activeArea,
}: {
  activeArea: WorkspaceArea;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      aria-label="Objetos interactivos de la ventanilla"
      className="pointer-events-none absolute inset-0 z-30 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      role="group"
      viewBox="0 0 1680 945"
    >
      <defs>
        <filter
          height="180%"
          id="pharmacy-hotspot-glow"
          width="180%"
          x="-40%"
          y="-40%"
        >
          <feGaussianBlur result="blur" stdDeviation="9" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {Object.entries(hotspotAreas).map(([area, bounds]) => {
        const active = activeArea === area;

        return (
          <motion.rect
            animate={
              active && !reduceMotion
                ? { opacity: [0.42, 0.96, 0.42] }
                : { opacity: active ? 0.8 : 0 }
            }
            fill="#bbf7d0"
            fillOpacity="0.08"
            filter="url(#pharmacy-hotspot-glow)"
            height={bounds.height}
            key={area}
            rx="28"
            stroke="#86efac"
            strokeWidth="5"
            transition={{
              duration: 1.6,
              repeat: active && !reduceMotion ? Infinity : 0,
            }}
            width={bounds.width}
            x={bounds.x}
            y={bounds.y}
          />
        );
      })}
    </svg>
  );
}

export function CounterWorkspace({
  activeArea,
  trayStatus,
}: {
  activeArea: WorkspaceArea;
  trayStatus: TrayStatus;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 h-[43%] bg-[linear-gradient(180deg,#edf6f4_0%,#d8e9e4_35%,#b8d1c9_100%)]">
      <div className="absolute inset-x-0 top-0 h-[18%] border-y-[5px] border-[#28615f] bg-[linear-gradient(90deg,#f7efe4_0%,#e8d7c1_50%,#f8eee1_100%)] shadow-[0_8px_18px_rgb(32_69_72/.22)]" />
      <div className="absolute inset-x-[4%] bottom-[7%] top-[22%] rounded-[1.5rem] border border-[#5a867e]/45 bg-[#e9f4ef]/70 shadow-[inset_0_2px_12px_rgb(49_107_102/.12)]" />

      <WorkspaceTool
        active={activeArea === "system"}
        className="bottom-[28%] right-[7%] h-[67%] w-[23%]"
        label="PC clínico"
      >
        <ClinicalTerminal />
      </WorkspaceTool>

      <WorkspaceTool
        active={activeArea === "service"}
        className="bottom-[18%] left-[28%] h-[61%] w-[16%]"
        label="Identificación"
      >
        <RequestDocument />
      </WorkspaceTool>

      <WorkspaceTool
        active={activeArea === "service"}
        className="bottom-[14%] left-[45%] h-[62%] w-[17%]"
        label="Receta"
      >
        <FictionalPrescription />
      </WorkspaceTool>

      <WorkspaceTool
        active={activeArea === "preparation"}
        className="bottom-[11%] left-[64%] h-[61%] w-[22%]"
        label="Bandeja"
      >
        <PreparationTray status={trayStatus} />
      </WorkspaceTool>

      <WorkspaceTool
        active={activeArea === "verification"}
        className="bottom-[17%] left-[7%] h-[52%] w-[14%]"
        label="Control final"
      >
        <VerificationStation />
      </WorkspaceTool>

      <Tens2Assistant
        active={activeArea === "preparation" || trayStatus === "ready-for-review"}
        trayStatus={trayStatus}
      />
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
      animate={
        active && !reduceMotion
          ? { scale: 1.025, y: -5 }
          : { scale: 1, y: 0 }
      }
      className={cn(
        "absolute rounded-2xl border-2 bg-white/80 p-2 shadow-[0_10px_20px_rgb(31_79_76/.19)] backdrop-blur-sm",
        active
          ? "border-emerald-400 ring-4 ring-emerald-300/45"
          : "border-white/90",
        className,
      )}
      initial={false}
      transition={{ duration: 0.26 }}
    >
      {children}
      <span
        className={cn(
          "absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.52rem] font-black tracking-wide shadow",
          active
            ? "bg-emerald-500 text-white"
            : "bg-slate-800 text-slate-100",
        )}
      >
        {label}
      </span>
    </motion.div>
  );
}

export function ClinicalTerminal() {
  return (
    <div className="relative h-full overflow-hidden rounded-xl border-[5px] border-slate-800 bg-slate-900 p-[5%] shadow-inner">
      <div className="h-[81%] rounded-lg bg-[#eaf7f3] p-[7%] shadow-inner">
        <div className="flex items-center justify-between border-b border-emerald-200 pb-[7%]">
          <div>
            <p className="text-[0.42rem] font-black tracking-[0.12em] text-emerald-800">
              SISTEMA FICTICIO
            </p>
            <div className="mt-1 h-1.5 w-12 rounded-full bg-emerald-500" />
          </div>
          <span className="size-2 rounded-full bg-emerald-500" />
        </div>

        <div className="mt-[8%] rounded border border-emerald-200 bg-white px-[7%] py-[6%]">
          <p className="text-[0.4rem] font-bold text-slate-500">RUT</p>
          <div className="mt-1 h-2 rounded bg-slate-200" />
        </div>

        <div className="mt-[6%] grid grid-cols-2 gap-[5%]">
          {[0, 1, 2, 3].map((item) => (
            <div
              className="aspect-[1.35] rounded border border-slate-200 bg-white p-[9%]"
              key={item}
            >
              <div className="size-[32%] rounded-full bg-emerald-100" />
              <div className="mt-[10%] h-1 w-4/5 rounded bg-slate-200" />
              <div className="mt-[8%] h-1 w-3/5 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-[4%] h-1.5 w-[32%] rounded-full bg-slate-600" />
    </div>
  );
}

export function RequestDocument() {
  return (
    <div className="h-full -rotate-3 rounded-lg border border-slate-300 bg-[#fffdf6] p-[8%] shadow-md">
      <div className="flex items-start justify-between border-b border-slate-200 pb-[7%]">
        <div>
          <p className="text-[0.42rem] font-black tracking-wide text-emerald-800">
            IDENTIFICACIÓN
          </p>
          <p className="mt-1 text-[0.34rem] font-bold text-slate-500">
            DOCUMENTO FICTICIO
          </p>
        </div>
        <div className="size-5 rounded-md bg-emerald-100" />
      </div>

      <div className="mt-[12%] flex gap-[7%]">
        <div className="size-[35%] rounded-md bg-[#d3e9df]" />
        <div className="flex-1 space-y-2">
          <div className="h-1.5 rounded bg-slate-300" />
          <div className="h-1.5 w-4/5 rounded bg-slate-200" />
          <div className="h-1.5 w-3/5 rounded bg-slate-200" />
        </div>
      </div>

      <div className="mt-[14%] h-1.5 w-full rounded bg-slate-200" />
      <div className="mt-[6%] h-1.5 w-5/6 rounded bg-slate-200" />
    </div>
  );
}

function FictionalPrescription() {
  return (
    <div className="h-full rotate-2 rounded-lg border border-slate-300 bg-white p-[8%] shadow-md">
      <div className="border-b-2 border-emerald-600 pb-[6%]">
        <p className="text-[0.42rem] font-black tracking-[0.1em] text-emerald-800">
          RECETA FICTICIA
        </p>
        <p className="mt-1 text-[0.33rem] font-bold text-slate-500">
          Prescripción de entrenamiento
        </p>
      </div>

      {[0, 1, 2].map((row) => (
        <div className="mt-[9%] flex items-center gap-2" key={row}>
          <span className="size-2 rounded-full bg-emerald-200" />
          <div className="flex-1">
            <div className="h-1.5 w-full rounded bg-slate-300" />
            <div className="mt-1 h-1 w-3/5 rounded bg-slate-200" />
          </div>
        </div>
      ))}

      <div className="mt-[12%] ml-auto h-5 w-10 rounded border border-emerald-300 bg-emerald-50" />
    </div>
  );
}

export function PreparationTray({ status }: { status: TrayStatus }) {
  const ready = status === "ready-for-review" || status === "intercepted";

  return (
    <div
      className={cn(
        "relative flex h-full items-end justify-center gap-[7%] rounded-xl border-[6px] p-[8%] shadow-inner transition-colors",
        ready
          ? "border-emerald-300 bg-[#2f706e] ring-2 ring-emerald-200"
          : "border-[#215957] bg-[#3b807b]",
      )}
    >
      <div className="absolute inset-x-[9%] top-[9%] h-1.5 rounded-full bg-white/45" />
      <FictionalBox color="bg-[#f4faf2]" stripe="bg-emerald-500" />
      <FictionalBottle />
      <FictionalBox color="bg-[#eff7ff]" stripe="bg-sky-500" />

      <span className="absolute bottom-[6%] left-1/2 -translate-x-1/2 text-[0.38rem] font-black tracking-wide text-white/80">
        PREPARACIÓN FICTICIA
      </span>
    </div>
  );
}

function Tens2Assistant({
  active,
  trayStatus,
}: {
  active: boolean;
  trayStatus: TrayStatus;
}) {
  const reduceMotion = useReducedMotion();
  const delivering = trayStatus === "ready-for-review";

  return (
    <motion.div
      animate={
        active && !reduceMotion
          ? { opacity: 1, x: delivering ? -12 : 0 }
          : { opacity: 0.78, x: 0 }
      }
      className="absolute bottom-[31%] right-[1%] z-10 h-[83%] w-[14%]"
      initial={false}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute bottom-0 left-1/2 h-[63%] w-[54%] -translate-x-1/2 rounded-t-[46%] bg-[#d9edf0] shadow-[0_8px_14px_rgb(19_63_66/.2)]" />
      <div className="absolute bottom-[56%] left-1/2 size-[30%] -translate-x-1/2 rounded-full bg-[#b77455]" />
      <div className="absolute bottom-[66%] left-1/2 h-[14%] w-[37%] -translate-x-1/2 rounded-t-full bg-[#2e3036]" />
      <div className="absolute bottom-[35%] left-[11%] h-[8%] w-[50%] -rotate-[18deg] rounded-full bg-[#b77455]" />
      <div className="absolute bottom-[28%] left-[1%] h-[14%] w-[51%] rounded-md border-2 border-[#215957] bg-[#3b807b] shadow-md" />

      <span className="absolute bottom-[2%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900 px-2 py-1 text-[0.48rem] font-black tracking-wide text-white">
        TENS 2
      </span>
    </motion.div>
  );
}

function FictionalBox({
  color,
  stripe,
}: {
  color: string;
  stripe: string;
}) {
  return (
    <div
      className={cn(
        "relative h-[52%] w-[30%] rounded border border-slate-400 shadow",
        color,
      )}
    >
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
    <div className="grid h-full place-items-center rounded-xl border-[5px] border-[#28615f] bg-[#e7f6ef] p-[8%]">
      <div className="grid aspect-square w-[72%] place-items-center rounded-full border-[4px] border-emerald-300 bg-emerald-700 shadow-[0_0_18px_rgb(52_211_153/.38)]">
        <svg aria-hidden="true" className="h-1/2 w-1/2" viewBox="0 0 40 40">
          <path
            d="M7 21L16 30L34 10"
            fill="none"
            stroke="#ecfdf5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="6"
          />
        </svg>
      </div>
    </div>
  );
}

export function StorageDrawers({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "absolute right-[1.5%] top-[20%] z-10 h-[39%] w-[15%] rounded-2xl border-4 bg-[#34726b] p-2 shadow-xl transition",
        active
          ? "border-emerald-300 ring-4 ring-emerald-200/60"
          : "border-[#225853]",
      )}
    >
      <div className="grid h-full grid-rows-5 gap-1.5">
        {["A", "B", "C", "D", "E"].map((label, index) => (
          <div className="relative rounded-lg bg-[#f4f0e7] shadow-inner" key={label}>
            <span className="absolute left-[8%] top-[18%] text-[0.45rem] font-black text-slate-600">
              {label}
            </span>
            <span
              className={cn(
                "absolute right-[8%] top-[18%] size-1.5 rounded-sm",
                index % 2 ? "bg-amber-400" : "bg-emerald-500",
              )}
            />
            <span className="absolute bottom-[17%] left-1/2 h-[16%] w-[32%] -translate-x-1/2 rounded border border-slate-500 bg-slate-400" />
          </div>
        ))}
      </div>
    </div>
  );
}