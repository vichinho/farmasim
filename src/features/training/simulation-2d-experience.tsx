"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useReducer, useState, useTransition } from "react";

import {
  createSimulationSession,
  describeSimulationEvent,
  executeSimulationCommand,
  generateScenarioDefinition,
  getMissionSteps,
  getRecentLearnerActions,
  type MedicationPresentation,
  type ScenarioDefinition,
  type SimulationCommand,
  type SimulationMode,
  type SimulationSession,
} from "@/features/simulation-engine";
import { cn } from "@/lib/utils";
import { saveSimulationAttempt } from "@/features/progress/actions";
import type { AttemptCriterionResult, TrainingCase, TrainingMode } from "@/types/training-simulation";

type Props = { levelNumber: number; mode: TrainingMode; trainingCase: TrainingCase };
type Send = (type: SimulationCommand["type"], data?: SimulationCommand["data"], actorId?: string) => void;
type Hotspot = { id: string; label: string; x: string; y: string; event: SimulationCommand["type"] };
type PersistenceState = {
  message: string;
  status: "idle" | "saving" | "saved" | "error";
};

const hotspots: Hotspot[] = [
  { id: "patient", label: "Paciente", x: "8%", y: "60%", event: "patient.focused" },
  { id: "computer", label: "Computador", x: "39%", y: "64%", event: "computer.focused" },
  { id: "storage", label: "Almacenamiento", x: "73%", y: "16%", event: "storage.focused" },
  { id: "preparation", label: "TENS 2", x: "79%", y: "40%", event: "preparation.focused" },
  { id: "tray", label: "Bandeja", x: "75%", y: "66%", event: "tray.inspected" },
];

function simulationMode(mode: TrainingMode): SimulationMode {
  if (mode.guidance === "guided") return "guided";
  if (mode.guidance === "standard") return "practice";
  return "assessment";
}

function fullName(scenario: ScenarioDefinition) {
  const patient = scenario.patient;
  return `${patient.firstName} ${patient.paternalSurname} ${patient.maternalSurname}`;
}

function getPresentation(scenario: ScenarioDefinition, id: string) {
  return scenario.arsenal.find((item) => item.id === id);
}

