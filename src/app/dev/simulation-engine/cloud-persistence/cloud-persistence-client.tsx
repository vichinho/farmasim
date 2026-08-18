"use client";

import { useState } from "react";

import {
  deleteSimulationCheckpointFromCloud,
  loadSimulationCheckpointFromCloud,
  saveSimulationCheckpointToCloud,
} from "@/features/simulation-engine/checkpoint-actions";
import { minimumScenarioFixtures } from "@/features/simulation-engine/fixtures/minimum-scenarios";
import { SimulationIntegrationRuntime } from "@/features/simulation-engine/integration-runtime";
import {
  parseSimulationCheckpoint,
  serializeSimulationCheckpoint,
} from "@/features/simulation-engine/persistence";

type DiagnosticResult = {
  saveStatus: string;
  loadStatus: string;
  replayEqual: boolean;
  deleteStatus: string;
  sessionId: string;
  eventCountBefore: number;
  eventCountAfter: number;
  message: string;
} | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * PostgreSQL jsonb does not preserve object-key order. Compare JSON values by
 * structure/content so a cloud roundtrip is not reported as different only
 * because keys came back in another order.
 */
function jsonSemanticallyEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false;
    }
    return left.every((item, index) => jsonSemanticallyEqual(item, right[index]));
  }

  if (isRecord(left) || isRecord(right)) {
    if (!isRecord(left) || !isRecord(right)) return false;

    const leftKeys = Object.keys(left).filter((key) => left[key] !== undefined).sort();
    const rightKeys = Object.keys(right).filter((key) => right[key] !== undefined).sort();

    if (
      leftKeys.length !== rightKeys.length ||
      leftKeys.some((key, index) => key !== rightKeys[index])
    ) {
      return false;
    }

    return leftKeys.every((key) => jsonSemanticallyEqual(left[key], right[key]));
  }

  return false;
}

function buildCheckpoint() {
  const fixture = minimumScenarioFixtures.find((item) => item.id === "A");
  if (!fixture) throw new Error("Minimum scenario A is required for cloud persistence diagnostics.");

  const runtime = new SimulationIntegrationRuntime(fixture.definition, fixture.session);
  runtime.dispatchPlayer({
    type: "document.requested",
    targetType: "document",
    targetId: "patient-marta-document",
  });
  runtime.dispatchPlayer({
    type: "document.opened",
    targetType: "document",
    targetId: "patient-marta-document",
  });
  runtime.dispatchPlayer({
    type: "computer.focused",
    targetType: "computer",
    targetId: "clinical-terminal",
  });
  runtime.dispatchPlayer({
    type: "rut.typed",
    targetType: "patient",
    targetId: "patient-marta",
    metadata: { value: "12.345.678-9" },
  });
  runtime.dispatchPlayer({
    type: "search.executed",
    targetType: "patient",
    metadata: { resultPatientId: "patient-marta" },
  });
  runtime.dispatchPlayer({
    type: "patient_record.opened",
    targetType: "record",
    targetId: "record-marta",
  });

  return {
    runtime,
    checkpoint: runtime.checkpoint(),
    snapshot: runtime.snapshot(),
  };
}

export function CloudPersistenceClient() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticResult>(null);

  async function runDiagnostic() {
    setRunning(true);
    setResult(null);

    try {
      const original = buildCheckpoint();
      const serialized = serializeSimulationCheckpoint(original.checkpoint);

      const saved = await saveSimulationCheckpointToCloud(serialized);
      if (saved.status !== "saved" || !saved.sessionId) {
        setResult({
          saveStatus: saved.status,
          loadStatus: "not-run",
          replayEqual: false,
          deleteStatus: "not-run",
          sessionId: original.checkpoint.session.id,
          eventCountBefore: original.snapshot.session.eventCount,
          eventCountAfter: 0,
          message: saved.message,
        });
        return;
      }

      const loaded = await loadSimulationCheckpointFromCloud(saved.sessionId);
      if (loaded.status !== "loaded" || !loaded.serializedCheckpoint) {
        setResult({
          saveStatus: saved.status,
          loadStatus: loaded.status,
          replayEqual: false,
          deleteStatus: "not-run",
          sessionId: saved.sessionId,
          eventCountBefore: original.snapshot.session.eventCount,
          eventCountAfter: 0,
          message: loaded.message,
        });
        return;
      }

      const restored = SimulationIntegrationRuntime.fromCheckpoint(
        parseSimulationCheckpoint(loaded.serializedCheckpoint),
      );
      const restoredSnapshot = restored.snapshot();
      const replayEqual = jsonSemanticallyEqual(original.snapshot, restoredSnapshot);

      const deleted = await deleteSimulationCheckpointFromCloud(saved.sessionId);

      setResult({
        saveStatus: saved.status,
        loadStatus: loaded.status,
        replayEqual,
        deleteStatus: deleted.status,
        sessionId: saved.sessionId,
        eventCountBefore: original.snapshot.session.eventCount,
        eventCountAfter: restoredSnapshot.session.eventCount,
        message:
          saved.status === "saved" &&
          loaded.status === "loaded" &&
          replayEqual &&
          deleted.status === "deleted"
            ? "Roundtrip cloud completado correctamente."
            : "El roundtrip cloud terminó con una inconsistencia.",
      });
    } catch (error) {
      setResult({
        saveStatus: "error",
        loadStatus: "error",
        replayEqual: false,
        deleteStatus: "error",
        sessionId: "unknown",
        eventCountBefore: 0,
        eventCountAfter: 0,
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setRunning(false);
    }
  }

  const ok = Boolean(
    result &&
      result.saveStatus === "saved" &&
      result.loadStatus === "loaded" &&
      result.replayEqual &&
      result.deleteStatus === "deleted",
  );

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">
            Cloud roundtrip
          </p>
          <h2 className="mt-2 text-2xl font-black">Supabase · save → load → restore → delete</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Usa la sesión autenticada actual. El checkpoint se guarda temporalmente, se recupera, se reconstruye y se elimina al final.
          </p>
        </div>

        <button
          type="button"
          onClick={runDiagnostic}
          disabled={running}
          className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Ejecutando..." : "Ejecutar prueba cloud"}
        </button>
      </div>

      {result ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Stat label="Guardar" value={result.saveStatus} ok={result.saveStatus === "saved"} />
          <Stat label="Cargar" value={result.loadStatus} ok={result.loadStatus === "loaded"} />
          <Stat label="Snapshot idéntico" value={result.replayEqual ? "Sí" : "No"} ok={result.replayEqual} />
          <Stat label="Eliminar" value={result.deleteStatus} ok={result.deleteStatus === "deleted"} />

          <div className="md:col-span-2 lg:col-span-4 rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-sm">
            <p className={ok ? "font-black text-emerald-300" : "font-black text-amber-300"}>
              {result.message}
            </p>
            <div className="mt-3 space-y-1 text-slate-400">
              <p>Session ID: <span className="text-slate-200">{result.sessionId}</span></p>
              <p>Eventos antes: <span className="text-slate-200">{result.eventCountBefore}</span></p>
              <p>Eventos después del restore: <span className="text-slate-200">{result.eventCountAfter}</span></p>
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
