"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CONTENT_TRACEABILITY_NOTE,
  type TrainingCase,
  type TrainingStage,
} from "@/types/training-simulation";
import { motion, useReducedMotion } from "motion/react";

import {
  getPatientProfile,
  type SceneFeedbackTone,
  type WorkspaceArea,
} from "./scene-types";
import {
  CounterWorkspace,
  StorageDrawers,
  type TrayStatus,
  WorkspaceHotspots,
} from "./counter-workspace";
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

const areaDetails: Record<
  WorkspaceArea,
  { cue: string; title: string }
> = {
  service: {
    cue: "Interactúa con el paciente y revisa los documentos ficticios sobre el mesón.",
    title: "Atención en ventanilla",
  },
  system: {
    cue: "Consulta los datos ficticios disponibles antes de continuar.",
    title: "Sistema clínico",
  },
  storage: {
    cue: "Ubica y revisa el área de almacenamiento ficticia.",
    title: "Gavetas de farmacia",
  },
  preparation: {
    cue: "Revisa la bandeja preparada antes de avanzar al despacho.",
    title: "Bandeja de medicamentos",
  },
  verification: {
    cue: "Aplica el último control antes de finalizar la atención.",
    title: "Verificación final",
  },
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
  const scene = usePatientSceneState({
    feedbackTone,
    isComplete,
    outcome,
    stage,
  });
  const details = areaDetails[scene.activeWorkspace];
  const trayStatus = getTrayStatus(scene.activeWorkspace, safety);
  const reduceMotion = useReducedMotion();

  return (
    <section aria-labelledby="pharmacy-scene-heading" className="space-y-4">
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_22px_55px_rgb(18_53_59/.12)]">
        <header className="flex flex-col gap-3 border-b border-slate-200 bg-slate-950 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.62rem] font-black tracking-[0.18em] text-emerald-300">
              FARMASIM · SIMULACIÓN DE VENTANILLA
            </p>
            <h2 className="mt-1 text-lg font-bold" id="pharmacy-scene-heading">
              Farmacia ambulatoria · Ventanilla 01
            </h2>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <span className="size-2 rounded-full bg-emerald-400" />
            {context.timeLabel} · {statusLabel}
          </div>
        </header>

        <div className="p-3 sm:p-5">
          <div className="relative isolate aspect-[16/10] min-h-[34rem] overflow-hidden rounded-[1.5rem] border border-emerald-900/15 bg-[linear-gradient(180deg,#dff1ef_0%,#cce3dd_48%,#a9cbc2_100%)] shadow-inner sm:min-h-[39rem]">
            <PharmacyBackground />

            <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 sm:p-5">
              <div className="max-w-md rounded-2xl border border-white/60 bg-white/85 px-4 py-3 shadow-lg backdrop-blur-sm">
                <Badge tone="brand">{details.title}</Badge>
                <p className="mt-2 text-sm font-semibold leading-5 text-slate-700">
                  {details.cue}
                </p>
              </div>

              <div className="hidden rounded-2xl border border-white/60 bg-white/85 px-4 py-3 text-right shadow-lg backdrop-blur-sm sm:block">
                <p className="text-[0.58rem] font-black tracking-[0.14em] text-slate-500">
                  TURNO
                </p>
                <p className="mt-1 text-sm font-black text-emerald-900">
                  {profile.turn} · Paciente virtual
                </p>
              </div>
            </div>

            <VirtualPatient
              accent={profile.accent}
              coat={profile.coat}
              dialogue={scene.dialogue}
              hair={profile.hair}
              skin={profile.skin}
              state={scene.patientState}
              shirt={profile.shirt}
            />

            <StorageDrawers active={scene.activeWorkspace === "storage"} />
            <CounterWorkspace
              activeArea={scene.activeWorkspace}
              trayStatus={trayStatus}
            />
            <WorkspaceHotspots activeArea={scene.activeWorkspace} />

            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : { opacity: [0.68, 1, 0.68], y: [0, -2, 0] }
              }
              className="absolute bottom-[4%] left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/70 bg-slate-950/85 px-4 py-2 text-center text-xs font-bold text-white shadow-lg"
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              {scene.status}
            </motion.div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
          {panel}
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p className="leading-5">
            {CONTENT_TRACEABILITY_NOTE} Escenario, sistema, documentos y
            medicamentos completamente ficticios.
          </p>

          <SafetyCard safety={safety} />
        </footer>
      </div>
    </section>
  );
}

function getTrayStatus(
  area: WorkspaceArea,
  safety: SafetyState,
): TrayStatus {
  if (safety.activeAlert || safety.unresolvedErrorCount > 0) {
    return "intercepted";
  }

  if (area === "preparation" || area === "verification") {
    return "ready-for-review";
  }

  if (area === "storage") {
    return "preparing";
  }

  return "idle";
}

