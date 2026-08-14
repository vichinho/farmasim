"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PROFESSIONAL_REVIEW_MARKER,
  type TrainingCase,
  type TrainingStage,
} from "@/types/training-simulation";

import { WorkspaceHotspots } from "./counter-workspace";
import { PatientActor } from "./patient-actor";
import { PatientDialogue } from "./patient-dialogue";
import { getPatientProfile, type SceneFeedbackTone, type WorkspaceArea } from "./scene-types";
import { ServiceWindow } from "./service-window";
import { usePatientSceneState } from "./use-patient-scene-state";

type PharmacySceneProps = {
  caseId: string;
  context: TrainingCase["context"];
  feedbackTone: SceneFeedbackTone;
  isComplete: boolean;
  outcome: { errorReachedPatient: boolean };
  panel: React.ReactNode;
  professionalReviewMarker?: string;
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

export function PharmacyScene({
  caseId,
  context,
  feedbackTone,
  isComplete,
  outcome,
  panel,
  professionalReviewMarker,
  stage,
  statusLabel,
}: PharmacySceneProps) {
  const profile = getPatientProfile(caseId);
  const scene = usePatientSceneState({ feedbackTone, isComplete, outcome, stage });

  return (
    <section aria-labelledby="pharmacy-scene-heading" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <ContextItem label="Hora simulada" value={context.timeLabel} />
        <ContextItem label="Puesto" value="Ventanilla 01" />
        <ContextItem label="Turno actual" value={`${profile.turn} · Paciente virtual`} />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-emerald-900/20 bg-white shadow-[0_20px_55px_rgb(19_33_60/.12)]">
        <header className="flex flex-col gap-3 border-b border-emerald-900 bg-emerald-950 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl border border-emerald-500/40 bg-emerald-900 shadow-inner">
              <PharmacyMark />
            </span>
            <div>
              <p className="text-[0.65rem] font-black tracking-[0.2em] text-emerald-300">FARMA SIM · EXPERIENCIA INTERACTIVA</p>
              <h2 className="mt-0.5 text-xl font-bold" id="pharmacy-scene-heading">Puesto de atención</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-900 px-3 py-1.5 font-semibold text-emerald-100">
              <span className="size-2 rounded-full bg-emerald-300" />
              {scene.status}
            </span>
            <span className="font-semibold text-emerald-100">{statusLabel}</span>
          </div>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1.58fr)_minmax(20rem,0.82fr)]">
          <div className="bg-[#d7e1d8] p-3 sm:p-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] border-4 border-white bg-[#cbd9cf] shadow-inner sm:aspect-[16/10] xl:aspect-video">
              <ServiceWindow>
                <Image
                  alt="Farmacia virtual vista desde el puesto de atención, con sala de espera, turnero y equipamiento clínico ficticio"
                  className="object-cover object-center"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 68vw"
                  src="/scenes/pharmacy-counter-v2.png"
                />
                <PatientActor profile={profile} state={scene.patientState} />
                <PatientDialogue dialogue={scene.dialogue} profile={profile} state={scene.patientState} />
              </ServiceWindow>
              <WorkspaceHotspots activeArea={scene.activeWorkspace} />
            </div>

            <div aria-label="Progreso por estaciones del puesto" className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-5" role="list">
              {stationLabels.map((station) => {
                const active = scene.activeWorkspace === station.id;
                return (
                  <div
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "min-h-11 rounded-xl border px-1.5 py-2 text-center text-[0.58rem] font-black tracking-wide sm:text-xs",
                      active
                        ? "border-emerald-800 bg-emerald-800 text-white shadow-sm"
                        : "border-emerald-200 bg-white text-slate-500",
                    )}
                    key={station.id}
                    role="listitem"
                  >
                    {station.label}
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="flex min-h-[34rem] flex-col border-t border-[var(--border)] bg-[#fbfcfa] p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div>
                <p className="text-[0.6rem] font-black tracking-[0.14em] text-[var(--muted)]">PACIENTE EN ATENCIÓN</p>
                <p className="mt-1 text-sm font-bold">{profile.turn} · Solicitud ficticia</p>
              </div>
              <Badge tone="brand">{scene.status}</Badge>
            </div>
            {panel}
          </aside>
        </div>
      </div>

      <p className="px-2 text-xs leading-5 text-[var(--muted)]">
        {professionalReviewMarker ?? PROFESSIONAL_REVIEW_MARKER} Escenario y pacientes completamente ficticios; esta actividad no reemplaza protocolos ni supervisión profesional.
      </p>
    </section>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3.5 shadow-[0_4px_14px_rgb(19_33_60/.03)]">
      <p className="text-[0.62rem] font-black tracking-[0.12em] text-[var(--muted)]">{label.toUpperCase()}</p>
      <p className="mt-1 text-sm font-bold leading-5">{value}</p>
    </div>
  );
}

function PharmacyMark() {
  return (
    <svg aria-hidden="true" className="size-7" viewBox="0 0 32 32">
      <path d="M5 7H27V25H5V7Z" fill="none" stroke="white" strokeLinejoin="round" strokeWidth="2.5" />
      <path d="M16 11V21M11 16H21" stroke="#6ee7b7" strokeLinecap="round" strokeWidth="3" />
      <path d="M10 4H22" stroke="white" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  );
}
