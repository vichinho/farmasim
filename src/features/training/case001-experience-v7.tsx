"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { saveSimulationAttempt, type SaveSimulationAttemptResult } from "@/features/progress/actions";
import { Case001IllustratedScene } from "@/features/training/case001-illustrated-scene";
import type { SceneHotspotId } from "@/features/training/case001-scene-hotspots";
import { cn } from "@/lib/utils";
import type { AttemptCriterionResult, DispensingCriterionId, TrainingCase, TrainingMode } from "@/types/training-simulation";

type Props = { levelNumber: number; mode: TrainingMode; trainingCase: TrainingCase };
type CriterionStatus = "pending" | "met" | "missed" | "intercepted";
type PreparationState = "idle" | "preparing" | "delivering" | "delivered";
type Phase = "active" | "safety-stop" | "result";
type Field = "name" | "strength" | "form" | "quantity";

type Medication = {
  id: string;
  name: string;
  strength: string;
  expectedStrength: string;
  form: string;
  quantity: string;
};

const patient = { name: "Marta Fuentes Soto", rut: "12.345.678-9" };
const prescriptions = [
  { id: "r1", title: "Registro 1", medication: "Losartán", strength: "50 mg", form: "Comprimido", quantity: "30 unidades", status: "Emitida" },
  { id: "r2", title: "Registro 2", medication: "Amlodipino", strength: "5 mg", form: "Comprimido", quantity: "30 unidades", status: "Emitida" },
  { id: "r3", title: "Registro 3", medication: "Paracetamol", strength: "500 mg", form: "Comprimido", quantity: "20 unidades", status: "Emitida" },
];
const medications: Medication[] = [
  { id: "losartan", name: "Losartán", strength: "100 mg", expectedStrength: "50 mg", form: "Comprimido", quantity: "30 unidades" },
  { id: "amlodipino", name: "Amlodipino", strength: "5 mg", expectedStrength: "5 mg", form: "Comprimido", quantity: "30 unidades" },
];
const criterionLabels: { id: DispensingCriterionId; label: string }[] = [
  { id: "criterion-1-request-identity-document", label: "Solicita carnet de identidad y/o crónico" },
  { id: "criterion-2-system-identity-match", label: "Digita RUT y verifica nombre de usuario" },
  { id: "criterion-3-identify-all-prescriptions", label: "Identifica todas las prescripciones disponibles" },
  { id: "criterion-4-confirm-prescription-issued", label: "Verifica que la receta esté emitida" },
  { id: "criterion-5-compare-prepared-items", label: "Medicamentos preparados corresponden a la receta" },
  { id: "criterion-6-recheck-identity-before-handoff", label: "Vuelve a verificar identidad antes de la entrega" },
  { id: "criterion-7-provide-corresponding-instructions", label: "Entrega las indicaciones correspondientes" },
];
const initialCriteria = () => Object.fromEntries(criterionLabels.map(({ id }) => [id, "pending"])) as Record<DispensingCriterionId, CriterionStatus>;
const normalizeRut = (value: string) => value.toUpperCase().replace(/[^0-9K]/g, "");
const STORAGE_KEY = "farmasim-case001-contextual-v7";

