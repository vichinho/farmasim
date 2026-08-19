"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import {
  createSimulationSession,
  describeSimulationEvent,
  executeSimulationCommand,
  expectedPrescriptionLines,
  generateScenarioDefinition,
  getMissionSteps,
  getRecentLearnerActions,
  recommendReinforcement,
  type MedicationPresentation,
  type ScenarioDefinition,
  type SimulationCommand,
  type SimulationMode,
  type SimulationSession,
} from "@/features/simulation-engine";
import { saveSimulationAttempt } from "@/features/progress/actions";
import { cn } from "@/lib/utils";
import type { AttemptCriterionResult, TrainingCase, TrainingMode } from "@/types/training-simulation";

type Props = { levelNumber: number; mode: TrainingMode; trainingCase: TrainingCase };
type Send = (type: SimulationCommand["type"], data?: SimulationCommand["data"], actorId?: string) => void;
type PersistenceState = { message: string; status: "idle" | "saving" | "saved" | "error" };
type Hotspot = { id: string; label: string; x: string; y: string; event: SimulationCommand["type"] };

const hotspots: Hotspot[] = [
  { id: "patient", label: "Paciente", x: "8%", y: "60%", event: "patient.focused" },
  { id: "computer", label: "Computador", x: "39%", y: "64%", event: "computer.focused" },
  { id: "storage", label: "Almacenamiento", x: "73%", y: "16%", event: "storage.focused" },
  { id: "preparation", label: "TENS 2", x: "79%", y: "40%", event: "preparation.focused" },
  { id: "tray", label: "Bandeja", x: "75%", y: "66%", event: "tray.inspected" },
];

const establishmentNames: Record<string, string> = {
  "hospital-tome": "Hospital de Tomé",
  "hospital-las-higueras": "Hospital Las Higueras",
  "cesfam-bellavista": "CESFAM Bellavista",
  "cesfam-alberto-reyes": "CESFAM Alberto Reyes",
  cosam: "COSAM",
  "san-rafael": "San Rafael",
  penco: "Penco",
  lirquen: "Lirquén",
};

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

function normalizeRut(value: string) {
  return value.toUpperCase().replace(/[^0-9K]/g, "");
}

function focusOrigin(focus: string | null) {
  if (focus === "computer") return "39% 64%";
  if (focus === "storage" || focus?.startsWith("drawer:") || focus?.startsWith("medication:")) return "73% 25%";
  if (focus === "tray" || focus === "preparation") return "76% 62%";
  if (focus === "patient" || focus === "document") return "10% 60%";
  return "50% 50%";
}

