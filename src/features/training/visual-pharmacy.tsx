"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PROFESSIONAL_REVIEW_MARKER,
  type PharmacyArea,
  type TrainingCase,
  type TrainingStage,
} from "@/types/training-simulation";

type WorkArea = Exclude<PharmacyArea, "entrance" | "dispatch-counter">;

const workAreas: { id: WorkArea; label: string; shortLabel: string }[] = [
  { id: "service-counter", label: "Ventanilla de atención", shortLabel: "Atención" },
  { id: "clinical-terminal", label: "Terminal ficticio", shortLabel: "Sistema" },
  { id: "storage", label: "Gavetas de almacenamiento", shortLabel: "Gavetas" },
  { id: "preparation-counter", label: "Bandeja de preparación", shortLabel: "Preparación" },
];

type VisualPharmacyProps = {
  activeArea?: PharmacyArea;
  context: TrainingCase["context"];
  isComplete?: boolean;
  panel?: React.ReactNode;
  professionalReviewMarker?: string;
  stage?: TrainingStage;
  statusLabel?: string;
};

function toWorkArea(area: PharmacyArea | undefined): WorkArea {
  if (area === "clinical-terminal" || area === "storage" || area === "preparation-counter") {
    return area;
  }
  return "service-counter";
}

export function VisualPharmacy({
  activeArea,
  context,
  isComplete = false,
  panel,
  professionalReviewMarker,
  stage,
  statusLabel,
}: VisualPharmacyProps) {
  const [exploredArea, setExploredArea] = useState<WorkArea>("service-counter");
  const isControlled = Boolean(activeArea);
  const displayedArea = isControlled ? toWorkArea(activeArea) : exploredArea;
  const patientState = getPatientState(stage, isComplete);

  return (
    <section aria-labelledby="pharmacy-heading" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <ContextItem label="Hora simulada" value={context.timeLabel} />
        <ContextItem label="Puesto" value="Ventanilla 01" />
        <ContextItem label="Turno actual" value="A-01 · Paciente virtual" />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-[0_18px_50px_rgb(19_33_60/0.10)]">
        <div className="flex flex-col gap-3 border-b border-emerald-800 bg-emerald-950 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-emerald-300">
              FARMA SIM · PUESTO DE ATENCIÓN
            </p>
            <h2 className="mt-1 text-xl font-bold" id="pharmacy-heading">
              Atiende un paciente a la vez
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="size-2 animate-pulse rounded-full bg-emerald-300" />
            <p className="text-sm font-semibold text-emerald-100" aria-live="polite">
              {statusLabel ?? "Puesto disponible"}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.85fr)]">
          <div className="bg-[#d8e2d5] p-3 sm:p-5">
            <div
              aria-label="Puesto de atención de una farmacia ficticia"
              className="relative min-h-[34rem] overflow-hidden rounded-3xl border-4 border-white bg-[#c9d8c5] shadow-inner sm:min-h-[38rem]"
              role="group"
            >
              <div aria-hidden="true" className="absolute inset-0 pharmacy-wall-grid" />
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-12 border-b-4 border-emerald-950 bg-emerald-900" />
              <div className="absolute left-4 top-3 rounded-md bg-amber-300 px-3 py-1 text-[0.65rem] font-black tracking-[0.16em] text-amber-950 sm:left-6">
                VENTANILLA 01
              </div>
              <div className="absolute right-4 top-3 flex items-center gap-2 text-[0.65rem] font-black tracking-[0.12em] text-emerald-100 sm:right-6">
                <span className="size-2 rounded-full bg-emerald-300" /> EN SERVICIO
              </div>

              <WaitingRoom />

              <div className="absolute inset-x-[6%] top-[18%] h-[42%] overflow-hidden rounded-t-[1.75rem] border-[6px] border-b-0 border-emerald-950 bg-[#edf1df] shadow-[inset_0_0_0_3px_rgb(255_255_255/0.45)]">
                <div aria-hidden="true" className="absolute inset-x-0 top-[46%] h-1 bg-emerald-950/15" />
                <Patient
                  description={context.patientDescription}
                  state={patientState}
                />
                <SpeechBubble stage={stage} state={patientState} />
              </div>

              <div aria-hidden="true" className="absolute inset-x-[2%] bottom-0 h-[43%] rounded-t-3xl border-t-8 border-[#6e3f27] bg-[#a96b42] shadow-[0_-12px_30px_rgb(19_33_60/0.20)]">
                <div className="absolute inset-x-0 top-0 h-3 bg-[#d39a69]" />
                <div className="absolute inset-x-[4%] top-[18%] h-[70%] rounded-2xl border border-[#6e3f27]/30 bg-[#bf8052] shadow-inner" />
              </div>

              <DeskTool
                active={displayedArea === "clinical-terminal"}
                className="bottom-[13%] left-[5%] h-[24%] w-[26%]"
                label="Sistema"
                onClick={isControlled ? undefined : () => setExploredArea("clinical-terminal")}
              >
                <DeskTerminal />
              </DeskTool>
              <DeskTool
                active={displayedArea === "service-counter"}
                className="bottom-[8%] left-[34%] h-[25%] w-[30%]"
                label="Solicitud"
                onClick={isControlled ? undefined : () => setExploredArea("service-counter")}
              >
                <RequestDocument stage={stage} />
              </DeskTool>
              <DeskTool
                active={displayedArea === "preparation-counter"}
                className="bottom-[11%] right-[5%] h-[23%] w-[27%]"
                label="Preparación"
                onClick={isControlled ? undefined : () => setExploredArea("preparation-counter")}
              >
                <PreparationTray />
              </DeskTool>
              <DeskTool
                active={displayedArea === "storage"}
                className="right-[2%] top-[19%] h-[33%] w-[17%]"
                label="Gavetas"
                onClick={isControlled ? undefined : () => setExploredArea("storage")}
              >
                <DrawerStack />
              </DeskTool>

              <div className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/50 bg-emerald-950/90 px-4 py-2 text-center text-[0.65rem] font-black tracking-[0.12em] text-white shadow-lg">
                {patientState === "leaving" ? "ATENCIÓN FINALIZADA" : "PACIENTE EN ATENCIÓN"}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2" aria-label="Estaciones del puesto">
              {workAreas.map((area) => (
                <button
                  aria-current={displayedArea === area.id ? "step" : undefined}
                  className={cn(
                    "min-h-11 rounded-xl border px-2 text-xs font-bold transition-colors",
                    displayedArea === area.id
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-emerald-200 bg-white text-slate-600",
                    isControlled ? "cursor-default" : "hover:border-emerald-500",
                  )}
                  key={area.id}
                  onClick={isControlled ? undefined : () => setExploredArea(area.id)}
                  type="button"
                >
                  {area.shortLabel}
                </button>
              ))}
            </div>
          </div>

          <aside className="flex min-h-[32rem] flex-col border-t border-[var(--border)] p-5 lg:border-l lg:border-t-0 lg:p-6">
            {panel ?? (
              <>
                <Badge className="self-start" tone="brand">Puesto interactivo</Badge>
                <h3 className="mt-4 text-2xl font-bold">
                  {workAreas.find((area) => area.id === displayedArea)?.label}
                </h3>
                <p className="mt-3 text-base leading-7 text-[var(--muted)]">
                  El paciente, la solicitud y las herramientas cambian a medida que avanza la atención.
                </p>
                <p className="mt-auto pt-6 text-xs leading-5 text-[var(--muted)]">
                  {professionalReviewMarker ?? PROFESSIONAL_REVIEW_MARKER} Este prototipo no reemplaza protocolos ni supervisión profesional.
                </p>
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-bold tracking-[0.1em] text-[var(--muted)]">{label.toUpperCase()}</p>
      <p className="mt-1 text-sm font-semibold leading-5">{value}</p>
    </div>
  );
}