export function Case001ExperienceV7({ levelNumber, mode, trainingCase }: Props) {
  const [phase, setPhase] = useState<Phase>("active");
  const [selected, setSelected] = useState<SceneHotspotId | null>(null);
  const [criteria, setCriteria] = useState(initialCriteria);
  const [documentVisible, setDocumentVisible] = useState(false);
  const [documentRead, setDocumentRead] = useState(false);
  const [reasonAsked, setReasonAsked] = useState(false);
  const [rut, setRut] = useState("");
  const [patientLoaded, setPatientLoaded] = useState(false);
  const [openedPrescriptions, setOpenedPrescriptions] = useState<string[]>([]);
  const [preparationState, setPreparationState] = useState<PreparationState>("idle");
  const [inspected, setInspected] = useState<Record<string, Field[]>>({});
  const [preparationDecision, setPreparationDecision] = useState<"conform" | "correction" | null>(null);
  const [discrepancyResolved, setDiscrepancyResolved] = useState(false);
  const [finalIdentityChecked, setFinalIdentityChecked] = useState(false);
  const [instructionsGiven, setInstructionsGiven] = useState(false);
  const [event, setEvent] = useState<string | null>(null);
  const [safetyIntercepted, setSafetyIntercepted] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveSimulationAttemptResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const attemptId = useRef(crypto.randomUUID());
  const startedAt = useRef(new Date().toISOString());

  const preparationRole = useMemo(() => ({ role: "preparation" as const, controller: "simulation" as const }), []);
  const trayVisible = preparationState === "delivered";
  const mismatchExists = medications.some((medication) => medication.strength !== medication.expectedStrength);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const restored = JSON.parse(raw);
        if (restored.criteria) setCriteria(restored.criteria);
        if (typeof restored.documentVisible === "boolean") setDocumentVisible(restored.documentVisible);
        if (typeof restored.documentRead === "boolean") setDocumentRead(restored.documentRead);
        if (typeof restored.reasonAsked === "boolean") setReasonAsked(restored.reasonAsked);
        if (typeof restored.rut === "string") setRut(restored.rut);
        if (typeof restored.patientLoaded === "boolean") setPatientLoaded(restored.patientLoaded);
        if (Array.isArray(restored.openedPrescriptions)) setOpenedPrescriptions(restored.openedPrescriptions);
        if (restored.preparationState) setPreparationState(restored.preparationState);
        if (restored.inspected) setInspected(restored.inspected);
        if (restored.preparationDecision) setPreparationDecision(restored.preparationDecision);
        if (typeof restored.discrepancyResolved === "boolean") setDiscrepancyResolved(restored.discrepancyResolved);
        if (typeof restored.finalIdentityChecked === "boolean") setFinalIdentityChecked(restored.finalIdentityChecked);
        if (typeof restored.instructionsGiven === "boolean") setInstructionsGiven(restored.instructionsGiven);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || phase !== "active") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ criteria, documentVisible, documentRead, reasonAsked, rut, patientLoaded, openedPrescriptions, preparationState, inspected, preparationDecision, discrepancyResolved, finalIdentityChecked, instructionsGiven }));
  }, [hydrated, phase, criteria, documentVisible, documentRead, reasonAsked, rut, patientLoaded, openedPrescriptions, preparationState, inspected, preparationDecision, discrepancyResolved, finalIdentityChecked, instructionsGiven]);

  useEffect(() => {
    if (preparationState !== "preparing") return;
    const timer = window.setTimeout(() => {
      setPreparationState("delivering");
      setEvent("TENS 2 finalizó la preparación y se dirige al mesón.");
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [preparationState]);

  useEffect(() => {
    if (preparationState !== "delivering") return;
    const timer = window.setTimeout(() => {
      setPreparationState("delivered");
      setEvent("Preparación recibida.");
      setSelected("tray");
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [preparationState]);

  const progress = useMemo(() => {
    const milestones = [
      documentVisible,
      patientLoaded,
      openedPrescriptions.length === prescriptions.length,
      preparationState !== "idle",
      trayVisible,
      preparationDecision !== null,
      finalIdentityChecked,
      instructionsGiven,
      phase !== "active",
    ];
    return Math.max(8, Math.round((milestones.filter(Boolean).length / milestones.length) * 100));
  }, [documentVisible, patientLoaded, openedPrescriptions.length, preparationState, trayVisible, preparationDecision, finalIdentityChecked, instructionsGiven, phase]);

  const information = useMemo(() => {
    const items: string[] = [];
    if (reasonAsked) items.push("Motivo informado: retiro de medicamentos.");
    if (documentRead) items.push(`Documento: ${patient.name} · RUT ${patient.rut}.`);
    if (patientLoaded) items.push(`Sistema: ficha ficticia de ${patient.name} disponible.`);
    if (openedPrescriptions.length > 0) items.push(`Prescripciones revisadas: ${openedPrescriptions.length} de ${prescriptions.length}.`);
    if (trayVisible) items.push("TENS 2 dejó una preparación sobre el mesón.");
    return items;
  }, [reasonAsked, documentRead, patientLoaded, openedPrescriptions.length, trayVisible]);

  function setCriterion(id: DispensingCriterionId, status: CriterionStatus) {
    setCriteria((current) => current[id] === "intercepted" ? current : { ...current, [id]: status });
  }

  function interact(id: SceneHotspotId) {
    if (phase !== "active") return;
    setSelected(id);
    setEvent(null);

    if (id === "computer" && !documentVisible && criteria["criterion-1-request-identity-document"] === "pending") {
      setCriterion("criterion-1-request-identity-document", "missed");
    }
  }

  function requestDocument() {
    setDocumentVisible(true);
    setCriterion("criterion-1-request-identity-document", "met");
    setEvent("El paciente dejó su documento sobre el mesón.");
    setSelected("document");
  }

  function readDocument() {
    setDocumentRead(true);
  }

  function searchPatient() {
    if (normalizeRut(rut) !== normalizeRut(patient.rut)) {
      setEvent("No se encontró un usuario con ese identificador.");
      return;
    }
    setPatientLoaded(true);
    setCriterion("criterion-2-system-identity-match", documentRead ? "met" : "missed");
    setEvent(null);
  }

  function openPrescription(id: string) {
    setOpenedPrescriptions((current) => Array.from(new Set([...current, id])));
  }

  function sendToPreparation() {
    setCriterion("criterion-3-identify-all-prescriptions", openedPrescriptions.length === prescriptions.length ? "met" : "missed");
    const allOpenedAreIssued = openedPrescriptions.length === prescriptions.length && prescriptions.every((prescription) => prescription.status === "Emitida");
    setCriterion("criterion-4-confirm-prescription-issued", allOpenedAreIssued ? "met" : "missed");
    setPreparationState("preparing");
    setSelected("preparation");
    setEvent("Solicitud enviada al rol de preparación.");
  }

  function inspectMedication(id: string, field: Field) {
    setInspected((current) => ({ ...current, [id]: Array.from(new Set([...(current[id] ?? []), field])) }));
  }

  function markPreparationConform() {
    const allFieldsInspected = medications.every((medication) => (["name", "strength", "form", "quantity"] as Field[]).every((field) => (inspected[medication.id] ?? []).includes(field)));
    setPreparationDecision("conform");
    setCriterion("criterion-5-compare-prepared-items", !mismatchExists && allFieldsInspected ? "met" : "missed");
    setEvent("Preparación marcada como conforme. Puedes continuar con la atención.");
    setSelected("patient");
  }

  function requestCorrection() {
    setPreparationDecision("correction");
    setDiscrepancyResolved(true);
    setCriterion("criterion-5-compare-prepared-items", "intercepted");
    setEvent("TENS 2 corrigió la preparación antes del despacho.");
    setSelected("patient");
  }

  function verifyFinalIdentity() {
    setFinalIdentityChecked(true);
    setCriterion("criterion-6-recheck-identity-before-handoff", "met");
  }

  function giveInstructions() {
    setInstructionsGiven(true);
    setCriterion("criterion-7-provide-corresponding-instructions", "met");
  }

  function playSafetySignal() {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate([140, 80, 140, 80, 220]);
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      [0, 0.22, 0.44].forEach((offset, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = index % 2 === 0 ? 760 : 520;
        gain.gain.value = 0.08;
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(ctx.currentTime + offset);
        oscillator.stop(ctx.currentTime + offset + 0.16);
      });
    } catch {}
  }

  async function persist(finalCriteria: Record<DispensingCriterionId, CriterionStatus>) {
    if (saving) return;
    setSaving(true);
    const results: AttemptCriterionResult[] = criterionLabels.map(({ id }) => ({
      criterionId: id,
      status: finalCriteria[id] === "met" ? "met" : finalCriteria[id] === "intercepted" ? "intercepted" : "reinforcement",
    }));
    const correctAnswers = results.filter((result) => result.status !== "reinforcement").length;
    const result = await saveSimulationAttempt({
      attemptId: attemptId.current,
      correctAnswers,
      incorrectAnswers: results.length - correctAnswers,
      criterionResults: results,
      levelNumber,
      scenarioSlug: trainingCase.id,
      startedAt: startedAt.current,
    });
    setSaveResult(result);
    setSaving(false);
  }

  function attemptDelivery() {
    const nextCriteria = { ...criteria };
    if (!finalIdentityChecked && nextCriteria["criterion-6-recheck-identity-before-handoff"] === "pending") nextCriteria["criterion-6-recheck-identity-before-handoff"] = "missed";
    if (!instructionsGiven && nextCriteria["criterion-7-provide-corresponding-instructions"] === "pending") nextCriteria["criterion-7-provide-corresponding-instructions"] = "missed";
    setCriteria(nextCriteria);

    if (mismatchExists && !discrepancyResolved) {
      setSafetyIntercepted(true);
      setPhase("safety-stop");
      setEvent("Entrega bloqueada por barrera de seguridad.");
      playSafetySignal();
      void persist(nextCriteria);
      return;
    }

    setPhase("result");
    localStorage.removeItem(STORAGE_KEY);
    void persist(nextCriteria);
  }

  function showResultsAfterSafetyStop() {
    setPhase("result");
    localStorage.removeItem(STORAGE_KEY);
  }

  function restart() {
    localStorage.removeItem(STORAGE_KEY);
    setPhase("active"); setSelected(null); setCriteria(initialCriteria()); setDocumentVisible(false); setDocumentRead(false); setReasonAsked(false); setRut(""); setPatientLoaded(false); setOpenedPrescriptions([]); setPreparationState("idle"); setInspected({}); setPreparationDecision(null); setDiscrepancyResolved(false); setFinalIdentityChecked(false); setInstructionsGiven(false); setEvent(null); setSafetyIntercepted(false); setSaveResult(null); setSaving(false); attemptId.current = crypto.randomUUID(); startedAt.current = new Date().toISOString();
  }

  const workspace = selected === "computer" ? "system" : selected === "tray" || selected === "preparation" ? "preparation" : preparationDecision ? "verification" : "service";

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-violet-100 bg-white shadow-[0_22px_70px_rgba(76,48,130,.13)]">
      <Header mode={mode} progress={progress} />
      <div className="grid xl:grid-cols-[minmax(0,1fr)_27.5rem]">
        <div className="min-w-0 border-b border-violet-100 xl:border-b-0 xl:border-r">
          <div className="relative min-h-[720px] overflow-hidden bg-[#eef1f6]">
            <Case001IllustratedScene
              workspace={workspace}
              documentVisible={documentVisible}
              trayVisible={trayVisible}
              preparationState={preparationState}
              guidance={mode.guidance}
              activeHotspot={selected}
              onHotspotClick={interact}
            />
            {!trayVisible ? <div className="pointer-events-none absolute bottom-[16%] right-[8%] z-[12] h-[13%] w-[30%] rounded-[45%] bg-[linear-gradient(165deg,rgba(224,210,202,.98),rgba(205,188,179,.98))] shadow-[inset_0_1px_0_rgba(255,255,255,.5)]" /> : null}
            <div className="absolute bottom-5 left-5 z-30 w-[min(92%,27rem)]">
              <div className="max-h-[470px] overflow-auto rounded-[1.2rem] border border-violet-100 bg-white/96 p-5 shadow-[0_16px_42px_rgba(17,24,39,.13)] backdrop-blur-xl">
                <ContextPanel
                  phase={phase}
                  selected={selected}
                  reasonAsked={reasonAsked}
                  setReasonAsked={setReasonAsked}
                  requestDocument={requestDocument}
                  documentVisible={documentVisible}
                  documentRead={documentRead}
                  readDocument={readDocument}
                  rut={rut}
                  setRut={setRut}
                  patientLoaded={patientLoaded}
                  searchPatient={searchPatient}
                  openedPrescriptions={openedPrescriptions}
                  openPrescription={openPrescription}
                  sendToPreparation={sendToPreparation}
                  preparationState={preparationState}
                  trayVisible={trayVisible}
                  inspected={inspected}
                  inspectMedication={inspectMedication}
                  markPreparationConform={markPreparationConform}
                  requestCorrection={requestCorrection}
                  preparationDecision={preparationDecision}
                  finalIdentityChecked={finalIdentityChecked}
                  verifyFinalIdentity={verifyFinalIdentity}
                  instructionsGiven={instructionsGiven}
                  giveInstructions={giveInstructions}
                  attemptDelivery={attemptDelivery}
                  showResultsAfterSafetyStop={showResultsAfterSafetyStop}
                  criteria={criteria}
                  safetyIntercepted={safetyIntercepted}
                  saving={saving}
                  saveResult={saveResult}
                  restart={restart}
                  close={() => setSelected(null)}
                />
              </div>
            </div>
          </div>
        </div>
        <Sidebar phase={phase} information={information} event={event} criteria={criteria} safetyIntercepted={safetyIntercepted} preparationRole={preparationRole} />
      </div>
      <footer className="border-t border-violet-100 bg-white px-5 py-3 text-center text-xs font-semibold text-slate-500">ⓘ &nbsp; Simulación interactiva — no reemplaza protocolos institucionales.</footer>
    </div>
  );
}

function Header({ mode, progress }: { mode: TrainingMode; progress: number }) {
  return <header className="grid gap-4 border-b border-violet-100 bg-white px-5 py-4 lg:grid-cols-[1fr_minmax(18rem,32rem)_auto] lg:items-center"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-violet-700 text-2xl font-black text-white shadow-sm">+</div><div><p className="text-xl font-black tracking-tight text-violet-800">FarmaSim</p><p className="text-xs font-semibold text-slate-500">Simulaciones · Caso 001</p></div></div><div><div className="mb-2 flex justify-between text-xs font-black text-slate-700"><span>Progreso del caso</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${progress}%` }} /></div></div><div className="flex justify-end gap-2"><span className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">★ {mode.shortLabel}</span><span className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black">08:37</span></div></header>;
}

function ContextPanel(p: any) {
  if (p.phase === "safety-stop") return <CriticalStop onContinue={p.showResultsAfterSafetyStop} />;
  if (p.phase === "result") return <ResultPanel criteria={p.criteria} safetyIntercepted={p.safetyIntercepted} saving={p.saving} saveResult={p.saveResult} restart={p.restart} />;

  if (!p.selected) return <Card eyebrow="NUEVA ATENCIÓN" title="Paciente en ventanilla" text="08:37 h · Farmacia ambulatoria ficticia"><div className="rounded-xl bg-violet-50 p-3 text-sm leading-6 text-slate-700"><strong>Paciente:</strong> “Buenos días, vengo a retirar mis medicamentos.”</div><p className="mt-4 text-sm font-semibold text-slate-600">Interactúa con el entorno para realizar la atención.</p></Card>;

  if (p.selected === "patient") return <Card eyebrow="INTERACTUAR" title="Paciente" text="Selecciona una acción relacionada con la conversación."><ActionButton onClick={p.requestDocument} disabled={p.documentVisible}>Solicitar documento</ActionButton><ActionButton onClick={() => p.setReasonAsked(true)} disabled={p.reasonAsked}>Consultar motivo del retiro</ActionButton>{p.trayVisible && p.preparationDecision ? <><ActionButton onClick={p.verifyFinalIdentity} disabled={p.finalIdentityChecked}>Verificar identidad antes de la entrega</ActionButton><ActionButton onClick={p.giveInstructions} disabled={p.instructionsGiven}>Entregar indicaciones</ActionButton><button className="mt-3 min-h-12 w-full rounded-xl bg-violet-700 px-4 font-bold text-white shadow-sm hover:bg-violet-800" onClick={p.attemptDelivery}>ENTREGAR</button></> : null}<button className="mt-3 w-full py-2 text-xs font-bold text-slate-500" onClick={p.close}>Finalizar conversación</button></Card>;

  if (p.selected === "document") return <Card eyebrow="OBJETO" title="Documento sobre el mesón" text="Información ficticia entregada por el paciente.">{p.documentRead ? <div className="rounded-xl border border-violet-100 bg-violet-50 p-4"><p className="font-black text-slate-900">{patient.name}</p><p className="mt-1 text-sm text-slate-600">RUT {patient.rut}</p></div> : <ActionButton onClick={p.readDocument}>Examinar documento</ActionButton>}</Card>;

  if (p.selected === "computer") return <Card eyebrow="SISTEMA" title="Buscar usuario" text="Ingresa manualmente el identificador que tengas disponible."><label className="mb-1 block text-xs font-black text-slate-700">RUT</label><div className="grid gap-2 sm:grid-cols-[1fr_auto]"><input className="min-h-11 rounded-xl border border-violet-200 px-3 text-sm outline-none focus:border-violet-500" value={p.rut} onChange={(e: any) => p.setRut(e.target.value)} placeholder="RUT" /><button className="rounded-xl bg-violet-700 px-4 text-sm font-bold text-white" onClick={p.searchPatient}>Buscar</button></div>{p.patientLoaded ? <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3"><p className="font-black text-slate-900">{patient.name}</p><p className="mt-1 text-xs text-slate-500">Prescripciones disponibles: {prescriptions.length}</p><div className="mt-3 space-y-2">{prescriptions.map((rx) => <Prescription key={rx.id} prescription={rx} opened={p.openedPrescriptions.includes(rx.id)} onOpen={() => p.openPrescription(rx.id)} />)}</div><button className="mt-4 min-h-11 w-full rounded-xl bg-violet-700 px-4 text-sm font-bold text-white" onClick={p.sendToPreparation} disabled={p.preparationState !== "idle"}>Enviar solicitud a preparación</button></div> : null}</Card>;

  if (p.selected === "preparation") return <Card eyebrow="ROL DE EQUIPO" title="TENS 2" text="La preparación es gestionada por el rol de apoyo."><div className="rounded-xl bg-violet-50 p-3 text-sm text-slate-700"><p><strong>role:</strong> preparation</p><p><strong>controller:</strong> simulation</p></div><p className="mt-3 text-sm text-slate-600">Estado: <strong>{p.preparationState === "preparing" ? "Preparando" : p.preparationState === "delivering" ? "Trasladando al mesón" : p.preparationState === "delivered" ? "Preparación recibida" : "Disponible"}</strong></p></Card>;

  if (p.selected === "tray" && p.trayVisible) return <Card eyebrow="OBJETO" title="Bandeja de preparación" text="Puedes inspeccionar los medicamentos antes de decidir qué hacer."><div className="space-y-3">{medications.map((medication) => <MedicationInspector key={medication.id} medication={medication} inspected={p.inspected[medication.id] ?? []} onInspect={(field) => p.inspectMedication(medication.id, field)} />)}</div>{!p.preparationDecision ? <div className="mt-4 grid gap-2 sm:grid-cols-2"><button className="min-h-11 rounded-xl border border-violet-200 bg-white px-3 text-sm font-bold text-violet-700" onClick={p.markPreparationConform}>Preparación conforme</button><button className="min-h-11 rounded-xl bg-violet-700 px-3 text-sm font-bold text-white" onClick={p.requestCorrection}>Solicitar corrección</button></div> : null}</Card>;

  if (p.selected === "storage") return <Card eyebrow="ENTORNO" title="Gavetas" text="Área de almacenamiento disponible en la escena."><p className="text-sm text-slate-600">En este caso la preparación es realizada por TENS 2.</p></Card>;

  return <Card title="Interacción" text="Selecciona otro elemento de la escena." />;
}

function Prescription({ prescription, opened, onOpen }: { prescription: typeof prescriptions[number]; opened: boolean; onOpen: () => void }) {
  return <div className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm font-bold">{prescription.title}</span><button className="text-xs font-black text-violet-700" onClick={onOpen}>{opened ? "Abierto" : "Abrir"}</button></div>{opened ? <div className="mt-2 border-t border-slate-100 pt-2 text-xs leading-5 text-slate-600"><p>{prescription.medication} · {prescription.strength}</p><p>{prescription.form} · {prescription.quantity}</p><p>Estado: {prescription.status}</p></div> : null}</div>;
}

function MedicationInspector({ medication, inspected, onInspect }: { medication: Medication; inspected: Field[]; onInspect: (field: Field) => void }) {
  const fields: { id: Field; label: string; value: string }[] = [
    { id: "name", label: "Nombre", value: medication.name },
    { id: "strength", label: "Concentración", value: medication.strength },
    { id: "form", label: "Forma", value: medication.form },
    { id: "quantity", label: "Cantidad", value: medication.quantity },
  ];
  return <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-sm font-black text-slate-900">Medicamento</p><div className="mt-2 grid grid-cols-2 gap-2">{fields.map((field) => <button key={field.id} className={cn("rounded-lg border px-2 py-2 text-left text-xs", inspected.includes(field.id) ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-white")} onClick={() => onInspect(field.id)}><span className="block font-bold text-slate-500">{field.label}</span>{inspected.includes(field.id) ? <span className="mt-1 block font-black text-slate-900">{field.value}</span> : <span className="mt-1 block text-violet-700">Inspeccionar</span>}</button>)}</div></div>;
}