export function Simulation2DExperience({ levelNumber, mode, trainingCase }: Props) {
  const baseScenario = useMemo(
    () => generateScenarioDefinition({ id: trainingCase.id, mode: simulationMode(mode) }),
    [mode, trainingCase.id],
  );
  const [scenario, setScenario] = useState(baseScenario);
  const [session, setSession] = useState<SimulationSession>(() => createSimulationSession(baseScenario));
  const [persistence, setPersistence] = useState<PersistenceState>({ message: "", status: "idle" });
  const [, startPersistenceTransition] = useTransition();

  useEffect(() => {
    setScenario(baseScenario);
    setSession(createSimulationSession(baseScenario));
    setPersistence({ message: "", status: "idle" });
  }, [baseScenario]);

  const runCommands = useCallback((commands: SimulationCommand[]) => {
    setSession((current) => commands.reduce(
      (state, command) => executeSimulationCommand(scenario, state, command),
      current,
    ));
  }, [scenario]);

  const runFromState = useCallback((builder: (state: SimulationSession) => SimulationCommand[]) => {
    setSession((current) => builder(current).reduce(
      (state, command) => executeSimulationCommand(scenario, state, command),
      current,
    ));
  }, [scenario]);

  const send: Send = useCallback((type, data, actorId) => {
    setSession((current) => executeSimulationCommand(
      scenario,
      current,
      { type, data, actorId: actorId ?? current.activeActorId },
    ));
  }, [scenario]);

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
        message: result.status === "error" ? result.message : "Progreso guardado en tu cuenta.",
        status: result.status === "error" ? "error" : "saved",
      });
    } catch {
      setPersistence({ message: "No pudimos guardar el progreso. Revisa tu conexión y vuelve a intentarlo.", status: "error" });
    }
  }, [levelNumber, session, trainingCase.id]);

  useEffect(() => {
    if (session.deliveryStatus === "completed" && persistence.status === "idle") {
      startPersistenceTransition(() => void persistAttempt());
    }
  }, [persistAttempt, persistence.status, session.deliveryStatus, startPersistenceTransition]);

  function selectRole(role: "tens-1" | "tens-2") {
    const commands: SimulationCommand[] = [
      { type: "role.selected", actorId: role, data: { selectedRole: role } },
    ];

    if (role === "tens-1") {
      for (const line of expectedPrescriptionLines(scenario)) {
        commands.push(
          { type: "medication.taken", actorId: "tens-2", data: { medicationPresentationId: line.medicationPresentationId } },
          {
            type: "medication.added_to_tray",
            actorId: "tens-2",
            data: {
              trayItemId: `simulation:${line.id}`,
              prescriptionLineId: line.id,
              medicationPresentationId: line.medicationPresentationId,
              quantity: line.quantity,
            },
          },
        );
      }
      commands.push(
        { type: "tray.sent", actorId: "tens-2" },
        { type: "tray.received", actorId: "tens-1" },
        { type: "patient.focused", actorId: "tens-1" },
      );
    } else {
      commands.push(
        { type: "document.requested", actorId: "tens-1" },
        { type: "document.opened", actorId: "tens-1" },
        { type: "patient_record.opened", actorId: "tens-1", data: { patientId: scenario.patient.id } },
      );
      for (const prescriptionId of scenario.prescriptionsRelevantToCurrentWithdrawal) {
        commands.push(
          { type: "prescription.opened", actorId: "tens-1", data: { prescriptionId } },
          { type: "prescription.status_verified", actorId: "tens-1", data: { prescriptionId } },
        );
      }
      commands.push({ type: "storage.focused", actorId: "tens-2" });
    }

    runCommands(commands);
  }

  function searchPatient() {
    const searched = normalizeRut(session.typedRut);
    const match = [scenario.patient, ...scenario.similarPatients].find((patient) => normalizeRut(patient.rut) === searched);
    runCommands([
      { type: "search.executed", actorId: session.activeActorId, data: { rut: session.typedRut } },
      ...(match ? [{ type: "patient_record.opened" as const, actorId: session.activeActorId, data: { patientId: match.id } }] : []),
    ]);
  }

  function finishPreparationAsTens2() {
    runFromState((current) => {
      const commands: SimulationCommand[] = [
        { type: "tray.sent", actorId: "tens-2" },
        { type: "tray.received", actorId: "tens-1" },
        { type: "tray.inspected", actorId: "tens-1" },
      ];
      for (const item of current.tray.items) {
        commands.push({ type: "medication.inspected", actorId: "tens-1", data: { medicationPresentationId: item.medicationPresentationId } });
        if (item.prescriptionLineId) {
          commands.push({ type: "medication.compared_to_prescription", actorId: "tens-1", data: { prescriptionLineId: item.prescriptionLineId } });
        }
      }
      commands.push(
        { type: "identity.rechecked", actorId: "tens-1", data: { patientId: scenario.patient.id } },
        { type: "instructions.given", actorId: "tens-1", data: { patientId: scenario.patient.id } },
        { type: "delivery.attempted", actorId: "tens-1" },
      );
      return commands;
    });
  }

  function startReinforcement() {
    const normalizedSession: SimulationSession = {
      ...session,
      criteria: Object.fromEntries(
        Object.entries(session.criteria).map(([id, status]) => [id, status === "pending" ? "reinforcement" : status]),
      ) as SimulationSession["criteria"],
    };
    const recommendation = recommendReinforcement(normalizedSession);
    if (!recommendation) return;
    const nextScenario = generateScenarioDefinition({
      id: recommendation.scenarioId,
      mode: scenario.mode,
      seed: recommendation.seed,
    });
    setScenario(nextScenario);
    setSession(createSimulationSession(nextScenario));
    setPersistence({ message: "", status: "idle" });
  }

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-violet-100 bg-white shadow-[0_22px_70px_rgba(76,48,130,.13)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 px-5 py-4">
        <div>
          <p className="text-xl font-black text-violet-800">FarmaVerse · Simulación 2D</p>
          <p className="text-xs font-semibold text-slate-500">{trainingCase.title}</p>
        </div>
        <div className="flex gap-2" aria-label="Seleccionar rol">
          {(["tens-1", "tens-2"] as const).map((role) => (
            <button
              aria-pressed={session.selectedPlayerRole === role}
              className={cn(
                "min-h-10 rounded-xl border px-4 text-xs font-black transition",
                session.selectedPlayerRole === role ? "border-violet-700 bg-violet-700 text-white" : "border-violet-200 text-violet-700 hover:bg-violet-50",
              )}
              key={role}
              onClick={() => selectRole(role)}
              type="button"
            >
              {role === "tens-1" ? "TENS 1 · Atención" : "TENS 2 · Preparación"}
            </button>
          ))}
        </div>
        <span className="rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">
          {scenario.mode === "guided" ? "Guiado" : scenario.mode === "practice" ? "Práctica" : "Evaluación"}
        </span>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_27rem]">
        <main className="relative min-h-[28rem] overflow-hidden bg-slate-200 sm:min-h-[36rem] xl:min-h-[720px]">
          <div className={cn("absolute inset-0 transition-transform duration-700", session.focusedObjectId && "scale-110")} style={{ transformOrigin: focusOrigin(session.focusedObjectId) }}>
            <Image alt="Farmacia ambulatoria 2D interactiva" className="object-cover" fill priority sizes="(min-width: 1280px) 70vw, 100vw" src="/images/farmasim/case001-scene.jpg" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-white/5" />
          </div>

          {session.deliveryStatus !== "completed" ? hotspots.map((hotspot) => (
            <button
              aria-label={`Interactuar con ${hotspot.label}`}
              className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
              key={hotspot.id}
              onClick={() => send(hotspot.event)}
              style={{ left: hotspot.x, top: hotspot.y }}
              type="button"
            >
              <span className={cn("mx-auto block size-4 rounded-full border-[3px] border-white bg-violet-600 shadow-lg transition group-hover:scale-125", scenario.mode === "assessment" && "opacity-45 group-hover:opacity-100")} />
              <span className={cn("mt-2 block rounded-xl bg-white/95 px-3 py-1.5 text-xs font-black text-violet-800 shadow transition", scenario.mode === "guided" ? "opacity-100" : "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100")}>{hotspot.label}</span>
            </button>
          )) : null}
        </main>

        <aside className="space-y-4 bg-[#fcfcfe] p-4 sm:p-5 xl:max-h-[720px] xl:overflow-y-auto xl:pb-28">
          <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-[0_12px_35px_rgba(76,48,130,.08)] sm:p-5" aria-live="polite">
            {session.deliveryStatus === "completed" ? (
              <Results onReinforcement={startReinforcement} onRetry={persistAttempt} persistence={persistence} session={session} />
            ) : session.deliveryStatus === "blocked" && scenario.mode !== "assessment" ? (
              <SafetyStop session={session} send={send} />
            ) : session.deliveryStatus === "blocked" ? (
              <AssessmentBlocked send={send} />
            ) : medication ? (
              <MedicationView medication={medication} scenario={scenario} send={send} session={session} />
            ) : drawer ? (
              <DrawerView drawer={drawer} scenario={scenario} send={send} />
            ) : (
              <FocusView
                activeRole={activeActor?.role}
                finishPreparationAsTens2={finishPreparationAsTens2}
                scenario={scenario}
                searchPatient={searchPatient}
                send={send}
                session={session}
              />
            )}
          </section>
          <LearnerSidebar scenario={scenario} session={session} />
          {process.env.NEXT_PUBLIC_SIMULATION_AUDIT === "true" ? <TechnicalAudit session={session} /> : null}
        </aside>
      </div>
    </div>
  );
}

