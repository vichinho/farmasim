"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { FarmaVerseLogo } from "@/components/brand/farmaverse-logo";
import { generateScenarioDefinition, type Drawer, type ScenarioDefinition } from "@/features/simulation-engine";
import { saveSimulationAttempt } from "@/features/progress/actions";
import { cn } from "@/lib/utils";
import type { TrainingCase } from "@/types/training-simulation";

type ReviewEntry = {
  codeChecked: boolean;
  completed: boolean;
  nameChecked: boolean;
  observation: string;
  stateChecked: boolean;
};

type PersistenceState = { message: string; status: "idle" | "saving" | "saved" | "error" };
type Stage = "intro" | "review" | "result";

function storageScenario(caseId: string): ScenarioDefinition {
  const generated = generateScenarioDefinition({ id: caseId, mode: "guided" });
  return {
    ...generated,
    drawers: generated.drawers.map((drawer, index) => index === 1
      ? { ...drawer, physicalCondition: "damaged-label" as const, stockState: "low" as const }
      : drawer),
  };
}

function emptyReview(drawers: Drawer[]) {
  return Object.fromEntries(drawers.map((drawer) => [drawer.id, {
    codeChecked: false,
    completed: false,
    nameChecked: false,
    observation: "",
    stateChecked: false,
  }])) as Record<string, ReviewEntry>;
}

function conditionLabel(condition: Drawer["physicalCondition"]) {
  if (condition === "damaged-label") return "Rótulo deteriorado";
  if (condition === "double-label") return "Doble rotulación";
  if (condition === "missing-strength") return "Concentración ausente";
  return "Condición normal";
}

function stockLabel(stock: Drawer["stockState"]) {
  if (stock === "low") return "Stock bajo";
  if (stock === "out-of-stock") return "Sin stock";
  return "Stock disponible";
}