export function Simulation2DExperience({ levelNumber, mode, trainingCase }: Props) {
  const scenario = useMemo(
    () => generateScenarioDefinition({ id: trainingCase.id, mode: simulationMode(mode) }),
    [mode, trainingCase.id],
  );
  const [session, dispatch] = useReducer(
    (state: SimulationSession, command: SimulationCommand) =>
      executeSimulationCommand(scenario, state, command),
    scenario,
    (definition) => createSimulationSession(definition),
  );
  const [persistence, setPersistence] = useState<PersistenceState>({
    message: "",
    status: "idle",
  });
  const [, startPersistenceTransition] = useTransition();

  const send: Send = (type, data, actorId = session.activeActorId) => {
    dispatch({ type, actorId, data });
  };
  const activeActor = scenario.actors.find((actor) => actor.id === session.activeActorId);
  const drawer = session.focusedObjectId?.startsWith("drawer:")
    ? scenario.drawers.find((item) => item.id === session.focusedObjectId?.slice(7))
    : undefined;
  const medication = session.focusedObjectId?.startsWith("medication:")
    ? getPresentation(scenario, session.focusedObjectId.slice(11))
    : undefined;

  const persistAttempt = useCallback(async () => {
    if (session.deliveryStatus !== "completed") return;
    setPersistence({ message: "Guardando tu progreso en la cuenta…", status: "saving" });
    const criterionResults = Object.entries(session.criteria).map(([criterionId, status]) => ({
      criterionId,
      status: status === "met" ? "met" : status === "intercepted" ? "intercepted" : "reinforcement",
    })) as AttemptCriterionResult[];
    const correctAnswers = criterionResults.filter((result) => result.status !== "reinforcement").length;
    try {
      const result = await saveSimulationAttempt({
        attemptId: session.id,
        correctAnswers,
        incorrectAnswers: criterionResults.length - correctAnswers,
        criterionResults,
        levelNumber,
        scenarioSlug: trainingCase.id,
        startedAt: session.startedAt,
      });
      setPersistence({
        message: result.status === "error"
          ? result.message
          : "Progreso guardado en tu cuenta. Podrás verlo desde otros dispositivos.",
        status: result.status === "error" ? "error" : "saved",
      });
    } catch {
      setPersistence({
        message: "No pudimos guardar el progreso. Revisa tu conexión y vuelve a intentarlo.",
        status: "error",
      });
    }
  }, [levelNumber, session.criteria, session.deliveryStatus, session.id, session.startedAt, trainingCase.id]);

  useEffect(() => {
    if (session.deliveryStatus === "completed" && persistence.status === "idle") {
      startPersistenceTransition(() => {
        void persistAttempt();
      });
    }
  }, [persistAttempt, persistence.status, session.deliveryStatus, startPersistenceTransition]);

  function selectRole(actorId: string) {
    const actor = scenario.actors.find((item) => item.id === actorId);
    send("role.selected", { selectedActorId: actorId }, actorId);
    send(actor?.role === "preparation" ? "storage.focused" : "patient.focused", {}, actorId);
  }

  function searchPatient() {
    send("search.executed", { rut: session.typedRut });
    const searched = normalizeRut(session.typedRut);
    const match = [scenario.patient, ...scenario.similarPatients].find(
      (patient) => normalizeRut(patient.rut) === searched,
    );
    if (match) send("patient_record.opened", { patientId: match.id });
  }

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-violet-100 bg-white shadow-[0_22px_70px_rgba(76,48,130,.13)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 px-5 py-4">
        <div><p className="text-xl font-black text-violet-800">FarmaVerse · Simulación 2D</p><p className="text-xs font-semibold text-slate-500">{trainingCase.title}</p></div>
        <div className="flex gap-2" aria-label="Seleccionar rol">
          {scenario.actors.filter((actor) => actor.role !== "qf-support").map((actor) => (
            <button aria-pressed={session.activeActorId === actor.id} className={cn("min-h-10 rounded-xl border px-4 text-xs font-black transition-[background-color,border-color,color,transform,box-shadow] duration-300 ease-out motion-reduce:transition-none", session.activeActorId === actor.id ? "scale-[1.02] border-violet-700 bg-violet-700 text-white shadow-md shadow-violet-200" : "border-violet-200 text-violet-700 hover:-translate-y-0.5 hover:bg-violet-50")} key={actor.id} onClick={() => selectRole(actor.id)} type="button">{actor.displayName}</button>
          ))}
        </div>
        <span className="rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">{scenario.mode === "guided" ? "Guiado" : scenario.mode === "practice" ? "Práctica" : "Evaluación"}</span>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_27rem]">
        <main className="relative min-h-[28rem] overflow-hidden bg-slate-200 sm:min-h-[36rem] xl:min-h-[720px]">
          <div className={cn("absolute inset-0 transition-[transform,transform-origin] duration-700 ease-in-out motion-reduce:transition-none", session.focusedObjectId && "scale-110")} style={{ transformOrigin: focusOrigin(session.focusedObjectId) }}>
            <Image alt="Farmacia ambulatoria 2D interactiva" className="object-cover" fill priority sizes="(min-width: 1280px) 70vw, 100vw" src="/images/farmasim/case001-scene.jpg" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-white/5" />
          </div>

          {session.deliveryStatus !== "completed" ? hotspots.map((hotspot) => (
            <button aria-label={`Interactuar con ${hotspot.label}`} className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-violet-300" key={hotspot.id} onClick={() => send(hotspot.event)} style={{ left: hotspot.x, top: hotspot.y }} type="button">
              <span className={cn("mx-auto block size-4 rounded-full border-[3px] border-white bg-violet-600 shadow-lg transition group-hover:scale-125", scenario.mode === "assessment" && "opacity-45 group-hover:opacity-100")} />
              <span className={cn("mt-2 block rounded-xl bg-white/95 px-3 py-1.5 text-xs font-black text-violet-800 shadow transition", scenario.mode === "guided" ? "opacity-100" : "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100")}>{hotspot.label}</span>
            </button>
          )) : null}

        </main>

        <aside className="space-y-4 bg-[#fcfcfe] p-4 sm:p-5 xl:max-h-[720px] xl:overflow-y-auto xl:pb-28">
          <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-[0_12px_35px_rgba(76,48,130,.08)] sm:p-5" aria-live="polite">
            <div className="simulation-panel-enter" key={`${session.activeActorId}:${session.focusedObjectId}:${session.deliveryStatus}`}>
              {session.deliveryStatus === "blocked" ? <SafetyStop session={session} send={send} />
                : session.deliveryStatus === "completed" ? <Results onRetry={persistAttempt} persistence={persistence} session={session} />
                  : medication ? <MedicationView medication={medication} session={session} send={send} />
                    : drawer ? <DrawerView drawer={drawer} scenario={scenario} send={send} />
                      : <FocusView activeRole={activeActor?.role} scenario={scenario} searchPatient={searchPatient} send={send} session={session} />}
            </div>
          </section>
          <LearnerSidebar scenario={scenario} session={session} />
          {process.env.NEXT_PUBLIC_SIMULATION_AUDIT === "true" ? <TechnicalAudit session={session} /> : null}
        </aside>
      </div>
    </div>
  );
}

