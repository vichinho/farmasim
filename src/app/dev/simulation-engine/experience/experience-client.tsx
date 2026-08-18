"use client";

import { useState } from "react";

import {
  deleteSimulationCheckpointFromCloud,
  loadLatestSimulationCheckpointFromCloud,
  saveSimulationCheckpointToCloud,
} from "@/features/simulation-engine/checkpoint-actions";
import { technicalSimulationCatalogs } from "@/features/simulation-engine/catalogs";
import { SimulationExperienceController } from "@/features/simulation-engine/experience-controller";
import { minimumScenarioFixtures } from "@/features/simulation-engine/fixtures/minimum-scenarios";

const baseFixture = minimumScenarioFixtures.find((item) => item.id === "A");
if (!baseFixture) throw new Error("Minimum scenario A is required for experience diagnostics.");

const definition = {
  ...baseFixture.definition,
  id: "dev-experience-controller-correct-attention",
};

const persistence = {
  async loadLatestCheckpoint(scenarioDefinitionId: string) {
    const result = await loadLatestSimulationCheckpointFromCloud(scenarioDefinitionId);
    if (result.status === "missing") return null;
    if (result.status === "loaded" && result.serializedCheckpoint) {
      return result.serializedCheckpoint;
    }
    throw new Error(result.message);
  },
  async saveCheckpoint(serializedCheckpoint: string) {
    const result = await saveSimulationCheckpointToCloud(serializedCheckpoint);
    if (result.status !== "saved") throw new Error(result.message);
  },
  async deleteCheckpoint(sessionId: string) {
    const result = await deleteSimulationCheckpointFromCloud(sessionId);
    if (result.status !== "deleted") throw new Error(result.message);
  },
};

type DiagnosticResult = {
  firstSource: string;
  dirtyAfterAction: boolean;
  cleanAfterSave: boolean;
  secondSource: string;
  sameSession: boolean;
  seedPreserved: boolean;
  eventLogPreserved: boolean;
  dirtyAfterResumeAction: boolean;
  cleanAfterSecondSave: boolean;
  discarded: boolean;
  sessionId: string;
  eventCountAfterResume: number;
  message: string;
} | null;