export function StorageReviewExperience({ levelNumber, trainingCase }: { levelNumber: number; trainingCase: TrainingCase }) {
  const scenario = useMemo(() => storageScenario(trainingCase.id), [trainingCase.id]);
  const [stage, setStage] = useState<Stage>("intro");
  const [selectedDrawerId, setSelectedDrawerId] = useState<string | null>(null);
  const [review, setReview] = useState<Record<string, ReviewEntry>>(() => emptyReview(scenario.drawers));
  const [attemptId, setAttemptId] = useState(() => crypto.randomUUID());
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [persistence, setPersistence] = useState<PersistenceState>({ message: "", status: "idle" });
  const selectedDrawer = scenario.drawers.find((drawer) => drawer.id === selectedDrawerId);
  const selectedEntry = selectedDrawer ? review[selectedDrawer.id] : undefined;
  const completedCount = Object.values(review).filter((entry) => entry.completed).length;
  const allCompleted = completedCount === scenario.drawers.length;

  function updateEntry(drawerId: string, patch: Partial<ReviewEntry>) {
    setReview((current) => ({
      ...current,
      [drawerId]: {
        ...current[drawerId],
        ...patch,
        ...(
          "codeChecked" in patch
          || "nameChecked" in patch
          || "observation" in patch
          || "stateChecked" in patch
            ? { completed: false }
            : {}
        ),
      },
    }));
  }

  function startReview() {
    setStage("review");
    setSelectedDrawerId(scenario.drawers[0]?.id ?? null);
  }

  function completeDrawer(drawer: Drawer) {
    const entry = review[drawer.id];
    if (!entry.codeChecked || !entry.nameChecked || !entry.stateChecked || !entry.observation.trim()) return;
    updateEntry(drawer.id, { completed: true });
    const nextDrawer = scenario.drawers.find((item) => item.id !== drawer.id && !review[item.id]?.completed);
    if (nextDrawer) setSelectedDrawerId(nextDrawer.id);
  }

  function resetReview() {
    setStage("intro");
    setSelectedDrawerId(null);
    setReview(emptyReview(scenario.drawers));
    setAttemptId(crypto.randomUUID());
    setStartedAt(new Date().toISOString());
    setPersistence({ message: "", status: "idle" });
  }

  async function saveReview() {
    if (!allCompleted || persistence.status === "saving") return;
    setPersistence({ message: "Guardando la revisión…", status: "saving" });
    try {
      const result = await saveSimulationAttempt({
        attemptId,
        correctAnswers: scenario.drawers.length * 4,
        incorrectAnswers: 0,
        levelNumber,
        scenarioSlug: trainingCase.id,
        startedAt,
      });
      setPersistence({
        message: result.status === "error" ? result.message : "Revisión guardada en tu progreso.",
        status: result.status === "error" ? "error" : "saved",
      });
    } catch {
      setPersistence({ message: "No pudimos guardar la revisión. Revisa tu conexión y vuelve a intentarlo.", status: "error" });
    }
  }

  return (
    <div className="simulation-frame overflow-hidden rounded-[1.6rem] border bg-white">
      <nav aria-label="Controles de la revisión" className="flex min-h-12 items-center justify-between gap-3 border-b border-emerald-100 px-3 py-2 sm:px-5">
        <Link className="inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-semibold text-[var(--brand-strong)] hover:bg-emerald-50" href="/simulaciones">← Salir</Link>
        <div className="min-w-0 text-center">
          <p className="text-[.68rem] font-semibold uppercase tracking-[.09em] text-slate-500">Revisión interna</p>
          <p className="truncate text-xs font-semibold text-slate-800">{stage === "intro" ? "Preparación" : stage === "result" ? "Resultado" : `${completedCount} de ${scenario.drawers.length} gavetas`}</p>
        </div>
        <button className="min-h-9 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100" onClick={resetReview} type="button">Reiniciar</button>
      </nav>

      <header className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-gradient-to-r from-white to-emerald-50/50 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <FarmaVerseLogo className="w-28 shrink-0 sm:w-32" />
          <div className="hidden min-w-0 border-l border-emerald-200 pl-3 sm:block">
            <p className="text-sm font-bold">Revisión de almacenamiento</p>
            <p className="truncate text-xs text-slate-500">{trainingCase.title}</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[.68rem] font-bold text-emerald-800">Nivel {levelNumber}</span>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,.85fr)]">
        <section aria-label="Área ficticia de almacenamiento" className="relative min-h-[24rem] overflow-hidden bg-slate-900 sm:min-h-[32rem] lg:min-h-[38rem]">
          <Image alt="Área ficticia de almacenamiento farmacéutico" className="object-cover object-center opacity-85" fill priority sizes="(min-width: 1024px) 60vw, 100vw" src="/images/farmasim/storage-review-scene.png" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/20 to-emerald-950/25" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
            <div className="rounded-2xl border border-white/20 bg-slate-950/65 px-4 py-3 text-white backdrop-blur">
              <p className="text-[.68rem] font-bold uppercase tracking-[.14em] text-emerald-300">Área de almacenamiento</p>
              <p className="mt-1 text-sm font-semibold">07:45 h · Revisión diaria</p>
            </div>
            <span className="rounded-full border border-white/20 bg-white/90 px-3 py-1.5 text-[.65rem] font-bold text-slate-700">Sin atención de paciente</span>
          </div>

          <div className="absolute inset-x-0 bottom-0 grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
            {scenario.drawers.map((drawer, index) => {
              const entry = review[drawer.id];
              const active = selectedDrawerId === drawer.id;
              return (
                <button
                  aria-pressed={active}
                  className={cn(
                    "rounded-2xl border p-3 text-left shadow-lg backdrop-blur transition",
                    active ? "border-emerald-300 bg-emerald-50 text-slate-950" : "border-white/30 bg-white/92 text-slate-800 hover:bg-white",
                  )}
                  key={drawer.id}
                  onClick={() => { setStage("review"); setSelectedDrawerId(drawer.id); }}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[.68rem] font-bold uppercase tracking-[.1em] text-emerald-700">Gaveta {String.fromCharCode(65 + index)}</span>
                    <span className={cn("grid size-6 place-items-center rounded-full text-xs font-bold", entry.completed ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500")}>{entry.completed ? "✓" : index + 1}</span>
                  </span>
                  <span className="mt-1 block break-words text-sm font-bold sm:truncate">{drawer.expectedLabel}</span>
                  <span className="mt-1 block text-xs text-slate-500">{conditionLabel(drawer.physicalCondition)} · {stockLabel(drawer.stockState)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="bg-[var(--simulation-panel)] p-4 sm:p-5">
          {stage === "intro" ? (
            <StorageIntro drawerCount={scenario.drawers.length} onStart={startReview} />
          ) : stage === "result" ? (
            <StorageResult persistence={persistence} review={review} scenario={scenario} onSave={saveReview} />
          ) : selectedDrawer && selectedEntry ? (
            <DrawerReview
              drawer={selectedDrawer}
              entry={selectedEntry}
              onComplete={() => completeDrawer(selectedDrawer)}
              onUpdate={(patch) => updateEntry(selectedDrawer.id, patch)}
              product={scenario.arsenal.find((item) => item.id === selectedDrawer.expectedMedicationPresentationId)}
            />
          ) : null}

          {stage === "review" && allCompleted ? (
            <button className="mt-4 min-h-12 w-full rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white hover:bg-[var(--brand-strong)]" onClick={() => setStage("result")} type="button">Cerrar revisión diaria →</button>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function StorageIntro({ drawerCount, onStart }: { drawerCount: number; onStart: () => void }) {
  return (
    <section>
      <p className="text-[.7rem] font-bold uppercase tracking-[.14em] text-emerald-700">Antes de comenzar</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">Revisión diaria de almacenamiento</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">Recorre {drawerCount} gavetas ficticias y registra únicamente las condiciones visibles. Este caso no incluye atención ni entrega a pacientes.</p>
      <ol className="mt-5 space-y-3">
        {["Comprueba el código y nombre", "Revisa el estado físico y el stock", "Registra una observación antes de cerrar"].map((label, index) => <li className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-white p-3 text-sm font-semibold" key={label}><span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">{index + 1}</span>{label}</li>)}
      </ol>
      <button className="mt-6 min-h-12 w-full rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white hover:bg-[var(--brand-strong)]" onClick={onStart} type="button">Comenzar revisión</button>
      <p className="mt-4 text-xs leading-5 text-slate-500">Contenido educativo ficticio. Ante una condición no prevista, detén la actividad y deriva al QF según el protocolo aplicable.</p>
    </section>
  );
}

function DrawerReview({ drawer, entry, onComplete, onUpdate, product }: { drawer: Drawer; entry: ReviewEntry; onComplete: () => void; onUpdate: (patch: Partial<ReviewEntry>) => void; product?: ScenarioDefinition["arsenal"][number] }) {
  const ready = entry.codeChecked && entry.nameChecked && entry.stateChecked && Boolean(entry.observation.trim());
  const suggestedObservation = drawer.physicalCondition === "normal" && drawer.stockState === "available"
    ? "Sin observaciones visibles."
    : `${conditionLabel(drawer.physicalCondition)}; ${stockLabel(drawer.stockState).toLocaleLowerCase("es-CL")}.`;
  return (
    <section>
      <p className="text-[.7rem] font-bold uppercase tracking-[.14em] text-emerald-700">Pauta de revisión</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">{drawer.expectedLabel}</h2>
      <p className="mt-2 text-sm text-slate-500">Completa cada comprobación observable antes de cerrar la gaveta.</p>
      <div className="mt-5 space-y-3">
        <ReviewCheck checked={entry.codeChecked} label={`Código ficticio: ${product?.sourceCode ?? "No informado"}`} onClick={() => onUpdate({ codeChecked: !entry.codeChecked })} />
        <ReviewCheck checked={entry.nameChecked} label={`Producto: ${product?.medicationName ?? "No informado"}`} onClick={() => onUpdate({ nameChecked: !entry.nameChecked })} />
        <ReviewCheck checked={entry.stateChecked} label={`${conditionLabel(drawer.physicalCondition)} · ${stockLabel(drawer.stockState)}`} onClick={() => onUpdate({ stateChecked: !entry.stateChecked })} warning={drawer.physicalCondition !== "normal" || drawer.stockState !== "available"} />
      </div>
      <label className="mt-5 block text-xs font-bold text-slate-700" htmlFor={`observation-${drawer.id}`}>Observación del registro</label>
      <textarea className="mt-2 min-h-24 w-full resize-y rounded-xl border border-emerald-200 bg-white p-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" id={`observation-${drawer.id}`} onChange={(event) => onUpdate({ observation: event.target.value })} placeholder="Describe solamente lo que observas" value={entry.observation} />
      <button className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900" onClick={() => onUpdate({ observation: suggestedObservation })} type="button">Usar observación sugerida</button>
      <button className="mt-5 min-h-12 w-full rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={!ready} onClick={onComplete} type="button">{entry.completed ? "Gaveta revisada ✓" : "Completar gaveta"}</button>
    </section>
  );
}

function ReviewCheck({ checked, label, onClick, warning = false }: { checked: boolean; label: string; onClick: () => void; warning?: boolean }) {
  return <button aria-pressed={checked} className={cn("flex min-h-12 w-full items-center gap-3 rounded-xl border p-3 text-left text-sm font-semibold transition", checked ? warning ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300")} onClick={onClick} type="button"><span className={cn("grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold", checked ? warning ? "border-amber-500 bg-amber-500 text-white" : "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 text-slate-400")}>{checked ? "✓" : ""}</span>{label}</button>;
}

function StorageResult({ onSave, persistence, review, scenario }: { onSave: () => void; persistence: PersistenceState; review: Record<string, ReviewEntry>; scenario: ScenarioDefinition }) {
  return (
    <section>
      <p className="text-[.7rem] font-bold uppercase tracking-[.14em] text-emerald-700">Resultado</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">Revisión completada</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Registraste código, nombre, estado y observación para todas las gavetas del escenario.</p>
      <div className="mt-5 space-y-3">{scenario.drawers.map((drawer) => <div className="rounded-xl border border-emerald-100 bg-white p-3" key={drawer.id}><div className="flex items-center justify-between gap-2"><p className="text-sm font-bold">{drawer.expectedLabel}</p><span className="text-emerald-700">✓</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{review[drawer.id]?.observation}</p></div>)}</div>
      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-bold uppercase tracking-[.1em] text-amber-900">No olvidar</p><p className="mt-1 text-xs leading-5 text-amber-900">Registra las observaciones visibles. Ante una condición no prevista, detén la actividad y deriva al QF.</p></div>
      {persistence.status === "saved" ? <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800" role="status">{persistence.message}</p> : <button className="mt-5 min-h-12 w-full rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white disabled:opacity-50" disabled={persistence.status === "saving"} onClick={onSave} type="button">{persistence.status === "saving" ? "Guardando…" : persistence.status === "error" ? "Reintentar guardado" : "Finalizar y guardar progreso"}</button>}
      {persistence.status === "error" ? <p className="mt-2 text-xs font-semibold text-rose-700" role="status">{persistence.message}</p> : null}
    </section>
  );
}
