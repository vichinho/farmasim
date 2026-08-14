"use client";

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
import { TrainingRoom } from "./training-room";
import { usePatientSceneState } from "./use-patient-scene-state";

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
  service: { cue: "Paciente virtual en ventanilla", title: "Ventanilla de atención" },
  system: { cue: "Registros ficticios disponibles", title: "Consulta en sistema" },
  storage: { cue: "Productos ficticios por revisar", title: "Área de almacenamiento" },
  preparation: { cue: "Bandeja de TENS 2 en el mesón", title: "Mesa de preparación" },
  verification: { cue: "Barrera previa al despacho", title: "Verificación final" },
};

export function PharmacyScene({ caseId, context, feedbackTone, isComplete, outcome, panel, safety, stage, statusLabel }: PharmacySceneProps) {
  const profile = getPatientProfile(caseId);
  const scene = usePatientSceneState({ feedbackTone, isComplete, outcome, stage });
  const activeStation = stationLabels.find((station) => station.id === scene.activeWorkspace);
  const details = areaDetails[scene.activeWorkspace];

  return (
    <section aria-labelledby="pharmacy-scene-heading" className="space-y-3">
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#edf3f0] shadow-[0_22px_55px_rgb(19_33_60/.13)]">
        <SimulationHeader statusLabel={statusLabel} />
        <div className="grid min-h-[42rem] xl:grid-cols-[15.5rem_minmax(0,1fr)_19rem]">
          <ContextRail activeWorkspace={scene.activeWorkspace} context={context} profile={profile} />
          <main className="relative min-h-[34rem] overflow-hidden bg-slate-200 xl:min-h-[42rem]">
            <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 sm:p-5">
              <div className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-emerald-800 shadow-sm backdrop-blur">{activeStation?.label ?? "Atención"}</div>
              <div className="max-w-[15rem] rounded-2xl bg-slate-950/88 px-3 py-2 text-right text-xs font-semibold leading-5 text-white shadow-lg backdrop-blur">
                <span className="block text-[0.6rem] font-black tracking-[0.12em] text-emerald-300">TAREA ACTUAL</span>
                {details.title}
              </div>
            </div>
            <TrainingRoom sceneState={scene.patientState} status={scene.status} />
            <PatientSpeech dialogue={scene.dialogue} turn={profile.turn} />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[23%] bg-[linear-gradient(180deg,transparent,rgba(19,33,60,.58))]" />
            <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/20 bg-slate-950/90 px-4 py-3 text-white backdrop-blur sm:px-5">
              <p className="text-[0.62rem] font-black tracking-[0.14em] text-emerald-300">{profile.turn} · PACIENTE VIRTUAL</p>
              <p className="mt-1 text-sm font-semibold">{scene.status}</p>
            </div>
          </main>
          <WorkspaceRail area={scene.activeWorkspace} safety={safety} stage={stage} />
        </div>
        <section aria-label="Acciones de la tarea" className="border-t border-slate-200 bg-white px-4 py-5 sm:px-6"><div className="mx-auto max-w-5xl">{panel}</div></section>
      </div>
      <p className="px-2 text-xs leading-5 text-[var(--muted)]">{CONTENT_TRACEABILITY_NOTE} Escenario, preparaciones y pacientes completamente ficticios.</p>
    </section>
  );
}

function SimulationHeader({ statusLabel }: { statusLabel: string }) {
  return <header className="flex flex-col gap-3 bg-slate-950 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[0.62rem] font-black tracking-[0.18em] text-emerald-300">FARMAVERSE · SIMULACIÓN GUIADA</p><h2 className="mt-1 text-lg font-bold" id="pharmacy-scene-heading">Una tarea a la vez</h2></div><div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><span className="size-2 rounded-full bg-emerald-400" />{statusLabel}</div></header>;
}

function ContextRail({ activeWorkspace, context, profile }: { activeWorkspace: WorkspaceArea; context: TrainingCase["context"]; profile: ReturnType<typeof getPatientProfile> }) {
  return <aside className="border-b border-slate-200 bg-slate-50 p-5 xl:border-b-0 xl:border-r"><p className="text-[0.62rem] font-black tracking-[0.14em] text-slate-500">CONTEXTO DEL CASO</p><dl className="mt-4 grid grid-cols-3 gap-4 text-sm xl:block xl:space-y-4"><ContextRow label="Hora" value={context.timeLabel} /><ContextRow label="Puesto" value="Ventanilla 01" /><ContextRow label="Turno" value={`${profile.turn} · Paciente`} /></dl><div className="mt-6 border-t border-slate-200 pt-5"><p className="text-[0.62rem] font-black tracking-[0.14em] text-slate-500">RECORRIDO</p><ol className="mt-3 grid grid-cols-2 gap-2 xl:block xl:space-y-1.5" aria-label="Estaciones de la simulación">{stationLabels.map((station, index) => { const active = station.id === activeWorkspace; return <li className="flex items-center gap-2 text-sm" key={station.id}><span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[0.7rem] font-black", active ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-500")}>{index + 1}</span><span className={cn("font-semibold", active ? "text-emerald-900" : "text-slate-500")}>{station.label}</span></li>; })}</ol></div></aside>;
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[0.62rem] font-black tracking-[0.12em] text-slate-500">{label.toUpperCase()}</dt><dd className="mt-1 font-semibold text-slate-800">{value}</dd></div>;
}

