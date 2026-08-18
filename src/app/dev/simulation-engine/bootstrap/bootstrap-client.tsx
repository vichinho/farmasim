"use client";

import { useState } from "react";

import { bootstrapSimulationRuntime } from "@/features/simulation-engine/bootstrap";
import { technicalSimulationCatalogs } from "@/features/simulation-engine/catalogs";
import {
  deleteSimulationCheckpointFromCloud,
  loadLatestSimulationCheckpointFromCloud,
  saveSimulationCheckpointToCloud,
} from "@/features/simulation-engine/checkpoint-actions";
import { minimumScenarioFixtures } from "@/features/simulation-engine/fixtures/minimum-scenarios";
import { serializeSimulationCheckpoint } from "@/features/simulation-engine/persistence";

type Result = {
  firstSource: string;
  secondSource: string;
  sameSession: boolean;
  preservedSeed: boolean;
  preservedEventCount: boolean;
  deleteStatus: string;
  sessionId: string;
  eventCount: number;
  message: string;
} | null;

function definitionA() {
  const fixture = minimumScenarioFixtures.find((item) => item.id === "A");
  if (!fixture) throw new Error("Minimum scenario A is required for bootstrap diagnostics.");
  return fixture.definition;
}

async function loadLatest(definitionId: string) {
  const loaded = await loadLatestSimulationCheckpointFromCloud(definitionId);
  if (loaded.status === "missing") return null;
  if (loaded.status !== "loaded" || !loaded.serializedCheckpoint) {
    throw new Error(loaded.message);
  }
  return loaded.serializedCheckpoint;
}

export function BootstrapClient() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result>(null);

  async function run() {
    setRunning(true);
    setResult(null);

    try {
      const definition = definitionA();

      const existing = await loadLatestSimulationCheckpointFromCloud(definition.id);
      if (existing.status === "loaded" && existing.sessionId) {
        await deleteSimulationCheckpointFromCloud(existing.sessionId);
      } else if (existing.status === "error") {
        throw new Error(existing.message);
      }

      const first = await bootstrapSimulationRuntime({
        definition,
        seed: "bootstrap-diagnostic-primary",
        catalogs: technicalSimulationCatalogs,
        generation: { playerRole: "attention", mode: "practice" },
        loadLatestCheckpoint: loadLatest,
      });

      first.runtime.dispatchPlayer({
        type: "computer.focused",
        targetType: "computer",
        targetId: "clinical-terminal",
      });

      const checkpoint = first.runtime.checkpoint();
      const saved = await saveSimulationCheckpointToCloud(
        serializeSimulationCheckpoint(checkpoint),
      );
      if (saved.status !== "saved") throw new Error(saved.message);

      const second = await bootstrapSimulationRuntime({
        definition,
        seed: "bootstrap-diagnostic-should-be-ignored-on-resume",
        catalogs: technicalSimulationCatalogs,
        generation: { playerRole: "attention", mode: "practice" },
        loadLatestCheckpoint: loadLatest,
      });

      const sameSession = first.sessionId === second.sessionId;
      const preservedSeed = first.seed === second.seed;
      const preservedEventCount =
        first.runtime.snapshot().session.eventCount === second.snapshot.session.eventCount;
      const deleted = await deleteSimulationCheckpointFromCloud(second.sessionId);
      const ok =
        first.source === "generated" &&
        second.source === "resumed" &&
        sameSession &&
        preservedSeed &&
        preservedEventCount &&
        deleted.status === "deleted";

      setResult({
        firstSource: first.source,
        secondSource: second.source,
        sameSession,
        preservedSeed,
        preservedEventCount,
        deleteStatus: deleted.status,
        sessionId: second.sessionId,
        eventCount: second.snapshot.session.eventCount,
        message: ok
          ? "Bootstrap generated → cloud checkpoint → resumed completado correctamente."
          : "El bootstrap terminó con una inconsistencia.",
      });
    } catch (error) {
      setResult({
        firstSource: "error",
        secondSource: "error",
        sameSession: false,
        preservedSeed: false,
        preservedEventCount: false,
        deleteStatus: "error",
        sessionId: "unknown",
        eventCount: 0,
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setRunning(false);
    }
  }

  const ok = Boolean(
    result &&
      result.firstSource === "generated" &&
      result.secondSource === "resumed" &&
      result.sameSession &&
      result.preservedSeed &&
      result.preservedEventCount &&
      result.deleteStatus === "deleted",
  );

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">Session bootstrap</p>
          <h2 className="mt-2 text-2xl font-black">Nueva sesión → checkpoint → reanudación</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            La interfaz pide una sesión. El adapter reanuda una compatible si existe; si no, genera una nueva determinista.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Ejecutando..." : "Ejecutar bootstrap"}
        </button>
      </div>

      {result ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Stat label="Primera apertura" value={result.firstSource} ok={result.firstSource === "generated"} />
          <Stat label="Segunda apertura" value={result.secondSource} ok={result.secondSource === "resumed"} />
          <Stat label="Misma sesión" value={result.sameSession ? "Sí" : "No"} ok={result.sameSession} />
          <Stat label="Seed preservado" value={result.preservedSeed ? "Sí" : "No"} ok={result.preservedSeed} />
          <Stat label="EventLog preservado" value={result.preservedEventCount ? "Sí" : "No"} ok={result.preservedEventCount} />
          <Stat label="Cleanup" value={result.deleteStatus} ok={result.deleteStatus === "deleted"} />

          <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-sm">
            <p className={ok ? "font-black text-emerald-300" : "font-black text-amber-300"}>{result.message}</p>
            <div className="mt-3 space-y-1 text-slate-400">
              <p>Session ID: <span className="text-slate-200">{result.sessionId}</span></p>
              <p>EventLog restaurado: <span className="text-slate-200">{result.eventCount}</span></p>
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
      <p className={ok ? "text-xl font-black text-emerald-300" : "text-xl font-black text-amber-300"}>{value}</p>
      <p className="mt-2 text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}