function Sidebar({ phase, information, event, criteria, safetyIntercepted, preparationRole }: { phase: Phase; information: string[]; event: string | null; criteria: Record<DispensingCriterionId, CriterionStatus>; safetyIntercepted: boolean; preparationRole: { role: string; controller: string } }) {
  if (phase === "result") return <aside className="space-y-4 bg-[#fcfcfe] p-5"><ResultsCard criteria={criteria} /><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="font-black text-slate-900">💡 NO OLVIDAR</p><p className="mt-2 text-sm leading-6 text-slate-700">Antes del despacho verifica medicamento, concentración, forma farmacéutica y cantidad.</p></div>{safetyIntercepted ? <div className="rounded-2xl border border-violet-100 bg-white p-4"><p className="font-black text-slate-900">Reforzar competencia</p><p className="mt-2 text-sm text-slate-600">Verificación de concentración.</p><a className="mt-3 inline-flex rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white" href="/simulaciones/case-002-concentration-reinforcement?nivel=2">Ir a escenario de refuerzo</a></div> : null}</aside>;

  return <aside className="space-y-4 bg-[#fcfcfe] p-5"><div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-black text-violet-700">◎</div><h3 className="font-black text-slate-900">Misión</h3></div><p className="mt-4 text-sm leading-6 text-slate-700">Atiende al usuario y completa la dispensación de manera segura.</p></div><div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"><h3 className="font-black text-slate-900">Información disponible</h3>{information.length ? <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-700">{information.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Aún no has obtenido información del caso.</p>}</div>{event ? <div className={cn("rounded-2xl border p-4", phase === "safety-stop" ? "border-rose-300 bg-rose-50" : "border-violet-200 bg-violet-50")}><p className="text-xs font-black uppercase tracking-wider text-slate-500">Evento</p><p className="mt-2 text-sm font-bold leading-6 text-slate-800">{event}</p></div> : null}<div className="sr-only" aria-hidden="true">Rol {preparationRole.role}, controlador {preparationRole.controller}</div></aside>;
}

function CriticalStop({ onContinue }: { onContinue: () => void }) {
  return <div><p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600">🚨 DETENTE</p><h2 className="mt-2 text-2xl font-black text-slate-950">ERROR DE MEDICACIÓN INTERCEPTADO</h2><p className="mt-2 text-lg font-black text-rose-700">NO ENTREGAR</p><div className="mt-4 grid gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm"><p><strong>Prescripción:</strong> Losartán 50 mg.</p><p><strong>Preparación:</strong> Losartán 100 mg.</p><p><strong>Error:</strong> Concentración incorrecta.</p><p className="mt-1 font-bold">El error no fue detectado durante el doble chequeo.</p></div><div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900">Resultado: el medicamento NO alcanzó al paciente.</div><button className="mt-4 min-h-12 w-full rounded-xl bg-violet-700 px-4 font-bold text-white" onClick={onContinue}>Ver retroalimentación</button></div>;
}

function ResultPanel({ criteria, safetyIntercepted, saving, saveResult, restart }: any) {
  return <Card eyebrow="RESULTADO" title={safetyIntercepted ? "Entrega bloqueada de forma segura" : "Caso finalizado"} text="Revisa el desempeño registrado durante la simulación."><ResultsCard criteria={criteria} compact />{saving ? <p className="mt-3 text-xs text-slate-500">Guardando intento…</p> : saveResult ? <p className="mt-3 text-xs font-bold text-emerald-700">Intento guardado.</p> : null}<button className="mt-4 min-h-11 w-full rounded-xl border border-violet-200 font-bold text-violet-700" onClick={restart}>Repetir caso</button></Card>;
}

function ResultsCard({ criteria, compact = false }: { criteria: Record<DispensingCriterionId, CriterionStatus>; compact?: boolean }) {
  return <div className={compact ? "mt-4" : "rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"}>{!compact ? <h3 className="font-black text-slate-900">Resultados</h3> : null}<div className="mt-3 space-y-2">{criterionLabels.map(({ id, label }, index) => { const status = criteria[id]; return <div key={id} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"><p className="text-xs font-semibold leading-5 text-slate-700">{index + 1}. {label}</p><span className={cn("shrink-0 rounded-md px-2 py-1 text-[0.6rem] font-black", status === "met" ? "bg-emerald-100 text-emerald-700" : status === "intercepted" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700")}>{status === "met" ? "Cumple" : status === "intercepted" ? "Interceptado" : "Reforzar"}</span></div>; })}</div></div>;
}

function Card({ eyebrow, title, text, children }: { eyebrow?: string; title: string; text: string; children?: React.ReactNode }) {
  return <div>{eyebrow ? <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-violet-600">{eyebrow}</p> : null}<h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>{children ? <div className="mt-4">{children}</div> : null}</div>;
}
function ActionButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) { return <button className="mb-2 min-h-11 w-full rounded-xl border border-violet-200 bg-white px-4 text-left text-sm font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-45" disabled={disabled} onClick={onClick}>{children}</button>; }