function WorkspaceRail({ area, safety, stage }: { area: WorkspaceArea; safety: SafetyState; stage: TrainingStage }) {
  const detail = areaDetails[area];
  return <aside className="border-t border-slate-200 bg-white p-5 xl:border-l xl:border-t-0"><p className="text-[0.62rem] font-black tracking-[0.14em] text-slate-500">PUESTO DE TRABAJO</p><h3 className="mt-2 text-lg font-black text-slate-950">{detail.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{detail.cue}</p><div className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">{workspaceItems(area).map((item) => <div className="flex items-start gap-3 px-4 py-3" key={item.label}><span className="mt-1 size-2 rounded-full bg-emerald-500" /><div><p className="text-sm font-bold text-slate-800">{item.label}</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{item.detail}</p></div></div>)}</div><div className="mt-5"><p className="text-[0.62rem] font-black tracking-[0.14em] text-slate-500">ESTADO DE SEGURIDAD</p><SafetyCard safety={safety} /></div><p className="mt-4 text-xs leading-5 text-slate-500">Etapa: {stage.title}</p></aside>;
}

function workspaceItems(area: WorkspaceArea) {
  const items: Record<WorkspaceArea, { detail: string; label: string }[]> = {
    service: [{ label: "Paciente virtual", detail: "Interacción de atención disponible." }, { label: "Documento ficticio", detail: "Solicita y contrasta identificación." }],
    system: [{ label: "Ficha de paciente", detail: "Consulta solo datos demostrativos." }, { label: "Tres prescripciones", detail: "Abre cada registro antes de avanzar." }],
    storage: [{ label: "Gavetas", detail: "Etiquetas y productos exclusivamente ficticios." }, { label: "Solicitud activa", detail: "Contrasta nombre y presentación." }],
    preparation: [{ label: "TENS 2 virtual", detail: "Acerca la bandeja para revisión independiente." }, { label: "Bandeja preparada", detail: "Consulta medicamento, concentración y cantidad." }],
    verification: [{ label: "Bandeja preparada", detail: "Realiza el doble chequeo antes del despacho." }, { label: "Paciente virtual", detail: "Confirma identidad antes de entregar." }],
  };
  return items[area];
}

function SafetyCard({ safety }: { safety: SafetyState }) {
  const requiresReview = safety.activeAlert || safety.unresolvedErrorCount > 0;
  const hasInterception = safety.interceptedErrorCount > 0;
  const title = requiresReview ? "Revisión requerida" : hasInterception ? "Barrera aplicada" : "Sin alertas activas";
  const description = requiresReview ? "Detén el proceso y revisa la discrepancia antes de entregar." : hasInterception ? "La actividad registró una corrección antes de la entrega." : "Continúa con la tarea actual y verifica antes de avanzar.";
  return <div className={cn("mt-3 rounded-2xl border p-4", requiresReview ? "border-rose-200 bg-rose-50" : hasInterception ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50")}><div className="flex items-center gap-2"><span className={cn("size-2.5 rounded-full", requiresReview ? "bg-rose-600" : hasInterception ? "bg-amber-500" : "bg-emerald-600")} /><p className="text-sm font-black text-slate-900">{title}</p></div><p className="mt-2 text-sm leading-6 text-slate-700">{description}</p></div>;
}

function PatientSpeech({ dialogue, turn }: { dialogue: string; turn: string }) {
  const reduceMotion = useReducedMotion();
  return <motion.div animate={reduceMotion ? undefined : { opacity: [0.94, 1, 0.94], y: [0, -2, 0] }} className="absolute bottom-[16%] left-4 z-30 max-w-[15rem] rounded-2xl rounded-bl-md border border-white/70 bg-white/95 p-3 shadow-[0_12px_32px_rgb(19_33_60/.22)] backdrop-blur sm:left-6 sm:max-w-[18rem] sm:p-4" transition={{ duration: 3.8, ease: "easeInOut", repeat: Infinity }}><p className="text-[0.58rem] font-black tracking-[0.14em] text-emerald-800">{turn} · PACIENTE VIRTUAL</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{dialogue}</p><span aria-hidden="true" className="absolute -bottom-2 left-5 size-4 rotate-45 border-b border-r border-white/70 bg-white" /></motion.div>;
}