function FocusView({ activeRole, finishPreparationAsTens2, scenario, searchPatient, send, session }: {
  activeRole?: string;
  finishPreparationAsTens2: () => void;
  scenario: ScenarioDefinition;
  searchPatient: () => void;
  send: Send;
  session: SimulationSession;
}) {
  const focus = session.focusedObjectId;
  if (!focus) return <Panel eyebrow="ESCENA GENERAL" title="Explora la farmacia"><p className="text-sm leading-6 text-slate-600">Selecciona un objeto de la escena para continuar.</p></Panel>;
  if (focus === "patient") return <Panel eyebrow="ATENCIÓN" title="Paciente"><p className="rounded-xl bg-violet-50 p-3 text-sm">“Buenos días, vengo a retirar mis medicamentos.”</p><Action onClick={() => { send("document.requested"); send("document.opened"); }}>Solicitar documento</Action><Action onClick={() => send("identity.rechecked", { patientId: scenario.patient.id })}>Verificar identidad antes de entregar</Action><Action onClick={() => send("instructions.given", { patientId: scenario.patient.id })}>Entregar indicaciones</Action><button className="mt-3 min-h-12 w-full rounded-xl bg-violet-700 px-4 font-black text-white" onClick={() => send("delivery.attempted")} type="button">ENTREGAR</button><Back send={send} /></Panel>;
  if (focus === "document") return <Panel eyebrow="DOCUMENTO FICTICIO" title="Identificación"><div className="rounded-xl bg-violet-50 p-4"><p className="font-black">{fullName(scenario)}</p><p className="text-sm">RUT {scenario.patient.rut}</p><p className="text-sm">Edad {scenario.patient.age} años</p></div><Back send={send} /></Panel>;
  if (focus === "computer") return <Computer scenario={scenario} searchPatient={searchPatient} send={send} session={session} />;
  if (focus === "storage") return <Storage scenario={scenario} send={send} />;
  if (focus === "preparation") return <Panel eyebrow="ROL" title="TENS 2 · Preparación"><p className="text-sm text-slate-600">Control actual: <strong>{session.actorControllers["tens-2"] === "participant" ? "participante" : "simulación"}</strong>.</p><Action onClick={() => send("storage.focused")}>Ir al almacenamiento</Action>{session.selectedPlayerRole === "tens-2" ? <Action onClick={finishPreparationAsTens2}>Enviar bandeja a TENS 1</Action> : null}<Back send={send} /></Panel>;
  if (focus === "tray") return <TrayView scenario={scenario} send={send} session={session} />;
  return <Panel eyebrow="ESCENA" title="Interacción"><Back send={send} /></Panel>;
}