function WaitingRoom() {
  return (
    <div className="absolute left-4 top-[14%] z-10 rounded-xl border border-emerald-900/20 bg-white/80 p-2 shadow-sm sm:left-6">
      <p className="text-[0.55rem] font-black tracking-[0.12em] text-slate-500">PRÓXIMOS TURNOS</p>
      <div className="mt-2 flex gap-1.5">
        {["A-02", "A-03"].map((turn) => (
          <span className="rounded-md bg-slate-800 px-2 py-1 text-[0.6rem] font-black text-white" key={turn}>
            {turn}
          </span>
        ))}
      </div>
    </div>
  );
}

function Patient({ description, state }: { description: string; state: PatientState }) {
  return (
    <div
      aria-label={`${description} ${state === "leaving" ? "finalizando atención" : "en la ventanilla"}`}
      className={cn(
        "patient-arrival absolute bottom-0 left-1/2 z-10 h-[82%] w-36 -translate-x-1/2 transition-all duration-700 sm:w-44",
        state === "waiting" && "translate-y-8 opacity-60",
        state === "leaving" && "translate-x-[65%] opacity-40",
      )}
      role="img"
    >
      <div className="absolute left-1/2 top-[2%] size-20 -translate-x-1/2 rounded-full border-4 border-[#593b2e] bg-[#d9a477] shadow-md sm:size-24">
        <div className="absolute -inset-x-1 -top-2 h-10 rounded-t-full bg-slate-300" />
        <div className="absolute left-[25%] top-[48%] size-2 rounded-full bg-slate-800" />
        <div className="absolute right-[25%] top-[48%] size-2 rounded-full bg-slate-800" />
        <div className="absolute bottom-[17%] left-1/2 h-1.5 w-7 -translate-x-1/2 rounded-full bg-[#8f5b4e]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 top-[31%] rounded-t-[4rem] border-4 border-emerald-950 bg-amber-700 shadow-lg">
        <div className="mx-auto mt-5 h-12 w-3 rounded-full bg-amber-200/60" />
      </div>
    </div>
  );
}