export function ExperienceControllerClient() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticResult>(null);

  async function cleanupStaleCheckpoint() {
    const stale = await loadLatestSimulationCheckpointFromCloud(definition.id);
    if (stale.status === "loaded" && stale.sessionId) {
      await deleteSimulationCheckpointFromCloud(stale.sessionId);
    }
  }

  async function runDiagnostic() {
    setRunning(true);
    setResult(null);

    try {
      await cleanupStaleCheckpoint();

      const first = await SimulationExperienceController.open({
        definition,
        seed: "experience-controller-alpha",
        catalogs: technicalSimulationCatalogs,
        generation: { playerRole: "attention", mode: "practice" },
        persistence,
      });
      const firstInitial = first.state();

      first.dispatch({
        type: "computer.focused",
        targetType: "computer",
        targetId: "clinical-terminal",
      });
      const dirtyAfterAction = first.state().dirty;
      const firstSaved = await first.save();
      const cleanAfterSave = !firstSaved.dirty;

      const second = await SimulationExperienceController.open({
        definition,
        seed: "experience-controller-beta",
        catalogs: technicalSimulationCatalogs,
        generation: { playerRole: "attention", mode: "practice" },
        persistence,
      });
      const resumed = second.state();
      const patient = resumed.snapshot.patients[0];
      if (!patient) throw new Error("Resumed experience does not expose a patient.");

      const sameSession = resumed.sessionId === firstInitial.sessionId;
      const seedPreserved = resumed.seed === firstInitial.seed;
      const eventLogPreserved = resumed.snapshot.session.eventCount === 1;

      second.dispatch({
        type: "rut.typed",
        targetType: "patient",
        targetId: patient.id,
        metadata: { value: patient.syntheticRut },
      });
      const dirtyAfterResumeAction = second.state().dirty;
      const secondSaved = await second.save();
      const cleanAfterSecondSave = !secondSaved.dirty;
      await second.discard();

      const afterDiscard = await loadLatestSimulationCheckpointFromCloud(definition.id);
      const discarded = afterDiscard.status === "missing";

      const ok =
        firstInitial.source === "generated" &&
        dirtyAfterAction &&
        cleanAfterSave &&
        resumed.source === "resumed" &&
        sameSession &&
        seedPreserved &&
        eventLogPreserved &&
        dirtyAfterResumeAction &&
        cleanAfterSecondSave &&
        discarded;

      setResult({
        firstSource: firstInitial.source,
        dirtyAfterAction,
        cleanAfterSave,
        secondSource: resumed.source,
        sameSession,
        seedPreserved,
        eventLogPreserved,
        dirtyAfterResumeAction,
        cleanAfterSecondSave,
        discarded,
        sessionId: resumed.sessionId,
        eventCountAfterResume: resumed.snapshot.session.eventCount,
        message: ok
          ? "Experience Controller completado correctamente."
          : "Experience Controller terminó con una inconsistencia.",
      });
    } catch (error) {
      setResult({
        firstSource: "error",
        dirtyAfterAction: false,
        cleanAfterSave: false,
        secondSource: "error",
        sameSession: false,
        seedPreserved: false,
        eventLogPreserved: false,
        dirtyAfterResumeAction: false,
        cleanAfterSecondSave: false,
        discarded: false,
        sessionId: "unknown",
        eventCountAfterResume: 0,
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setRunning(false);
    }
  }

  const ok = Boolean(result && result.message === "Experience Controller completado correctamente.");

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">
            Playable contract
          </p>
          <h2 className="mt-2 text-2xl font-black">open → dispatch → save → resume → discard</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            La capa visual usa un único controller y no necesita conocer Runtime, SafetyEngine, serializers ni Supabase.
          </p>
        </div>
        <button
          type="button"
          onClick={runDiagnostic}
          disabled={running}
          className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Ejecutando..." : "Ejecutar controller"}
        </button>
      </div>

      {result ? (
        <div className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Stat label="Primera apertura" value={result.firstSource} ok={result.firstSource === "generated"} />
            <Stat label="Dirty tras acción" value={result.dirtyAfterAction ? "Sí" : "No"} ok={result.dirtyAfterAction} />
            <Stat label="Limpio tras save" value={result.cleanAfterSave ? "Sí" : "No"} ok={result.cleanAfterSave} />
            <Stat label="Segunda apertura" value={result.secondSource} ok={result.secondSource === "resumed"} />
            <Stat label="Misma sesión" value={result.sameSession ? "Sí" : "No"} ok={result.sameSession} />
            <Stat label="Seed preservado" value={result.seedPreserved ? "Sí" : "No"} ok={result.seedPreserved} />
            <Stat label="EventLog preservado" value={result.eventLogPreserved ? "Sí" : "No"} ok={result.eventLogPreserved} />
            <Stat label="Dirty tras reanudar" value={result.dirtyAfterResumeAction ? "Sí" : "No"} ok={result.dirtyAfterResumeAction} />
            <Stat label="2º save limpio" value={result.cleanAfterSecondSave ? "Sí" : "No"} ok={result.cleanAfterSecondSave} />
            <Stat label="Discard" value={result.discarded ? "deleted" : "No"} ok={result.discarded} />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-sm">
            <p className={ok ? "font-black text-emerald-300" : "font-black text-amber-300"}>
              {result.message}
            </p>
            <div className="mt-3 space-y-1 text-slate-400">
              <p>Session ID: <span className="text-slate-200">{result.sessionId}</span></p>
              <p>Eventos al reanudar: <span className="text-slate-200">{result.eventCountAfterResume}</span></p>
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
      <p className={ok ? "text-xl font-black text-emerald-300" : "text-xl font-black text-amber-300"}>
        {value}
      </p>
      <p className="mt-2 text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}