function FocusView({ activeRole, scenario, searchPatient, send, session }: { activeRole?: string; scenario: ScenarioDefinition; searchPatient: () => void; send: Send; session: SimulationSession }) {
  const focus = session.focusedObjectId;
  if (!focus) return <Panel eyebrow="ESCENA GENERAL" title="Explora la farmacia"><p className="text-sm leading-6 text-slate-600">Selecciona un objeto. La información solo aparece después de consultar su fuente.</p></Panel>;
  if (focus === "patient") return <Panel eyebrow="ATENCIÓN" title="Paciente"><p className="rounded-xl bg-violet-50 p-3 text-sm">“Buenos días, vengo a retirar mis medicamentos.”</p><Action onClick={() => { send("document.requested"); send("document.opened"); }}>Solicitar documento</Action><Action onClick={() => send("identity.rechecked", { patientId: scenario.patient.id })}>Verificar identidad antes de entregar</Action><Action onClick={() => send("instructions.given", { patientId: scenario.patient.id })}>Entregar indicaciones</Action><button className="mt-3 min-h-12 w-full rounded-xl bg-violet-700 px-4 font-black text-white" onClick={() => send("delivery.attempted")} type="button">ENTREGAR</button><Back send={send} /></Panel>;
  if (focus === "document") return <Panel eyebrow="DOCUMENTO FICTICIO" title="Identificación"><div className="rounded-xl bg-violet-50 p-4"><p className="font-black">{fullName(scenario)}</p><p className="text-sm">RUT {scenario.patient.rut}</p><p className="text-sm">Edad {scenario.patient.age} años</p></div><Back send={send} /></Panel>;
  if (focus === "computer") return <Computer scenario={scenario} searchPatient={searchPatient} send={send} session={session} />;
  if (focus === "storage") return <Panel eyebrow="ALMACENAMIENTO" title="Selecciona una gaveta"><div className="space-y-2">{scenario.drawers.map((drawer) => <div className="rounded-xl border border-slate-200 p-3" key={drawer.id}><p className="font-black">{drawer.displayedLabel}</p><p className="text-xs text-slate-500">{drawer.physicalCondition} · {drawer.stockState}</p><div className="mt-2 flex gap-4"><button className="text-xs font-black text-violet-700" onClick={() => send("drawer.label_inspected", { drawerId: drawer.id })} type="button">Leer rótulo</button><button className="text-xs font-black text-violet-700" onClick={() => { send("drawer.opened", { drawerId: drawer.id }); send("drawer.contents_inspected", { drawerId: drawer.id }); }} type="button">Abrir gaveta</button></div></div>)}</div><Back send={send} /></Panel>;
  if (focus === "preparation") return <Panel eyebrow="ROL" title="TENS 2 · Preparación"><p className="text-sm text-slate-600">Control actual: <strong>{activeRole === "preparation" ? "participante" : "simulación"}</strong>.</p><Action onClick={() => send("storage.focused")}>Ir al almacenamiento</Action><Action onClick={() => send("tray.sent")}>Enviar bandeja a TENS 1</Action><Back send={send} /></Panel>;
  if (focus === "tray") return <TrayView scenario={scenario} send={send} session={session} />;
  return <Panel eyebrow="ESCENA" title="Interacción"><Back send={send} /></Panel>;
}

