"use client";

import dynamic from "next/dynamic";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import {
  CONTENT_TRACEABILITY_NOTE,
  type TrainingCase,
  type TrainingStage,
} from "@/types/training-simulation";

import {
  getPatientProfile,
  type SceneFeedbackTone,
  type WorkspaceArea,
} from "./scene-types";
import { usePatientSceneState } from "./use-patient-scene-state";

const SupportMonitor3D = dynamic(
  () => import("./support-monitor-3d").then((module) => module.SupportMonitor3D),
  {
    loading: () => <div className="absolute inset-0 animate-pulse bg-emerald-100" />,
    ssr: false,
  },
);

type SafetyState = {
  activeAlert: boolean;
  interceptedErrorCount: number;
  unresolvedErrorCount: number;
};

type PharmacySceneProps = {
  caseId: string;
  context: TrainingCase["context"];
  feedbackTone: SceneFeedbackTone;
  isComplete: boolean;
  outcome: { errorReachedPatient: boolean };
  panel: React.ReactNode;
  safety: SafetyState;
  stage: TrainingStage;
  statusLabel: string;
};

const stationLabels: { id: WorkspaceArea; label: string }[] = [
  { id: "service", label: "Atención" },
  { id: "system", label: "Sistema" },
  { id: "storage", label: "Gavetas" },
  { id: "preparation", label: "Preparación" },
  { id: "verification", label: "Verificación" },
];

const areaDetails: Record<WorkspaceArea, { cue: string; title: string }> = {
  service: { cue: "Solicitud ficticia en revisión", title: "Ventanilla de atención" },
  system: { cue: "Datos ficticios listos para contrastar", title: "Consulta en sistema" },
  storage: { cue: "Selección pendiente en gavetas", title: "Área de almacenamiento" },
  preparation: { cue: "Bandeja ficticia en preparación", title: "Mesa de preparación" },
  verification: { cue: "Verificación independiente pendiente", title: "Punto de control final" },
};

