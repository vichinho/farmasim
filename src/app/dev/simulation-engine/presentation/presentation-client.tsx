"use client";

import { useState } from "react";

import { technicalSimulationCatalogs } from "@/features/simulation-engine/catalogs";
import type {
  SimulationExperienceAttemptInput,
  SimulationExperienceAttemptResult,
  SimulationExperiencePersistence,
} from "@/features/simulation-engine/experience-controller";
import type { SimulationPlayerActionInput } from "@/features/simulation-engine/integration-contract";
import type { ScenarioDefinition } from "@/features/simulation-engine/types";
import { useSimulationExperience } from "@/features/simulation-engine/use-simulation-experience";

const definition: ScenarioDefinition = {
  id: "dev-presentation-adapter-correct-attention",
  version: 1,
  type: "correct_attention",
  difficulty: "initial",
  competencyTargets: [
    "identity_verification",
    "record_review",
    "double_check_performed",
    "instructions",
  ],
  allowedRoles: ["attention"],
  allowedModes: ["practice"],
  errorCountRange: { min: 0, max: 0 },
  protocolRules: {
    continuablePrescriptionStatuses: ["pending"],
  },
};

const generation = {
  playerRole: "attention" as const,
  mode: "practice" as const,
  maxAttempts: 25,
};

let checkpointStore: string | null = null;
let checkpointWrites = 0;
let checkpointDeletes = 0;
let attemptWrites = 0;
let lastAttempt: SimulationExperienceAttemptInput | null = null;

const diagnosticPersistence: SimulationExperiencePersistence = {
  async loadLatestCheckpoint() {
    return checkpointStore;
  },
  async saveCheckpoint(serializedCheckpoint) {
    checkpointStore = serializedCheckpoint;
    checkpointWrites += 1;
  },
  async deleteCheckpoint() {
    checkpointStore = null;
    checkpointDeletes += 1;
  },
  async saveAttempt(input): Promise<SimulationExperienceAttemptResult> {
    lastAttempt = input;
    attemptWrites += 1;
    return { status: "saved", message: "Diagnostic attempt persisted in memory." };
  },
};

type DiagnosticResult = {
  contractVersion: number;
  initialSource: string;
  patientResolved: boolean;
  clinicalEvents: number;
  cleanAfterSave: boolean;
  terminalStatus: string;
  finalizationStatus: string;
  checkpointDeleted: boolean;
  criteria: number;
  correctAnswers: number;
  reinforcement: number;
  checkpointWrites: number;
  checkpointDeletes: number;
  attemptWrites: number;
  success: boolean;
  message: string;
} | null;