function Computer({ scenario, searchPatient, send, session }: { scenario: ScenarioDefinition; searchPatient: () => void; send: Send; session: SimulationSession }) {
  const loaded = [scenario.patient, ...scenario.similarPatients].find((patient) => patient.id === session.loadedPatientId);
  const records = scenario.prescriptions.filter((record) => record.patientId === session.loadedPatientId && scenario.visibleClinicalRecordIds.includes(record.id));
  return (
    <Panel eyebrow="COMPUTADOR" title="Sistema clínico simulado">
      <div className="flex gap-2">
        <button className="rounded-lg border border-violet-200 px-3 py-2 text-xs font-black text-violet-700" onClick={() => send("tab.opened", { tabId: "patient-search" })} type="button">Búsqueda</button>
        <button className="rounded-lg border border-violet-200 px-3 py-2 text-xs font-black text-violet-700" onClick={() => send("tab.opened", { tabId: "prescriptions" })} type="button">Prescripciones</button>
      </div>
      <label className="mt-4 block text-xs font-black" htmlFor="rut-search">RUT</label>
      <div className="mt-1 grid grid-cols-[1fr_auto] gap-2">
        <input className="min-h-11 rounded-xl border border-violet-200 px-3" id="rut-search" onChange={(event) => send("rut.typed", { rut: event.target.value })} placeholder="Escribe el RUT" value={session.typedRut} />
        <button className="rounded-xl bg-violet-700 px-4 text-sm font-black text-white" onClick={searchPatient} type="button">Buscar</button>
      </div>
      {loaded ? <div className="mt-4 rounded-xl border p-3"><p className="font-black">{loaded.firstName} {loaded.paternalSurname} {loaded.maternalSurname}</p><p className="text-xs text-slate-500">{records.length} registros visibles</p></div> : null}
      <div className="mt-3 space-y-2">
        {records.map((record) => {
          const opened = session.openedPrescriptionIds.includes(record.id);
          const verified = session.verifiedPrescriptionIds.includes(record.id);
          const current = scenario.prescriptionsRelevantToCurrentWithdrawal.includes(record.id);
          const available = scenario.availablePrescriptionIds.includes(record.id);
          return (
            <div className="rounded-xl border p-3" key={record.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black">{establishmentNames[record.establishmentId] ?? record.establishmentId}</p>
                  <p className="text-xs text-slate-500">Estado: {record.status} · Emisión: {record.dates.issuedAt}</p>
                  <p className="mt-1 text-[.7rem] font-bold text-violet-700">{current ? "RETIRO ACTUAL" : available ? "DISPONIBLE" : "REGISTRO HISTÓRICO"}</p>
                </div>
                <button className="text-xs font-black text-violet-700" onClick={() => send(opened ? "prescription.closed" : "prescription.opened", { prescriptionId: record.id })} type="button">{opened ? "Cerrar" : "Abrir"}</button>
              </div>
              {opened ? (
                <div className="mt-3 space-y-2 border-t pt-3 text-xs">
                  <dl className="grid grid-cols-2 gap-2">
                    <div><dt className="font-bold text-slate-500">Retiro</dt><dd>{record.dates.pickupAt ?? "—"}</dd></div>
                    <div><dt className="font-bold text-slate-500">Último retiro</dt><dd>{record.dates.lastPickupAt ?? "—"}</dd></div>
                    <div><dt className="font-bold text-slate-500">Despacho</dt><dd>{record.dates.dispatchedAt ?? "—"}</dd></div>
                    <div><dt className="font-bold text-slate-500">Próximo retiro</dt><dd>{record.dates.nextPickupAt ?? "—"}</dd></div>
                    <div><dt className="font-bold text-slate-500">Repetición</dt><dd>{record.repetition}</dd></div>
                    <div><dt className="font-bold text-slate-500">Estado</dt><dd>{record.status}</dd></div>
                  </dl>
                  <div className="rounded-lg bg-slate-50 p-2">
                    {record.lines.map((line) => { const item = getPresentation(scenario, line.medicationPresentationId); return <p key={line.id}>{item?.medicationName} · {item?.strength} · {item?.pharmaceuticalForm} · Cantidad {line.quantity}</p>; })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-lg border px-3 py-2 font-black text-violet-700" onClick={() => send("record.scrolled", { recordId: record.id })} type="button">Revisar ficha completa</button>
                    <button className={cn("rounded-lg px-3 py-2 font-black", verified ? "bg-emerald-100 text-emerald-700" : "bg-violet-700 text-white")} onClick={() => send("prescription.status_verified", { prescriptionId: record.id })} type="button">{verified ? "Estado verificado" : "Verificar estado"}</button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <button className="mt-4 w-full text-sm font-black text-slate-500" onClick={() => send("computer.exited")} type="button">← Volver a farmacia</button>
    </Panel>
  );
}

function Storage({ scenario, send }: { scenario: ScenarioDefinition; send: Send }) {
  return <Panel eyebrow="ALMACENAMIENTO" title="Selecciona una gaveta"><div className="space-y-2">{scenario.drawers.map((drawer) => <div className="rounded-xl border border-slate-200 p-3" key={drawer.id}><p className="font-black">{drawer.displayedLabel}</p><p className="text-xs text-slate-500">{drawer.physicalCondition} · {drawer.stockState}</p><div className="mt-2 flex gap-4"><button className="text-xs font-black text-violet-700" onClick={() => send("drawer.label_inspected", { drawerId: drawer.id })} type="button">Leer rótulo</button><button className="text-xs font-black text-violet-700" onClick={() => { send("drawer.opened", { drawerId: drawer.id }); send("drawer.contents_inspected", { drawerId: drawer.id }); }} type="button">Abrir gaveta</button></div></div>)}</div><Back send={send} /></Panel>;
}

function DrawerView({ drawer, scenario, send }: { drawer: ScenarioDefinition["drawers"][number]; scenario: ScenarioDefinition; send: Send }) {
  return <Panel eyebrow="GAVETA ABIERTA" title={drawer.displayedLabel}><p className="text-sm text-slate-600">Rótulo esperado: {drawer.expectedLabel}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{drawer.contents.map((id) => { const item = getPresentation(scenario, id); return <button className="rounded-xl border border-violet-200 p-3 text-left" key={id} onClick={() => send("medication.inspected", { medicationPresentationId: id })} type="button"><span className="text-xs font-black text-violet-700">Producto</span><span className="mt-1 block font-bold">{item?.medicationName}</span><span className="text-xs text-slate-500">{item?.strength} · {item?.pharmaceuticalForm}</span></button>; })}</div><button className="mt-4 w-full text-sm font-black text-slate-500" onClick={() => send("storage.focused")} type="button">← Volver a gavetas</button></Panel>;
}

function MedicationView({ medication, scenario, send, session }: { medication: MedicationPresentation; scenario: ScenarioDefinition; send: Send; session: SimulationSession }) {
  const fromTray = session.focusReturnObjectId === "tray";
  const relevantLines = scenario.prescriptions
    .filter((record) => scenario.prescriptionsRelevantToCurrentWithdrawal.includes(record.id))
    .flatMap((record) => record.lines);
  const matchingLine = relevantLines.find((line) => line.medicationPresentationId === medication.id);
  const [lineId, setLineId] = useState(matchingLine?.id ?? "");
  const [quantity, setQuantity] = useState(matchingLine?.quantity ?? medication.packageQuantity);

  const returnToSource = () => {
    if (fromTray) send("tray.inspected");
    else if (session.focusReturnObjectId?.startsWith("drawer:")) send("drawer.opened", { drawerId: session.focusReturnObjectId.slice(7) });
    else send("storage.focused");
  };

  return (
    <Panel eyebrow="MEDICAMENTO AMPLIADO" title={medication.medicationName}>
      <dl className="grid grid-cols-2 gap-2 rounded-xl bg-violet-50 p-4 text-sm">
        <div><dt className="font-bold text-slate-500">Concentración</dt><dd className="font-black">{medication.strength}</dd></div>
        <div><dt className="font-bold text-slate-500">Forma</dt><dd className="font-black">{medication.pharmaceuticalForm}</dd></div>
        <div><dt className="font-bold text-slate-500">Envase</dt><dd className="font-black">{medication.packageQuantity}</dd></div>
      </dl>
      {!fromTray && session.selectedPlayerRole === "tens-2" ? (
        <div className="mt-4 space-y-3 rounded-xl border border-violet-100 p-3">
          <label className="block text-xs font-black">Asociar a línea de prescripción<select className="mt-1 min-h-10 w-full rounded-lg border px-2" onChange={(event) => setLineId(event.target.value)} value={lineId}><option value="">Sin asociación</option>{relevantLines.map((line) => { const item = getPresentation(scenario, line.medicationPresentationId); return <option key={line.id} value={line.id}>{item?.medicationName} {item?.strength} · {line.quantity}</option>; })}</select></label>
          <label className="block text-xs font-black">Cantidad<input className="mt-1 min-h-10 w-full rounded-lg border px-2" min="1" onChange={(event) => setQuantity(Number(event.target.value))} type="number" value={quantity} /></label>
          <Action onClick={() => { send("medication.taken", { medicationPresentationId: medication.id }, "tens-2"); send("medication.added_to_tray", { trayItemId: `manual:${medication.id}:${session.eventLog.length}`, medicationPresentationId: medication.id, prescriptionLineId: lineId || undefined, quantity }, "tens-2"); returnToSource(); }}>Agregar a bandeja</Action>
        </div>
      ) : null}
      <button className="mt-4 w-full text-sm font-black text-slate-500" onClick={returnToSource} type="button">← Volver a {fromTray ? "bandeja" : "gaveta"}</button>
    </Panel>
  );
}

function TrayView({ scenario, send, session }: { scenario: ScenarioDefinition; send: Send; session: SimulationSession }) {
  const preparationActor = scenario.actors.find((actor) => actor.role === "preparation");
  return (
    <Panel eyebrow="VERIFICACIÓN" title="Bandeja">
      {!session.tray.items.length ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">La bandeja está vacía.</p> : null}
      <div className="space-y-2">
        {session.tray.items.map((item) => {
          const medication = getPresentation(scenario, item.medicationPresentationId);
          const compared = item.prescriptionLineId ? session.comparedPrescriptionLineIds.includes(item.prescriptionLineId) : false;
          return (
            <div className="rounded-xl border p-3" key={item.id}>
              <button className="w-full text-left" onClick={() => send("medication.inspected", { medicationPresentationId: item.medicationPresentationId })} type="button"><p className="font-black">{medication?.medicationName}</p><p className="text-xs text-slate-500">{medication?.strength} · {medication?.pharmaceuticalForm} · Cantidad {item.quantity}</p></button>
              {item.prescriptionLineId ? <button className={cn("mt-2 rounded-lg px-3 py-2 text-xs font-black", compared ? "bg-emerald-100 text-emerald-700" : "bg-violet-700 text-white")} onClick={() => { send("medication.inspected", { medicationPresentationId: item.medicationPresentationId }); send("medication.compared_to_prescription", { prescriptionLineId: item.prescriptionLineId }); }} type="button">{compared ? "Comparado con receta" : "Comparar con prescripción"}</button> : <p className="mt-2 text-xs font-bold text-amber-700">Producto sin línea de prescripción asociada.</p>}
              <button className="ml-2 mt-2 text-xs font-black text-rose-700" onClick={() => send("medication.returned", { trayItemId: item.id })} type="button">Retirar</button>
            </div>
          );
        })}
      </div>
      {session.tray.status === "correction-requested" ? <Action onClick={() => send("tray.corrected", {}, preparationActor?.id)}>Aplicar corrección de TENS 2</Action> : <Action onClick={() => send("correction.requested")}>Solicitar corrección</Action>}
      <Back send={send} />
    </Panel>
  );
}

function SafetyStop({ send, session }: { send: Send; session: SimulationSession }) {
  return <Panel eyebrow="DETENTE · NO ENTREGAR" title="Barrera de seguridad activada"><div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3">{session.discrepancies.map((item) => <p className="text-sm" key={item.id}><strong>{item.kind}</strong>: esperado {item.expected}; actual {item.actual}.</p>)}</div><Action onClick={() => send("tray.inspected")}>Volver a revisar</Action></Panel>;
}

function AssessmentBlocked({ send }: { send: Send }) {
  return <Panel eyebrow="EVALUACIÓN" title="Continúa revisando el caso"><p className="text-sm leading-6 text-slate-600">La simulación registró tu intento. No se mostrarán pistas sobre la causa durante la evaluación.</p><Action onClick={() => send("tray.inspected")}>Continuar</Action></Panel>;
}

function Results({ onReinforcement, onRetry, persistence, session }: { onReinforcement: () => void; onRetry: () => void; persistence: PersistenceState; session: SimulationSession }) {
  const failed = Object.entries(session.criteria).filter(([, status]) => status !== "met" && status !== "intercepted");
  const reminder = failed.some(([id]) => id.includes("identity"))
    ? "NO OLVIDAR: confirma la identidad en el sistema y nuevamente antes de entregar."
    : failed.some(([id]) => id.includes("prescription"))
      ? "NO OLVIDAR: abrir una receta no equivale a verificar su estado y vigencia."
      : failed.some(([id]) => id.includes("compare"))
        ? "NO OLVIDAR: compara activamente cada producto de la bandeja con su prescripción."
        : failed.some(([id]) => id.includes("instructions"))
          ? "NO OLVIDAR: entrega las indicaciones correspondientes antes de finalizar."
          : null;
  return (
    <Panel eyebrow="RESULTADO" title="Entrega completada">
      <div className="space-y-2">{Object.entries(session.criteria).map(([id, status], index) => <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2" key={id}><span className="text-xs font-semibold">Criterio {index + 1}</span><span className={cn("rounded-md px-2 py-1 text-xs font-black", status === "met" ? "bg-emerald-100 text-emerald-700" : status === "intercepted" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700")}>{status === "met" ? "Cumplido" : status === "intercepted" ? "Interceptado" : "Reforzar"}</span></div>)}</div>
      {reminder ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-900">{reminder}</div> : null}
      {failed.length ? <Action onClick={onReinforcement}>Iniciar refuerzo con un escenario diferente</Action> : null}
      <div className={cn("mt-4 rounded-xl border p-3 text-sm font-bold", persistence.status === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : persistence.status === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-violet-200 bg-violet-50 text-violet-800")} role="status"><p>{persistence.message || "Preparando el guardado del progreso…"}</p>{persistence.status === "error" ? <button className="mt-3 min-h-10 rounded-lg bg-rose-700 px-4 text-xs font-black text-white" onClick={onRetry} type="button">Reintentar guardado</button> : null}</div>
    </Panel>
  );
}

function LearnerSidebar({ scenario, session }: { scenario: ScenarioDefinition; session: SimulationSession }) {
  if (scenario.mode === "assessment") return <div className="rounded-2xl border border-violet-100 bg-white p-5"><p className="text-xs font-black uppercase tracking-wider text-violet-600">Evaluación en curso</p><h2 className="mt-2 font-black text-slate-900">Resuelve el caso de forma autónoma</h2><p className="mt-2 text-sm leading-6 text-slate-600">No se muestran secuencias, pistas ni causas de error durante el caso.</p></div>;

  const steps = getMissionSteps(scenario, session);
  if (scenario.mode === "practice") return <div className="rounded-2xl border border-violet-100 bg-white p-5"><p className="text-xs font-black uppercase tracking-wider text-violet-600">Objetivo</p><h2 className="mt-2 font-black text-slate-900">{steps[0]?.label}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{steps[0]?.description}</p></div>;

  const recentActions = getRecentLearnerActions(session.eventLog, 3);
  return <div className="grid gap-4"><section className="rounded-2xl border border-violet-100 bg-white p-5"><p className="text-xs font-black uppercase tracking-wider text-violet-600">Tu misión</p><ol className="mt-4 space-y-3">{steps.map((step, index) => <li className="grid grid-cols-[2rem_1fr] gap-3" key={step.id}><span className={cn("grid size-8 place-items-center rounded-full border text-xs font-black", step.status === "completed" && "border-emerald-600 bg-emerald-600 text-white", step.status === "current" && "border-violet-600 bg-violet-50 text-violet-700", step.status === "attention" && "border-amber-500 bg-amber-50 text-amber-700", step.status === "pending" && "border-slate-200 bg-slate-50 text-slate-400")}>{step.status === "completed" ? "✓" : step.status === "attention" ? "!" : index + 1}</span><div><p className="text-sm font-black">{step.label}</p>{step.status !== "pending" ? <p className="mt-0.5 text-xs leading-5 text-slate-500">{step.description}</p> : null}</div></li>)}</ol></section><section className="rounded-2xl border border-violet-100 bg-white p-5"><h2 className="font-black text-slate-900">Últimas acciones</h2>{recentActions.length ? <ol className="mt-3 space-y-2">{recentActions.map((action) => <li className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold" key={action.id}>{action.label}</li>)}</ol> : <p className="mt-2 text-sm text-slate-500">Aún no hay acciones registradas.</p>}</section></div>;
}

function TechnicalAudit({ session }: { session: SimulationSession }) {
  const recent = session.eventLog.slice(-12).reverse();
  return <details className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-slate-600"><summary className="cursor-pointer text-xs font-black uppercase tracking-wider">Auditoría técnica</summary><p className="mt-2 text-xs">Desviaciones de almacenamiento: {session.storageDeviations.length}</p>{session.storageDeviations.map((item) => <p className="mt-1 text-xs" key={item.id}>{item.drawerId} · {item.kind}</p>)}{recent.length ? <ol className="mt-3 space-y-2">{recent.map((event) => <li className="rounded-lg bg-slate-50 px-3 py-2 text-xs" key={event.id}><p className="font-bold">{event.sequence}. {describeSimulationEvent(event)}</p><code className="text-[.65rem] text-slate-400">{event.type} · {event.actorId}</code></li>)}</ol> : null}</details>;
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) { return <div><p className="text-[.65rem] font-black uppercase tracking-[.16em] text-violet-600">{eyebrow}</p><h1 className="mt-1 text-xl font-black">{title}</h1><div className="mt-4">{children}</div></div>; }
function Action({ children, onClick }: { children: React.ReactNode; onClick: () => void }) { return <button className="mt-3 min-h-11 w-full rounded-xl border border-violet-200 px-4 text-left text-sm font-black text-violet-700 hover:bg-violet-50" onClick={onClick} type="button">{children}</button>; }
function Back({ send }: { send: Send }) { return <button className="mt-4 w-full py-2 text-sm font-black text-slate-500" onClick={() => send("scene.returned")} type="button">← Volver a la escena</button>; }