export function PharmacyScene({
  caseId,
  context,
  feedbackTone,
  isComplete,
  outcome,
  panel,
  safety,
  stage,
  statusLabel,
}: PharmacySceneProps) {
  const profile = getPatientProfile(caseId);
  const scene = usePatientSceneState({ feedbackTone, isComplete, outcome, stage });
  const activeStation = stationLabels.find((station) => station.id === scene.activeWorkspace);
  const details = areaDetails[scene.activeWorkspace];

  return (
    <section aria-labelledby="pharmacy-scene-heading" className="space-y-3">
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_20px_55px_rgb(19_33_60/.10)]">
        <header className="flex flex-col gap-3 border-b border-slate-200 bg-slate-950 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.62rem] font-black tracking-[0.18em] text-emerald-300">FARMAVERSE · SIMULACIÓN GUIADA</p>
            <h2 className="mt-1 text-lg font-bold" id="pharmacy-scene-heading">Una tarea a la vez</h2>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <span className="size-2 rounded-full bg-emerald-400" />
            {statusLabel}
          </div>
        </header>

        <div className="grid xl:grid-cols-[15rem_minmax(0,1fr)_17rem]">
          <aside className="border-b border-slate-200 bg-slate-50 p-5 xl:border-b-0 xl:border-r">
            <p className="text-[0.62rem] font-black tracking-[0.14em] text-[var(--muted)]">CONTEXTO DEL CASO</p>
            <dl className="mt-4 space-y-4 text-sm">
              <ContextRow label="Hora" value={context.timeLabel} />
              <ContextRow label="Puesto" value="Ventanilla 01" />
              <ContextRow label="Turno" value={`${profile.turn} · Paciente virtual`} />
            </dl>
            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="text-[0.62rem] font-black tracking-[0.14em] text-[var(--muted)]">RECORRIDO</p>
              <ol className="mt-3 space-y-1.5" aria-label="Estaciones de la simulación">
                {stationLabels.map((station, index) => {
                  const active = station.id === scene.activeWorkspace;
                  return (
                    <li className="flex items-center gap-2 text-sm" key={station.id}>
                      <span className={cn("grid size-6 place-items-center rounded-full text-[0.7rem] font-black", active ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-500")}>
                        {index + 1}
                      </span>
                      <span className={cn("font-semibold", active ? "text-emerald-900" : "text-slate-500")}>{station.label}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>

          <main className="min-w-0 p-5 sm:p-7">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge tone="brand">{activeStation?.label ?? "Atención"}</Badge>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Tu tarea ahora</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{details.title}. {details.cue}</p>
              </div>
              <WorkspaceCue area={scene.activeWorkspace} />
            </div>
            <div className="pt-6">{panel}</div>
          </main>

          <aside className="border-t border-slate-200 bg-slate-50 p-5 xl:border-l xl:border-t-0">
            <p className="text-[0.62rem] font-black tracking-[0.14em] text-[var(--muted)]">ESTADO DE SEGURIDAD</p>
            <SafetyCard safety={safety} />
            <SupportMonitor
              area={scene.activeWorkspace}
              dialogue={scene.dialogue}
              status={scene.status}
              turn={profile.turn}
            />
          </aside>
        </div>
      </div>

      <p className="px-2 text-xs leading-5 text-[var(--muted)]">
        {CONTENT_TRACEABILITY_NOTE} Escenario y pacientes completamente ficticios; esta actividad no reemplaza protocolos ni supervisión profesional.
      </p>
    </section>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.62rem] font-black tracking-[0.12em] text-slate-500">{label.toUpperCase()}</dt>
      <dd className="mt-1 font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function SafetyCard({ safety }: { safety: SafetyState }) {
  const requiresReview = safety.activeAlert || safety.unresolvedErrorCount > 0;
  const hasInterception = safety.interceptedErrorCount > 0;
  const title = requiresReview
    ? "Revisión requerida"
    : hasInterception
      ? "Barrera aplicada"
      : "Sin alertas activas";
  const description = requiresReview
    ? "Detén el avance y completa la revisión indicada antes de continuar."
    : hasInterception
      ? "Se registró una corrección dentro de la actividad ficticia."
      : "Continúa con la tarea actual y verifica antes de avanzar.";

  return (
    <div className={cn("mt-4 rounded-2xl border p-4", requiresReview ? "border-rose-200 bg-rose-50" : hasInterception ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50")}>
      <div className="flex items-center gap-2">
        <span className={cn("size-2.5 rounded-full", requiresReview ? "bg-rose-600" : hasInterception ? "bg-amber-500" : "bg-emerald-600")} />
        <p className="text-sm font-black text-slate-900">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
    </div>
  );
}

function WorkspaceCue({ area }: { area: WorkspaceArea }) {
  const label = areaDetails[area].title;
  const shape = area === "system" ? "▣" : area === "storage" ? "▤" : area === "preparation" ? "▱" : area === "verification" ? "✓" : "▧";

  return (
    <div aria-label={label} className="grid size-16 shrink-0 place-items-center rounded-2xl border border-emerald-200 bg-emerald-50 text-3xl font-black text-emerald-800" role="img">
      {shape}
    </div>
  );
}

function SupportMonitor({
  area,
  dialogue,
  status,
  turn,
}: {
  area: WorkspaceArea;
  dialogue: string;
  status: string;
  turn: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <figure className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <figcaption className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <span className="text-[0.62rem] font-black tracking-[0.12em] text-slate-600">MONITOR DE APOYO</span>
        <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold text-emerald-700">
          <motion.span
            animate={reduceMotion ? undefined : { opacity: [0.45, 1, 0.45] }}
            className="size-2 rounded-full bg-emerald-500"
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          En vivo
        </span>
      </figcaption>

      <div aria-label={`Monitor contextual: ${status}`} className="relative aspect-[16/10] overflow-hidden bg-[#cbd9cf]" role="img">
        <SupportMonitor3D area={area} />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-slate-950/85 px-3 py-2 text-[0.62rem] font-bold text-white">
          <span>{turn} · Paciente virtual</span>
          <span>{areaDetails[area].title}</span>
        </div>
      </div>

      <p className="px-4 py-3 text-xs font-semibold leading-5 text-slate-600">{dialogue}</p>
    </figure>
  );
}