export function PresentationAdapterClient() {
  const experience = useSimulationExperience({
    definition,
    seed: "presentation-adapter:seed:2026-08-17",
    catalogs: technicalSimulationCatalogs,
    generation,
    scenarioSlug: "case-001-ambulatory-dispensing",
    levelNumber: 1,
    persistence: diagnosticPersistence,
  });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticResult>(null);

  async function runDiagnostic() {
    if (!experience.state || experience.phase !== "ready") return;

    setRunning(true);
    setResult(null);
    checkpointStore = null;
    checkpointWrites = 0;
    checkpointDeletes = 0;
    attemptWrites = 0;
    lastAttempt = null;

    try {
      const initial = experience.state;
      const snapshot = initial.snapshot;
      const patient = snapshot.patients.find(
        (candidate) => candidate.id === snapshot.session.patientId,
      );
      if (!patient) throw new Error("The public contract did not resolve the encounter patient.");

      const dispatch = (action: SimulationPlayerActionInput) => {
        const receipt = experience.dispatch(action);
        if (!receipt) throw new Error(`Action ${action.type} was rejected by the presentation adapter.`);
        return receipt;
      };

      dispatch({
        type: "document.requested",
        targetType: "document",
        targetId: `${patient.id}-document`,
      });
      dispatch({
        type: "document.opened",
        targetType: "document",
        targetId: `${patient.id}-document`,
      });
      dispatch({
        type: "computer.focused",
        targetType: "computer",
        targetId: "clinical-terminal",
      });
      dispatch({
        type: "rut.typed",
        targetType: "patient",
        targetId: patient.id,
        metadata: { value: patient.syntheticRut },
      });
      dispatch({
        type: "search.executed",
        targetType: "patient",
        metadata: { resultPatientId: patient.id },
      });

      for (const record of snapshot.clinicalSystem.records.filter(
        (candidate) => candidate.patientId === patient.id,
      )) {
        dispatch({
          type: "patient_record.opened",
          targetType: "record",
          targetId: record.id,
        });
      }

      for (const prescription of snapshot.clinicalSystem.prescriptions.filter(
        (candidate) => candidate.relevantForCurrentWithdrawal,
      )) {
        dispatch({
          type: "prescription.opened",
          targetType: "prescription",
          targetId: prescription.id,
        });
      }

      const clinicalEventCount = experience
        .dispatch({
          type: "computer.exited",
          targetType: "computer",
          targetId: "clinical-terminal",
        })
        ?.snapshot.session.eventCount;
      if (!clinicalEventCount) throw new Error("Clinical event sequence did not complete.");

      const saved = await experience.save();
      if (!saved) throw new Error("Presentation adapter could not save the checkpoint.");

      dispatch({ type: "tray.inspected", targetType: "tray", targetId: "tray-current" });
      for (const item of snapshot.preparation.trayItems) {
        dispatch({
          type: "medication.inspected",
          targetType: "medication",
          targetId: item.presentationId,
        });
      }
      dispatch({
        type: "identity.rechecked",
        targetType: "patient",
        targetId: patient.id,
      });
      dispatch({
        type: "instructions.given",
        targetType: "patient",
        targetId: patient.id,
      });
      const terminal = dispatch({
        type: "delivery.attempted",
        targetType: "patient",
        targetId: patient.id,
      });

      const finalized = await experience.finalize();
      if (!finalized) throw new Error("Presentation adapter could not finalize the experience.");

      const reinforcement = finalized.completion.criterionResults.filter(
        (criterion) => criterion.status === "reinforcement",
      ).length;
      const success =
        initial.source === "generated" &&
        snapshot.contractVersion === 1 &&
        saved.dirty === false &&
        terminal.snapshot.session.status === "completed" &&
        finalized.status === "saved" &&
        finalized.checkpointDeleted &&
        finalized.completion.criterionResults.length === 7 &&
        finalized.completion.correctAnswers === 7 &&
        reinforcement === 0 &&
        checkpointStore === null &&
        checkpointWrites === 2 &&
        checkpointDeletes === 1 &&
        attemptWrites === 1 &&
        lastAttempt?.attemptId === finalized.attemptId;

      setResult({
        contractVersion: snapshot.contractVersion,
        initialSource: initial.source,
        patientResolved: true,
        clinicalEvents: clinicalEventCount,
        cleanAfterSave: saved.dirty === false,
        terminalStatus: terminal.snapshot.session.status,
        finalizationStatus: finalized.status,
        checkpointDeleted: finalized.checkpointDeleted,
        criteria: finalized.completion.criterionResults.length,
        correctAnswers: finalized.completion.correctAnswers,
        reinforcement,
        checkpointWrites,
        checkpointDeletes,
        attemptWrites,
        success,
        message: success
          ? "Presentación → hook → controller → runtime → finalización validada sin escribir progreso real."
          : "El adapter de presentación terminó con una inconsistencia.",
      });
    } catch (diagnosticError) {
      setResult({
        contractVersion: experience.state?.snapshot.contractVersion ?? 0,
        initialSource: experience.state?.source ?? "unknown",
        patientResolved: false,
        clinicalEvents: 0,
        cleanAfterSave: false,
        terminalStatus: "error",
        finalizationStatus: "error",
        checkpointDeleted: false,
        criteria: 0,
        correctAnswers: 0,
        reinforcement: 0,
        checkpointWrites,
        checkpointDeletes,
        attemptWrites,
        success: false,
        message:
          diagnosticError instanceof Error ? diagnosticError.message : "Error inesperado.",
      });
    } finally {
      setRunning(false);
    }
  }

  const ready = experience.phase === "ready" && Boolean(experience.state);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">
            Presentation boundary
          </p>
          <h2 className="mt-2 text-2xl font-black">React hook → experiencia completa</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Esta prueba usa la misma API que consumiría una capa visual. La persistencia del diagnóstico vive en memoria para no escribir XP ni intentos reales.
          </p>
        </div>
        <button
          type="button"
          onClick={runDiagnostic}
          disabled={!ready || running || Boolean(result?.success)}
          className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Ejecutando..." : result?.success ? "Validado" : "Ejecutar adapter"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Hook phase" value={experience.phase} ok={ready || Boolean(result?.success)} />
        <Stat label="Contract version" value={String(experience.state?.snapshot.contractVersion ?? "-")} ok={experience.state?.snapshot.contractVersion === 1} />
        <Stat label="Source" value={experience.state?.source ?? "-"} ok={experience.state?.source === "generated"} />
        <Stat label="Paciente visible" value={experience.state?.snapshot.session.patientId ?? "-"} ok={Boolean(experience.state?.snapshot.session.patientId)} />
      </div>

      {experience.error ? (
        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">
          {experience.error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Paciente resuelto" value={result.patientResolved ? "Sí" : "No"} ok={result.patientResolved} />
            <Stat label="Runtime final" value={result.terminalStatus} ok={result.terminalStatus === "completed"} />
            <Stat label="Finalización" value={result.finalizationStatus} ok={result.finalizationStatus === "saved"} />
            <Stat label="Checkpoint cleanup" value={result.checkpointDeleted ? "deleted" : "retained"} ok={result.checkpointDeleted} />
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-sm">
            <p className={result.success ? "font-black text-emerald-300" : "font-black text-amber-300"}>
              {result.message}
            </p>
            <div className="mt-4 grid gap-2 text-slate-400 md:grid-cols-3">
              <p>Eventos clínicos: <span className="text-slate-200">{result.clinicalEvents}</span></p>
              <p>Save limpio: <span className="text-slate-200">{result.cleanAfterSave ? "Sí" : "No"}</span></p>
              <p>Criterios: <span className="text-slate-200">{result.criteria}</span></p>
              <p>Correctas: <span className="text-slate-200">{result.correctAnswers}</span></p>
              <p>Refuerzo: <span className="text-slate-200">{result.reinforcement}</span></p>
              <p>Checkpoint writes: <span className="text-slate-200">{result.checkpointWrites}</span></p>
              <p>Checkpoint deletes: <span className="text-slate-200">{result.checkpointDeletes}</span></p>
              <p>Attempt writes: <span className="text-slate-200">{result.attemptWrites}</span></p>
              <p>Contrato: <span className="text-slate-200">v{result.contractVersion}</span></p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
      <p className={ok ? "break-words text-lg font-black text-emerald-300" : "break-words text-lg font-black text-amber-300"}>
        {value}
      </p>
      <p className="mt-2 text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}