type PatientState = "waiting" | "present" | "leaving";

function getPatientState(stage: TrainingStage | undefined, isComplete: boolean): PatientState {
  if (isComplete || stage?.type === "result") return "leaving";
  if (!stage || stage.type === "context") return "waiting";
  return "present";
}

function SpeechBubble({ stage, state }: { stage?: TrainingStage; state: PatientState }) {
  const copy = getSpeechCopy(stage, state);
  return (
    <div className="absolute left-[4%] top-[8%] z-20 max-w-[48%] rounded-2xl rounded-bl-sm border-2 border-slate-800 bg-white p-3 text-xs font-semibold leading-5 shadow-lg sm:text-sm">
      <span className="mb-1 block text-[0.55rem] font-black tracking-[0.12em] text-emerald-700">TURNO A-01</span>
      {copy}
    </div>
  );
}

function getSpeechCopy(stage: TrainingStage | undefined, state: PatientState) {
  if (state === "leaving") return "Gracias. La atención simulada ha terminado.";
  if (state === "waiting") return "Esperando que habilites el siguiente turno.";
  if (stage?.type === "patient-dialogue") return stage.content;
  if (stage?.type === "identification") return "Aquí están mis datos ficticios para la actividad.";
  if (stage?.type === "dispatch" || stage?.type === "final-verification") {
    return "Espero mientras realizas la verificación final.";
  }
  return "Permanezco en la ventanilla mientras completas la atención.";
}

function DeskTool({
  active,
  children,
  className,
  label,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  className: string;
  label: string;
  onClick?: () => void;
}) {
  const classes = cn(
    "absolute z-20 rounded-xl border-2 bg-white/90 p-1.5 text-left shadow-lg transition sm:p-2",
    active ? "border-amber-300 ring-4 ring-amber-300/60" : "border-white/80",
    onClick && "hover:-translate-y-1 hover:border-emerald-400 focus-visible:outline-4 focus-visible:outline-white",
    className,
  );
  const content = (
    <>
      {children}
      <span className={cn("absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-[0.55rem] font-black shadow", active ? "bg-amber-300 text-amber-950" : "bg-slate-800 text-white")}>
        {label}
      </span>
    </>
  );

  return onClick ? <button aria-label={`Explorar ${label}`} className={classes} onClick={onClick} type="button">{content}</button> : <div aria-hidden="true" className={classes}>{content}</div>;
}

function DeskTerminal() {
  return (
    <div className="relative h-full rounded-lg bg-slate-800 p-2">
      <div className="h-[72%] rounded bg-sky-50 p-1.5">
        <div className="h-1.5 w-2/3 rounded bg-emerald-500" />
        <div className="mt-1.5 h-1 w-full rounded bg-slate-200" />
        <div className="mt-1 h-1 w-4/5 rounded bg-slate-200" />
      </div>
      <div className="mx-auto mt-1 h-1.5 w-1/2 rounded bg-slate-500" />
    </div>
  );
}

function RequestDocument({ stage }: { stage?: TrainingStage }) {
  return (
    <div className="h-full -rotate-2 rounded-md border border-slate-300 bg-[#fffdf0] p-2 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-300 pb-1 text-[0.45rem] font-black text-slate-500">
        <span>SOLICITUD FICTICIA</span><span>A-01</span>
      </div>
      <div className="mt-2 h-1.5 w-3/4 rounded bg-slate-300" />
      <div className="mt-1 h-1.5 w-full rounded bg-slate-200" />
      <div className="mt-1 h-1.5 w-5/6 rounded bg-slate-200" />
      <div className="mt-3 rounded border border-emerald-300 bg-emerald-50 px-1 py-1 text-center text-[0.45rem] font-black text-emerald-800">
        {stage?.title ?? "NUEVO TURNO"}
      </div>
    </div>
  );
}

function PreparationTray() {
  return (
    <div className="relative flex h-full items-end justify-center gap-2 rounded-lg border-4 border-slate-500 bg-slate-300 p-2">
      <div className="h-[55%] w-[28%] rounded-sm bg-emerald-200 shadow" />
      <div className="h-[70%] w-[28%] rounded-sm bg-sky-200 shadow" />
      <div className="absolute inset-x-2 top-2 h-1 rounded bg-white/70" />
    </div>
  );
}

function DrawerStack() {
  return (
    <div className="grid h-full grid-rows-4 gap-1 rounded-lg bg-emerald-950 p-1.5">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="relative rounded bg-emerald-50" key={index}>
          <span className="absolute left-1 top-1/2 h-1 w-1/2 -translate-y-1/2 rounded bg-emerald-300" />
          <span className="absolute right-1 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-slate-500" />
        </div>
      ))}
    </div>
  );
}