function PharmacyBackground() {
  return (
    <>
      <div className="absolute inset-x-0 top-0 h-[42%] bg-[linear-gradient(110deg,#eff9f8_0%,#d7eeea_48%,#c2ddd7_100%)]" />
      <div className="absolute left-[4%] top-[17%] h-[16%] w-[26%] rounded-2xl border border-emerald-900/10 bg-white/55 shadow-sm">
        <div className="absolute inset-x-[8%] top-[18%] h-2 rounded-full bg-emerald-200" />
        <div className="absolute inset-x-[8%] top-[38%] h-2 rounded-full bg-slate-200" />
        <div className="absolute inset-x-[8%] top-[58%] h-2 w-3/4 rounded-full bg-slate-200" />
      </div>

      <div className="absolute left-[35%] top-[13%] h-[23%] w-[23%] rounded-[1.4rem] border-[9px] border-[#28615f] bg-[#eaf6f1] shadow-[0_10px_18px_rgb(30_83_78/.18)]">
        <div className="absolute inset-[12%] rounded-xl border border-emerald-200 bg-white">
          <div className="absolute left-[10%] top-[13%] h-2 w-[52%] rounded-full bg-emerald-300" />
          <div className="absolute left-[10%] top-[30%] h-2 w-[70%] rounded-full bg-slate-200" />
          <div className="absolute left-[10%] top-[47%] h-2 w-[62%] rounded-full bg-slate-200" />
          <div className="absolute left-[10%] top-[65%] h-2 w-[43%] rounded-full bg-slate-100" />
        </div>
      </div>

      <div className="absolute right-[6%] top-[14%] h-[15%] w-[20%] rounded-2xl border border-emerald-900/10 bg-white/45 p-4">
        <div className="flex h-full items-end gap-2">
          {[30, 56, 42, 70, 50].map((height, index) => (
            <div
              className="flex-1 rounded-t bg-emerald-200/80"
              key={index}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[43%] h-[8%] bg-[#b7d5cc]/65" />
    </>
  );
}

function VirtualPatient({
  accent,
  coat,
  dialogue,
  hair,
  shirt,
  skin,
  state,
}: {
  accent: string;
  coat: string;
  dialogue: string;
  hair: string;
  shirt: string;
  skin: string;
  state: string;
}) {
  const reduceMotion = useReducedMotion();
  const speaking = state === "speaking" || state === "handing-document";
  const handingDocument = state === "handing-document";

  return (
    <motion.div
      animate={
        reduceMotion
          ? undefined
          : state === "entering" || state === "approaching"
            ? { opacity: 1, x: 0 }
            : { opacity: 1, x: 0, y: [0, -3, 0] }
      }
      className="absolute bottom-[39%] left-[7%] z-10 h-[41%] w-[23%]"
      initial={{ opacity: 0, x: -50 }}
      transition={{
        duration: state === "entering" || state === "approaching" ? 0.65 : 2.5,
        repeat:
          reduceMotion || state === "entering" || state === "approaching"
            ? 0
            : Infinity,
      }}
    >
      <motion.div
        animate={
          reduceMotion || !speaking
            ? undefined
            : { opacity: [0.92, 1, 0.92], y: [0, -2, 0] }
        }
        className="absolute -top-[8%] left-[35%] z-20 max-w-[15rem] rounded-2xl rounded-bl-sm border border-white bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-700 shadow-lg"
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {dialogue}
      </motion.div>

      <div
        className="absolute bottom-0 left-1/2 h-[62%] w-[48%] -translate-x-1/2 rounded-t-[48%] shadow-[0_10px_18px_rgb(33_77_75/.2)]"
        style={{ backgroundColor: coat }}
      />
      <div
        className="absolute bottom-[56%] left-1/2 size-[29%] -translate-x-1/2 rounded-full"
        style={{ backgroundColor: skin }}
      />
      <div
        className="absolute bottom-[67%] left-1/2 h-[14%] w-[36%] -translate-x-1/2 rounded-t-[100%]"
        style={{ backgroundColor: hair }}
      />
      <div
        className="absolute bottom-[37%] left-[18%] h-[11%] w-[44%] -rotate-[17deg] rounded-full"
        style={{ backgroundColor: skin }}
      />
      <div
        className="absolute bottom-[25%] left-[3%] h-[19%] w-[30%] rounded-md border-2 border-white/70 shadow-md"
        style={{ backgroundColor: accent }}
      />
      <div
        className="absolute bottom-[39%] left-[33%] h-[18%] w-[31%] rounded-b-full"
        style={{ backgroundColor: shirt }}
      />

      {handingDocument ? (
        <motion.div
          animate={reduceMotion ? undefined : { x: [0, 18, 0] }}
          className="absolute bottom-[31%] left-[2%] h-[18%] w-[22%] rotate-[-12deg] rounded border border-slate-300 bg-[#fffdf7] shadow-md"
          transition={{ duration: 1.1, repeat: Infinity }}
        >
          <div className="mx-auto mt-[19%] h-1 w-3/5 rounded bg-emerald-300" />
          <div className="mx-auto mt-[12%] h-1 w-4/5 rounded bg-slate-200" />
        </motion.div>
      ) : null}
    </motion.div>
  );
}

function SafetyCard({ safety }: { safety: SafetyState }) {
  const requiresReview =
    safety.activeAlert || safety.unresolvedErrorCount > 0;
  const hasInterception = safety.interceptedErrorCount > 0;

  const title = requiresReview
    ? "Revisión requerida"
    : hasInterception
      ? "Barrera aplicada"
      : "Sin alertas activas";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-bold",
        requiresReview
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : hasInterception
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          requiresReview
            ? "bg-rose-500"
            : hasInterception
              ? "bg-amber-500"
              : "bg-emerald-500",
        )}
      />
      {title}
    </div>
  );
}