function Computer({ scenario, searchPatient, send, session }: { scenario: ScenarioDefinition; searchPatient: () => void; send: Send; session: SimulationSession }) {
  const loaded = [scenario.patient, ...scenario.similarPatients].find((patient) => patient.id === session.loadedPatientId);
  const records = scenario.prescriptions.filter((record) => record.patientId === session.loadedPatientId);
  return <Panel eyebrow="COMPUTADOR" title="Sistema clínico simulado"><label className="text-xs font-black" htmlFor="rut-search">RUT</label><div className="mt-1 grid grid-cols-[1fr_auto] gap-2"><input className="min-h-11 rounded-xl border border-violet-200 px-3" id="rut-search" onChange={(event) => send("rut.typed", { rut: event.target.value })} placeholder="Escribe el RUT" value={session.typedRut} /><button className="rounded-xl bg-violet-700 px-4 text-sm font-black text-white" onClick={searchPatient} type="button">Buscar</button></div>{loaded ? <div className="mt-4 rounded-xl border p-3"><p className="font-black">{loaded.firstName} {loaded.paternalSurname} {loaded.maternalSurname}</p><p className="text-xs text-slate-500">{records.length} registros encontrados</p></div> : session.eventLog.some((event) => event.type === "search.executed") ? <p className="mt-3 text-sm font-bold text-rose-700">No se encontró un paciente con ese RUT.</p> : null}<div className="mt-3 space-y-2">{records.map((record) => { const opened = session.openedPrescriptionIds.includes(record.id); return <div className="rounded-xl border p-3" key={record.id}><div className="flex justify-between gap-2"><div><p className="text-sm font-black">{record.establishmentId}</p><p className="text-xs text-slate-500">{record.status} · {record.dates.issuedAt}</p></div><button className="text-xs font-black text-violet-700" onClick={() => { send("prescription.opened", { prescriptionId: record.id }); send("prescription.status_verified", { prescriptionId: record.id }); }} type="button">{opened ? "Revisada" : "Abrir"}</button></div>{opened ? <div className="mt-2 border-t pt-2 text-xs">{record.lines.map((line) => { const item = getPresentation(scenario, line.medicationPresentationId); return <p key={line.id}>{item?.medicationName} {item?.strength} · {item?.pharmaceuticalForm} · {line.quantity}</p>; })}<button className="mt-2 font-black text-violet-700" onClick={() => send("prescription.closed", { prescriptionId: record.id })} type="button">Cerrar receta</button></div> : null}</div>; })}</div><button className="mt-4 w-full text-sm font-black text-slate-500" onClick={() => send("computer.exited")} type="button">← Volver a farmacia</button></Panel>;
}

function DrawerView({ drawer, scenario, send }: { drawer: ScenarioDefinition["drawers"][number]; scenario: ScenarioDefinition; send: Send }) {
  return <Panel eyebrow="GAVETA ABIERTA" title={drawer.displayedLabel}><p className="text-sm text-slate-600">Rótulo esperado: {drawer.expectedLabel}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{drawer.contents.map((id) => { const item = getPresentation(scenario, id); return <button className="rounded-xl border border-violet-200 p-3 text-left" key={id} onClick={() => send("medication.inspected", { medicationPresentationId: id })} type="button"><span className="text-xs font-black text-violet-700">Caja independiente</span><span className="mt-1 block font-bold">{item?.medicationName}</span><span className="text-xs text-slate-500">Clic para ampliar</span></button>; })}</div><button className="mt-4 w-full text-sm font-black text-slate-500" onClick={() => send("storage.focused")} type="button">← Volver a gavetas</button></Panel>;
}

function MedicationView({ medication, send, session }: { medication: MedicationPresentation; send: Send; session: SimulationSession }) {
  const fromTray = session.focusReturnObjectId === "tray";
  const returnToSource = () => {
    if (fromTray) {
      send("tray.inspected");
    } else if (session.focusReturnObjectId?.startsWith("drawer:")) {
      send("drawer.opened", { drawerId: session.focusReturnObjectId.slice(7) });
    } else {
      send("storage.focused");
    }
  };
  return <Panel eyebrow="MEDICAMENTO AMPLIADO" title={medication.medicationName}><dl className="grid grid-cols-2 gap-2 rounded-xl bg-violet-50 p-4 text-sm"><div><dt className="font-bold text-slate-500">Concentración</dt><dd className="font-black">{medication.strength}</dd></div><div><dt className="font-bold text-slate-500">Forma</dt><dd className="font-black">{medication.pharmaceuticalForm}</dd></div><div><dt className="font-bold text-slate-500">Envase</dt><dd className="font-black">{medication.packageQuantity}</dd></div></dl>{!fromTray ? <Action onClick={() => { send("medication.taken", { medicationPresentationId: medication.id }); send("medication.added_to_tray", { trayItemId: `manual:${medication.id}:${session.eventLog.length}`, medicationPresentationId: medication.id, quantity: medication.packageQuantity }); returnToSource(); }}>Agregar a bandeja</Action> : null}<button className="mt-4 w-full text-sm font-black text-slate-500" onClick={returnToSource} type="button">← Volver a {fromTray ? "bandeja" : "gaveta"}</button></Panel>;
}

