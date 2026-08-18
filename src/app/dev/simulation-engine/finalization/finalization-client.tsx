"use client";

import { useState } from "react";

import { technicalSimulationCatalogs } from "@/features/simulation-engine/catalogs";
import {
  SimulationExperienceController,
  type SimulationExperienceAttemptInput,
  type SimulationExperiencePersistence,
} from "@/features/simulation-engine/experience-controller";
import type { ScenarioDefinition } from "@/features/simulation-engine/types";

const definition: ScenarioDefinition = {
  id: "dev-finalization-correct-attention",
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

type DiagnosticResult = {
  finalRuntimeStatus: string;
  dirtyBeforeFinalize: boolean;
  firstFinalizeStatus: string;
  checkpointRetainedAfterFailure: boolean;
  retryFinalizeStatus: string;
  sameAttemptId: boolean;
  checkpointDeletedAfterSuccess: boolean;
  criterionCount: number;
  correctAnswers: number;
  incorrectAnswers: number;
  attemptSaveCalls: number;
  checkpointSaveCalls: number;
  message: string;
} | null;

function completeHappyPath(controller: SimulationExperienceController) {
  const initial = controller.state().snapshot;
  const patient = initial.patients[0];
  if (!patient) throw new Error("Generated finalization diagnostic has no patient.");

  controller.dispatch({
    type: "document.requested",
    targetType: "document",
    targetId: `${patient.id}:document`,
  });
  controller.dispatch({
    type: "document.opened",
    targetType: "document",
    targetId: `${patient.id}:document`,
  });
  controller.dispatch({
    type: "computer.focused",
    targetType: "computer",
    targetId: "clinical-terminal",
  });
  controller.dispatch({
    type: "rut.typed",
    targetType: "patient",
    targetId: patient.id,
    metadata: { value: patient.syntheticRut },
  });
  controller.dispatch({
    type: "search.executed",
    targetType: "patient",
    metadata: { resultPatientId: patient.id },
  });

  for (const record of initial.clinicalSystem.records.filter(
    (item) => item.patientId === patient.id,
  )) {
    controller.dispatch({
      type: "patient_record.opened",
      targetType: "record",
      targetId: record.id,
    });
  }

  for (const prescription of initial.clinicalSystem.prescriptions.filter(
    (item) => item.relevantForCurrentWithdrawal,
  )) {
    controller.dispatch({
      type: "prescription.opened",
      targetType: "prescription",
      targetId: prescription.id,
    });
  }

  controller.dispatch({
    type: "computer.exited",
    targetType: "computer",
    targetId: "clinical-terminal",
  });
  controller.dispatch({
    type: "tray.inspected",
    targetType: "tray",
    targetId: "current-tray",
  });

  for (const item of initial.preparation.trayItems) {
    controller.dispatch({
      type: "medication.inspected",
      targetType: "medication",
      targetId: item.presentationId,
    });
  }

  controller.dispatch({
    type: "identity.rechecked",
    targetType: "patient",
    targetId: patient.id,
  });
  controller.dispatch({
    type: "instructions.given",
    targetType: "patient",
    targetId: patient.id,
  });
  controller.dispatch({
    type: "delivery.attempted",
    targetType: "patient",
    targetId: patient.id,
  });
}

export function FinalizationClient() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticResult>(null);

  async function runDiagnostic() {
    setRunning(true);
    setResult(null);

    try {
      let storedCheckpoint: string | null = null;
      let failAttemptPersistence = true;
      let attemptSaveCalls = 0;
      let checkpointSaveCalls = 0;
      let latestAttempt: SimulationExperienceAttemptInput | null = null;

      const persistence: SimulationExperiencePersistence = {
        async loadLatestCheckpoint() {
          return storedCheckpoint;
        },
        async saveCheckpoint(serializedCheckpoint) {
          checkpointSaveCalls += 1;
          storedCheckpoint = serializedCheckpoint;
        },
        async deleteCheckpoint() {
          storedCheckpoint = null;
        },
        async saveAttempt(input) {
          attemptSaveCalls += 1;
          latestAttempt = input;
          if (failAttemptPersistence) {
            return {
              status: "error" as const,
              message: "Fallo diagnóstico simulado al guardar progreso.",
            };
          }
          return {
            status: "saved" as const,
            message: "Intento diagnóstico aceptado.",
          };
        },
      };

      const controller = await SimulationExperienceController.open({
        definition,
        seed: "dev-finalization-seed",
        catalogs: technicalSimulationCatalogs,
        generation: { playerRole: "attention", mode: "practice" },
        persistence,
      });

      completeHappyPath(controller);
      const completedState = controller.state();
      const dirtyBeforeFinalize = completedState.dirty;

      const firstFinalize = await controller.finalize({
        scenarioSlug: "case-001-ambulatory-dispensing",
        levelNumber: 1,
      });
      const checkpointRetainedAfterFailure = storedCheckpoint !== null;

      failAttemptPersistence = false;
      const retryFinalize = await controller.finalize({
        scenarioSlug: "case-001-ambulatory-dispensing",
        levelNumber: 1,
      });
      const checkpointDeletedAfterSuccess = storedCheckpoint === null;
      const persistedAttempt = latestAttempt as SimulationExperienceAttemptInput | null;

      const ok =
        completedState.snapshot.session.status === "completed" &&
        dirtyBeforeFinalize &&
        firstFinalize.status === "error" &&
        checkpointRetainedAfterFailure &&
        retryFinalize.status === "saved" &&
        firstFinalize.attemptId === retryFinalize.attemptId &&
        checkpointDeletedAfterSuccess &&
        persistedAttempt?.criterionResults.length === 7 &&
        persistedAttempt.correctAnswers === 7 &&
        persistedAttempt.incorrectAnswers === 0 &&
        attemptSaveCalls === 2 &&
        checkpointSaveCalls === 1;

      setResult({
        finalRuntimeStatus: completedState.snapshot.session.status,
        dirtyBeforeFinalize,
        firstFinalizeStatus: firstFinalize.status,
        checkpointRetainedAfterFailure,
        retryFinalizeStatus: retryFinalize.status,
        sameAttemptId: firstFinalize.attemptId === retryFinalize.attemptId,
        checkpointDeletedAfterSuccess,
        criterionCount: persistedAttempt?.criterionResults.length ?? 0,
        correctAnswers: persistedAttempt?.correctAnswers ?? 0,
        incorrectAnswers: persistedAttempt?.incorrectAnswers ?? 0,
        attemptSaveCalls,
        checkpointSaveCalls,
        message: ok
          ? "Finalización transaccional validada sin escribir progreso real."
          : "La finalización terminó con una inconsistencia.",
      });
    } catch (error) {
      setResult({
        finalRuntimeStatus: "error",
        dirtyBeforeFinalize: false,
        firstFinalizeStatus: "error",
        checkpointRetainedAfterFailure: false,
        retryFinalizeStatus: "error",
        sameAttemptId: false,
        checkpointDeletedAfterSuccess: false,
        criterionCount: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        attemptSaveCalls: 0,
        checkpointSaveCalls: 0,
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setRunning(false);
    }
  }

  const ok = Boolean(
    result &&
      result.finalRuntimeStatus === "completed" &&
      result.dirtyBeforeFinalize &&
      result.firstFinalizeStatus === "error" &&
      result.checkpointRetainedAfterFailure &&
      result.retryFinalizeStatus === "saved" &&
      result.sameAttemptId &&
      result.checkpointDeletedAfterSuccess &&
      result.criterionCount === 7 &&
      result.correctAnswers === 7 &&
      result.incorrectAnswers === 0 &&
      result.attemptSaveCalls === 2 &&
      result.checkpointSaveCalls === 1,
  );

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">
            Finalization transaction
          </p>
          <h2 className="mt-2 text-2xl font-black">
            completed → terminal checkpoint → progress → cleanup
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            La prueba simula un fallo del guardado de progreso y comprueba que el checkpoint terminal sobreviva. No escribe XP ni simulation_attempts reales.
          </p>
        </div>

        <button
          type="button"
          onClick={runDiagnostic}
          disabled={running}
          className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Ejecutando..." : "Ejecutar finalización"}
        </button>
      </div>

      {result ? (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Stat label="Runtime final" value={result.finalRuntimeStatus} ok={result.finalRuntimeStatus === "completed"} />
            <Stat label="Dirty antes" value={result.dirtyBeforeFinalize ? "Sí" : "No"} ok={result.dirtyBeforeFinalize} />
            <Stat label="1º guardado progreso" value={result.firstFinalizeStatus} ok={result.firstFinalizeStatus === "error"} />
            <Stat label="Checkpoint retenido" value={result.checkpointRetainedAfterFailure ? "Sí" : "No"} ok={result.checkpointRetainedAfterFailure} />
            <Stat label="Reintento progreso" value={result.retryFinalizeStatus} ok={result.retryFinalizeStatus === "saved"} />
            <Stat label="Mismo attemptId" value={result.sameAttemptId ? "Sí" : "No"} ok={result.sameAttemptId} />
            <Stat label="Cleanup final" value={result.checkpointDeletedAfterSuccess ? "deleted" : "retained"} ok={result.checkpointDeletedAfterSuccess} />
            <Stat label="Criterios persistibles" value={String(result.criterionCount)} ok={result.criterionCount === 7} />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-sm">
            <p className={ok ? "font-black text-emerald-300" : "font-black text-amber-300"}>
              {result.message}
            </p>
            <div className="mt-3 grid gap-2 text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
              <p>Correctas: <span className="text-slate-200">{result.correctAnswers}</span></p>
              <p>Refuerzo: <span className="text-slate-200">{result.incorrectAnswers}</span></p>
              <p>Intentos de persistencia: <span className="text-slate-200">{result.attemptSaveCalls}</span></p>
              <p>Checkpoints escritos: <span className="text-slate-200">{result.checkpointSaveCalls}</span></p>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function Stat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
      <p className={ok ? "text-xl font-black text-emerald-300" : "text-xl font-black text-amber-300"}>
        {value}
      </p>
      <p className="mt-2 text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}