function TrayView({ scenario, send, session }: { scenario: ScenarioDefinition; send: Send; session: SimulationSession }) {
  const preparationActor = scenario.actors.find((actor) => actor.role === "preparation");
  return <Panel eyebrow="VERIFICACIÓN" title="Bandeja"><div className="space-y-2">{session.tray.items.map((item) => { const medication = getPresentation(scenario, item.medicationPresentationId); return <div className="rounded-xl border p-3" key={item.id}><button className="w-full text-left" onClick={() => send("medication.inspected", { medicationPresentationId: item.medicationPresentationId })} type="button"><p className="font-black">{medication?.medicationName}</p><p className="text-xs text-slate-500">Clic para ampliar · Cantidad {item.quantity}</p></button><button className="mt-2 text-xs font-black text-rose-700" onClick={() => send("medication.returned", { trayItemId: item.id })} type="button">Retirar producto</button></div>; })}</div>{session.tray.status === "correction-requested" ? <Action onClick={() => send("tray.corrected", {}, preparationActor?.id)}>Aplicar corrección de TENS 2</Action> : <Action onClick={() => send("correction.requested")}>Solicitar corrección</Action>}<Back send={send} /></Panel>;
}

function SafetyStop({ send, session }: { send: Send; session: SimulationSession }) {
  return <Panel eyebrow="🚨 DETENTE · NO ENTREGAR" title="ERROR DE MEDICACIÓN INTERCEPTADO"><div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3">{session.discrepancies.map((item) => <p className="text-sm" key={item.id}><strong>{item.kind}</strong>: esperado {item.expected}; actual {item.actual}.</p>)}</div><p className="mt-3 text-sm font-bold text-emerald-800">La entrega fue bloqueada antes de alcanzar al paciente.</p><Action onClick={() => send("tray.inspected")}>Volver a inspeccionar bandeja</Action></Panel>;
}

function Results({ onRetry, persistence, session }: { onRetry: () => void; persistence: PersistenceState; session: SimulationSession }) {
  return <Panel eyebrow="RESULTADO" title="Entrega completada de forma segura"><div className="space-y-2">{Object.entries(session.criteria).map(([id, status], index) => <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2" key={id}><span className="text-xs font-semibold">Criterio {index + 1}</span><span className={cn("rounded-md px-2 py-1 text-xs font-black", status === "met" ? "bg-emerald-100 text-emerald-700" : status === "intercepted" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700")}>{status === "met" ? "Cumplido" : status === "intercepted" ? "Interceptado" : "Reforzar"}</span></div>)}</div><div className={cn("mt-4 rounded-xl border p-3 text-sm font-bold", persistence.status === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : persistence.status === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-violet-200 bg-violet-50 text-violet-800")} role="status"><p>{persistence.message || "Preparando el guardado del progreso…"}</p>{persistence.status === "error" ? <button className="mt-3 min-h-10 rounded-lg bg-rose-700 px-4 text-xs font-black text-white" onClick={onRetry} type="button">Reintentar guardado</button> : null}</div></Panel>;
}

function LearnerSidebar({ scenario, session }: { scenario: ScenarioDefinition; session: SimulationSession }) {
  if (scenario.mode === "assessment") {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-wider text-violet-600">Evaluación en curso</p>
        <h2 className="mt-2 font-black text-slate-900">Resuelve el caso de forma autónoma</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Las pistas de proceso están desactivadas. Tus decisiones quedarán registradas para el resultado final.
        </p>
      </div>
    );
  }

  const steps = getMissionSteps(scenario, session);
  const recentActions = getRecentLearnerActions(session.eventLog, 3);

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-violet-100 bg-white p-5" aria-labelledby="mission-progress-title">
        <p className="text-xs font-black uppercase tracking-wider text-violet-600">Tu misión</p>
        <h2 className="mt-1 font-black text-slate-900" id="mission-progress-title">Progreso del proceso</h2>
        <ol className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <li className="grid grid-cols-[2rem_1fr] gap-3" key={step.id}>
              <span
                aria-label={step.status === "completed" ? "Completado" : step.status === "attention" ? "Requiere atención" : step.status === "current" ? "Paso actual" : "Pendiente"}
                className={cn(
                  "grid size-8 place-items-center rounded-full border text-xs font-black",
                  step.status === "completed" && "border-emerald-600 bg-emerald-600 text-white",
                  step.status === "current" && "border-violet-600 bg-violet-50 text-violet-700 ring-4 ring-violet-100",
                  step.status === "attention" && "border-amber-500 bg-amber-50 text-amber-700 ring-4 ring-amber-100",
                  step.status === "pending" && "border-slate-200 bg-slate-50 text-slate-400",
                )}
              >
                {step.status === "completed" ? "✓" : step.status === "attention" ? "!" : index + 1}
              </span>
              <div className="pt-0.5">
                <p className={cn("text-sm font-black", step.status === "pending" ? "text-slate-400" : "text-slate-800")}>{step.label}</p>
                {(scenario.mode === "guided" || step.status === "attention") && step.status !== "pending" ? (
                  <p className={cn("mt-0.5 text-xs leading-5", step.status === "attention" ? "font-bold text-amber-700" : "text-slate-500")}>{step.description}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-violet-100 bg-white p-5" aria-labelledby="recent-actions-title">
        <h2 className="font-black text-slate-900" id="recent-actions-title">Últimas acciones</h2>
        {recentActions.length ? (
          <ol className="mt-3 space-y-2">
            {recentActions.map((action) => (
              <li className="flex gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700" key={action.id}>
                <span aria-hidden="true" className="text-emerald-600">✓</span>
                {action.label}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-500">Comienza explorando al paciente y las fuentes de información.</p>
        )}
      </section>
    </div>
  );
}

function TechnicalAudit({ session }: { session: SimulationSession }) {
  const recent = session.eventLog.slice(-12).reverse();
  return (
    <details className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-slate-600">
      <summary className="cursor-pointer text-xs font-black uppercase tracking-wider">
        Auditoría técnica
      </summary>
      <p className="mt-2 text-xs leading-5 text-slate-500">Visible únicamente durante el desarrollo.</p>
      {recent.length ? (
        <ol className="mt-3 space-y-2">
          {recent.map((event) => (
            <li className="rounded-lg bg-slate-50 px-3 py-2 text-xs" key={event.id}>
              <p className="font-bold text-slate-700">{event.sequence}. {describeSimulationEvent(event)}</p>
              <code className="mt-1 block text-[.65rem] text-slate-400">{event.type} · {event.actorId}</code>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-xs text-slate-500">Sin eventos registrados.</p>
      )}
    </details>
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) { return <div><p className="text-[.65rem] font-black uppercase tracking-[.16em] text-violet-600">{eyebrow}</p><h1 className="mt-1 text-xl font-black">{title}</h1><div className="mt-4">{children}</div></div>; }
function Action({ children, onClick }: { children: React.ReactNode; onClick: () => void }) { return <button className="mt-3 min-h-11 w-full rounded-xl border border-violet-200 px-4 text-left text-sm font-black text-violet-700 hover:bg-violet-50" onClick={onClick} type="button">{children}</button>; }
function Back({ send }: { send: Send }) { return <button className="mt-4 w-full py-2 text-sm font-black text-slate-500" onClick={() => send("scene.returned")} type="button">← Volver a la escena</button>; }
function normalizeRut(value: string) { return value.toUpperCase().replace(/[^0-9K]/g, ""); }
function focusOrigin(focus: string | null) { if (focus === "computer") return "39% 64%"; if (focus === "storage" || focus?.startsWith("drawer:") || focus?.startsWith("medication:")) return "73% 25%"; if (focus === "tray" || focus === "preparation") return "76% 62%"; if (focus === "patient" || focus === "document") return "10% 60%"; return "50% 50%"; }
