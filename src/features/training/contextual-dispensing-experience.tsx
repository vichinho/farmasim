"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { saveSimulationAttempt, type SaveSimulationAttemptResult } from "@/features/progress/actions";
import { Case001IllustratedScene } from "@/features/training/case001-illustrated-scene";
import type { SceneHotspotId } from "@/features/training/case001-scene-hotspots";
import { cn } from "@/lib/utils";
import type { DispensingCriterionId, TrainingCase, TrainingMode } from "@/types/training-simulation";

type Props = { levelNumber: number; mode: TrainingMode; trainingCase: TrainingCase };
type CriterionStatus = "pending" | "met" | "missed" | "intercepted";
type PreparationState = "idle" | "preparing" | "delivering" | "delivered";
type Phase = "active" | "safety-stop" | "result";
type Field = "name" | "strength" | "form" | "quantity";

type Prescription = {
  id: string;
  title: string;
  medication: string;
  strength: string;
  form: string;
  quantity: string;
  status: string;
};

type Medication = {
  id: string;
  name: string;
  strength: string;
  expectedStrength: string;
  form: string;
  quantity: string;
  expectedQuantity: string;
};

type Scenario = {
  caseLabel: string;
  mission: string;
  patient: { name: string; rut: string; dialogue: string };
  prescriptions: Prescription[];
  medications: Medication[];
};

const criterionLabels: { id: DispensingCriterionId; label: string }[] = [
  { id: "criterion-1-request-identity-document", label: "Solicita carnet de identidad y/o crónico" },
  { id: "criterion-2-system-identity-match", label: "Digita RUT y verifica nombre de usuario" },
  { id: "criterion-3-identify-all-prescriptions", label: "Identifica todas las prescripciones disponibles" },
  { id: "criterion-4-confirm-prescription-issued", label: "Verifica que la receta esté emitida" },
  { id: "criterion-5-compare-prepared-items", label: "Medicamentos preparados corresponden a la receta" },
  { id: "criterion-6-recheck-identity-before-handoff", label: "Vuelve a verificar identidad antes de la entrega" },
  { id: "criterion-7-provide-corresponding-instructions", label: "Entrega las indicaciones correspondientes" },
];

const nextCaseByLevel: Partial<Record<number, string>> = {
  2: "case-003-concentration-reinforcement",
  3: "case-004-concentration-reinforcement",
  4: "case-005-storage-review",
  6: "case-007-expert-mode",
};

const initialCriteria = () => Object.fromEntries(criterionLabels.map(({ id }) => [id, "pending"])) as Record<DispensingCriterionId, CriterionStatus>;
const normalizeRut = (value: string) => value.toUpperCase().replace(/[^0-9K]/g, "");

function scenarioFor(caseId: string): Scenario {
  if (caseId === "case-002-concentration-reinforcement") {
    return {
      caseLabel: "Caso 002",
      mission: "Atiende al usuario y completa la dispensación de manera segura.",
      patient: { name: "Carolina Soto Vera", rut: "16.542.781-3", dialogue: "Buenas, vengo a retirar los medicamentos que aparecen disponibles." },
      prescriptions: [
        { id: "r1", title: "Registro 1", medication: "Metformina", strength: "500 mg", form: "Comprimido", quantity: "60 unidades", status: "Emitida" },
        { id: "r2", title: "Registro 2", medication: "Atorvastatina", strength: "20 mg", form: "Comprimido", quantity: "30 unidades", status: "Emitida" },
      ],
      medications: [
        { id: "metformina", name: "Metformina", strength: "850 mg", expectedStrength: "500 mg", form: "Comprimido", quantity: "60 unidades", expectedQuantity: "60 unidades" },
        { id: "atorvastatina", name: "Atorvastatina", strength: "20 mg", expectedStrength: "20 mg", form: "Comprimido", quantity: "30 unidades", expectedQuantity: "30 unidades" },
      ],
    };
  }

  if (caseId === "case-003-concentration-reinforcement") {
    return {
      caseLabel: "Caso 003",
      mission: "Atiende al usuario y completa la dispensación de manera segura.",
      patient: { name: "Diego Morales Rojas", rut: "19.331.245-K", dialogue: "Buenas tardes, me indicaron que mi solicitud ya está disponible." },
      prescriptions: [
        { id: "r1", title: "Registro 1", medication: "Amlodipino", strength: "5 mg", form: "Comprimido", quantity: "30 unidades", status: "Emitida" },
        { id: "r2", title: "Registro 2", medication: "Enalapril", strength: "10 mg", form: "Comprimido", quantity: "30 unidades", status: "Emitida" },
      ],
      medications: [
        { id: "amlodipino", name: "Amlodipino", strength: "10 mg", expectedStrength: "5 mg", form: "Comprimido", quantity: "30 unidades", expectedQuantity: "30 unidades" },
        { id: "enalapril", name: "Enalapril", strength: "10 mg", expectedStrength: "10 mg", form: "Comprimido", quantity: "30 unidades", expectedQuantity: "30 unidades" },
      ],
    };
  }

  if (caseId === "case-004-concentration-reinforcement") {
    return {
      caseLabel: "Caso 004",
      mission: "Atiende al usuario y completa la dispensación de manera segura.",
      patient: { name: "Marcela Fuentes Díaz", rut: "14.887.620-5", dialogue: "Hola, necesito retirar una solicitud pendiente." },
      prescriptions: [
        { id: "r1", title: "Registro 1", medication: "Omeprazol", strength: "20 mg", form: "Cápsula", quantity: "30 unidades", status: "Emitida" },
        { id: "r2", title: "Registro 2", medication: "Paracetamol", strength: "500 mg", form: "Comprimido", quantity: "20 unidades", status: "Emitida" },
      ],
      medications: [
        { id: "omeprazol", name: "Omeprazol", strength: "40 mg", expectedStrength: "20 mg", form: "Cápsula", quantity: "30 unidades", expectedQuantity: "30 unidades" },
        { id: "paracetamol", name: "Paracetamol", strength: "500 mg", expectedStrength: "500 mg", form: "Comprimido", quantity: "20 unidades", expectedQuantity: "20 unidades" },
      ],
    };
  }

  if (caseId === "case-006-multiple-errors") {
    return {
      caseLabel: "Caso 006",
      mission: "Completa la atención y toma decisiones seguras frente a la información disponible.",
      patient: { name: "Rosa Jiménez Araya", rut: "11.753.902-7", dialogue: "Buenos días. Vengo a retirar una solicitud que aparece como disponible." },
      prescriptions: [
        { id: "r1", title: "Registro 1", medication: "Producto F-210", strength: "50 mg", form: "Comprimido", quantity: "30 unidades", status: "Emitida" },
        { id: "r2", title: "Registro 2", medication: "Hidroclorotiazida", strength: "25 mg", form: "Comprimido", quantity: "30 unidades", status: "Emitida" },
      ],
      medications: [
        { id: "f210", name: "Producto F-210", strength: "100 mg", expectedStrength: "50 mg", form: "Comprimido", quantity: "60 unidades", expectedQuantity: "30 unidades" },
        { id: "hctz", name: "Hidroclorotiazida", strength: "25 mg", expectedStrength: "25 mg", form: "Comprimido", quantity: "30 unidades", expectedQuantity: "30 unidades" },
      ],
    };
  }

  return {
    caseLabel: "Caso 007",
    mission: "Completa la atención de forma autónoma y segura.",
    patient: { name: "Luis Herrera Silva", rut: "13.608.441-2", dialogue: "Hola. Vengo a retirar una solicitud que aparece como disponible." },
    prescriptions: [
      { id: "r1", title: "Registro 1", medication: "Producto F-310", strength: "25 mg", form: "Comprimido", quantity: "30 unidades", status: "Emitida" },
      { id: "r2", title: "Registro 2", medication: "Metformina", strength: "500 mg", form: "Comprimido", quantity: "60 unidades", status: "Emitida" },
    ],
    medications: [
      { id: "f310", name: "Producto F-310", strength: "50 mg", expectedStrength: "25 mg", form: "Comprimido", quantity: "30 unidades", expectedQuantity: "30 unidades" },
      { id: "metformina", name: "Metformina", strength: "500 mg", expectedStrength: "500 mg", form: "Comprimido", quantity: "30 unidades", expectedQuantity: "60 unidades" },
    ],
  };
}

export function ContextualDispensingExperience({ levelNumber, mode, trainingCase }: Props) {
  const scenario = useMemo(() => scenarioFor(trainingCase.id), [trainingCase.id]);
  const storageKey = `farmasim-contextual-${trainingCase.id}-v1`;
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
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveSimulationAttemptResult | null>(null);
  const attemptId = useRef(crypto.randomUUID());
  const startedAt = useRef(new Date().toISOString());

  const trayVisible = preparationState === "delivered";
  const mismatches = scenario.medications.filter((m) => m.strength !== m.expectedStrength || m.quantity !== m.expectedQuantity);
  const mismatchExists = mismatches.length > 0;
  const guidance = mode.guidance;
  const nextCaseSlug = nextCaseByLevel[levelNumber];
  const nextCaseHref = nextCaseSlug ? `/simulaciones/${nextCaseSlug}?nivel=${levelNumber + 1}` : null;

  useEffect(() => {
    if (preparationState !== "preparing") return;
    const timer = window.setTimeout(() => { setPreparationState("delivering"); setEvent("TENS 2 finalizó la preparación y se dirige al mesón."); }, 900);
    return () => window.clearTimeout(timer);
  }, [preparationState]);

  useEffect(() => {
    if (preparationState !== "delivering") return;
    const timer = window.setTimeout(() => { setPreparationState("delivered"); setEvent("Preparación recibida."); setSelected("tray"); }, 1100);
    return () => window.clearTimeout(timer);
  }, [preparationState]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const r = JSON.parse(raw);
      if (r.criteria) setCriteria(r.criteria);
      if (typeof r.documentVisible === "boolean") setDocumentVisible(r.documentVisible);
      if (typeof r.documentRead === "boolean") setDocumentRead(r.documentRead);
      if (typeof r.reasonAsked === "boolean") setReasonAsked(r.reasonAsked);
      if (typeof r.rut === "string") setRut(r.rut);
      if (typeof r.patientLoaded === "boolean") setPatientLoaded(r.patientLoaded);
      if (Array.isArray(r.openedPrescriptions)) setOpenedPrescriptions(r.openedPrescriptions);
      if (r.preparationState) setPreparationState(r.preparationState);
      if (r.inspected) setInspected(r.inspected);
      if (r.preparationDecision) setPreparationDecision(r.preparationDecision);
      if (typeof r.discrepancyResolved === "boolean") setDiscrepancyResolved(r.discrepancyResolved);
      if (typeof r.finalIdentityChecked === "boolean") setFinalIdentityChecked(r.finalIdentityChecked);
      if (typeof r.instructionsGiven === "boolean") setInstructionsGiven(r.instructionsGiven);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (phase !== "active") return;
    try { localStorage.setItem(storageKey, JSON.stringify({ criteria, documentVisible, documentRead, reasonAsked, rut, patientLoaded, openedPrescriptions, preparationState, inspected, preparationDecision, discrepancyResolved, finalIdentityChecked, instructionsGiven })); } catch {}
  }, [phase, storageKey, criteria, documentVisible, documentRead, reasonAsked, rut, patientLoaded, openedPrescriptions, preparationState, inspected, preparationDecision, discrepancyResolved, finalIdentityChecked, instructionsGiven]);

  const progress = useMemo(() => {
    const milestones = [documentVisible, patientLoaded, openedPrescriptions.length === scenario.prescriptions.length, preparationState !== "idle", trayVisible, preparationDecision !== null, finalIdentityChecked, instructionsGiven, phase !== "active"];
    return Math.max(8, Math.round((milestones.filter(Boolean).length / milestones.length) * 100));
  }, [documentVisible, patientLoaded, openedPrescriptions.length, scenario.prescriptions.length, preparationState, trayVisible, preparationDecision, finalIdentityChecked, instructionsGiven, phase]);

  const information = useMemo(() => {
    const items: string[] = [];
    if (reasonAsked) items.push("Motivo informado: retiro de medicamentos.");
    if (documentRead) items.push(`Documento: ${scenario.patient.name} · RUT ${scenario.patient.rut}.`);
    if (patientLoaded) items.push(`Sistema: ficha ficticia de ${scenario.patient.name} disponible.`);
    if (openedPrescriptions.length > 0) items.push(`Registros revisados: ${openedPrescriptions.length} de ${scenario.prescriptions.length}.`);
    if (trayVisible) items.push("TENS 2 dejó una preparación sobre el mesón.");
    return items;
  }, [reasonAsked, documentRead, patientLoaded, openedPrescriptions.length, scenario, trayVisible]);

  const workspace = selected === "computer" ? "system" : selected === "tray" || selected === "preparation" ? "preparation" : selected === "storage" ? "storage" : "service";
  const setCriterion = (id: DispensingCriterionId, status: CriterionStatus) => setCriteria((current) => current[id] === "intercepted" ? current : { ...current, [id]: status });

  function interact(id: SceneHotspotId) {
    if (phase !== "active") return;
    setSelected(id); setEvent(null);
    if (id === "computer" && !documentVisible && criteria["criterion-1-request-identity-document"] === "pending") setCriterion("criterion-1-request-identity-document", "missed");
  }

  function requestDocument() { setDocumentVisible(true); setCriterion("criterion-1-request-identity-document", "met"); setEvent("El paciente dejó su documento sobre el mesón."); setSelected("document"); }
  function searchPatient() {
    if (normalizeRut(rut) !== normalizeRut(scenario.patient.rut)) { setEvent("No se encontró un usuario con ese identificador."); return; }
    setPatientLoaded(true); setCriterion("criterion-2-system-identity-match", documentRead ? "met" : "missed"); setEvent(null);
  }
  function openPrescription(id: string) { setOpenedPrescriptions((current) => Array.from(new Set([...current, id]))); }
  function sendToPreparation() {
    setCriterion("criterion-3-identify-all-prescriptions", openedPrescriptions.length === scenario.prescriptions.length ? "met" : "missed");
    setCriterion("criterion-4-confirm-prescription-issued", openedPrescriptions.length === scenario.prescriptions.length && scenario.prescriptions.every((p) => p.status === "Emitida") ? "met" : "missed");
    setPreparationState("preparing"); setSelected("preparation"); setEvent("Solicitud enviada al rol de preparación.");
  }
  function inspectMedication(id: string, field: Field) { setInspected((current) => ({ ...current, [id]: Array.from(new Set([...(current[id] ?? []), field])) })); }
  function markConform() { setPreparationDecision("conform"); setCriterion("criterion-5-compare-prepared-items", mismatchExists ? "missed" : "met"); setEvent("Preparación marcada como conforme."); setSelected("patient"); }
  function requestCorrection() { setPreparationDecision("correction"); setDiscrepancyResolved(true); setCriterion("criterion-5-compare-prepared-items", "intercepted"); setEvent("TENS 2 corrigió la preparación antes del despacho."); setSelected("patient"); }
  function verifyFinalIdentity() { setFinalIdentityChecked(true); setCriterion("criterion-6-recheck-identity-before-handoff", "met"); }
  function giveInstructions() { setInstructionsGiven(true); setCriterion("criterion-7-provide-corresponding-instructions", "met"); }

  function playSafetySignal() {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate([140, 80, 140, 80, 220]);
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      [0, .22, .44].forEach((offset, index) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.value = index % 2 === 0 ? 760 : 520; g.gain.value = .08; o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + offset); o.stop(ctx.currentTime + offset + .16); });
    } catch {}
  }

  async function persist(finalCriteria: Record<DispensingCriterionId, CriterionStatus>) {
    if (saving) return;
    setSaving(true);
    const results = criterionLabels.map(({ id }) => ({ criterionId: id, status: finalCriteria[id] === "met" ? "met" : finalCriteria[id] === "intercepted" ? "intercepted" : "reinforcement" }));
    const correctAnswers = results.filter((r) => r.status !== "reinforcement").length;
    const result = await saveSimulationAttempt({
      attemptId: attemptId.current,
      correctAnswers,
      incorrectAnswers: results.length - correctAnswers,
      levelNumber,
      scenarioSlug: trainingCase.id,
      startedAt: startedAt.current,
    });
    setSaveResult(result);
    setSaving(false);
  }

  function attemptDelivery() {
    const next = { ...criteria };
    if (!finalIdentityChecked && next["criterion-6-recheck-identity-before-handoff"] === "pending") next["criterion-6-recheck-identity-before-handoff"] = "missed";
    if (!instructionsGiven && next["criterion-7-provide-corresponding-instructions"] === "pending") next["criterion-7-provide-corresponding-instructions"] = "missed";
    setCriteria(next);
    if (mismatchExists && !discrepancyResolved) { setPhase("safety-stop"); setEvent("Entrega bloqueada por barrera de seguridad."); playSafetySignal(); void persist(next); return; }
    setPhase("result"); localStorage.removeItem(storageKey); void persist(next);
  }

  function restart() {
    localStorage.removeItem(storageKey); setPhase("active"); setSelected(null); setCriteria(initialCriteria()); setDocumentVisible(false); setDocumentRead(false); setReasonAsked(false); setRut(""); setPatientLoaded(false); setOpenedPrescriptions([]); setPreparationState("idle"); setInspected({}); setPreparationDecision(null); setDiscrepancyResolved(false); setFinalIdentityChecked(false); setInstructionsGiven(false); setEvent(null); setSaveResult(null); attemptId.current = crypto.randomUUID(); startedAt.current = new Date().toISOString();
  }

  const completionSaved = saveResult?.status === "saved" || saveResult?.status === "duplicate";

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-violet-100 bg-white shadow-[0_22px_70px_rgba(76,48,130,.13)]">
      <header className="grid gap-4 border-b border-violet-100 bg-white px-5 py-4 lg:grid-cols-[1fr_minmax(18rem,32rem)_auto] lg:items-center">
        <div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-violet-700 text-2xl font-black text-white">+</div><div><p className="text-xl font-black tracking-tight text-violet-800">FarmaSim</p><p className="text-xs font-semibold text-slate-500">Simulaciones · {scenario.caseLabel}</p></div></div>
        <div><div className="mb-2 flex justify-between text-xs font-black text-slate-700"><span>Progreso del caso</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${progress}%` }} /></div></div>
        <div className="flex justify-end gap-2"><span className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">★ {mode.shortLabel}</span><span className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black">{trainingCase.context.timeLabel}</span></div>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_27.5rem]">
        <div className="min-w-0 border-b border-violet-100 xl:border-b-0 xl:border-r">
          <div className="relative min-h-[720px] overflow-hidden bg-[#eef1f6]">
            <Case001IllustratedScene workspace={workspace} documentVisible={documentVisible} trayVisible={trayVisible} preparationState={preparationState} guidance={guidance} activeHotspot={selected} onHotspotClick={interact} />
            <div className="absolute bottom-5 left-5 z-30 w-[min(92%,27rem)]"><div className="max-h-[470px] overflow-auto rounded-[1.2rem] border border-violet-100 bg-white/96 p-5 shadow-[0_16px_42px_rgba(17,24,39,.13)] backdrop-blur-xl">
              {phase === "safety-stop" ? (
                <div><p className="text-xs font-black uppercase tracking-[.16em] text-rose-600">🚨 DETENTE</p><h2 className="mt-2 text-2xl font-black text-slate-950">Error de medicación interceptado</h2><p className="mt-2 font-black text-rose-700">NO ENTREGAR</p><div className="mt-4 space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm">{mismatches.map((m) => <p key={m.id}><strong>{m.name}</strong>: esperado {m.expectedStrength}, preparado {m.strength}{m.quantity !== m.expectedQuantity ? ` · cantidad esperada ${m.expectedQuantity}, preparada ${m.quantity}` : ""}.</p>)}</div><div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-black">💡 NO OLVIDAR</p><p className="mt-1 text-sm">Antes del despacho verifica medicamento, concentración, forma farmacéutica y cantidad.</p></div><button className="mt-4 min-h-11 w-full rounded-xl bg-violet-700 px-4 font-bold text-white" onClick={() => setPhase("result")}>Ver resultados</button></div>
              ) : phase === "result" ? (
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">Resultados</p>
                  <h2 className="mt-2 text-2xl font-black">Resultado del caso</h2>
                  <div className="mt-4 space-y-2">{criterionLabels.map((c, i) => <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2" key={c.id}><span className="text-sm font-semibold">{i + 1}. {c.label}</span><span className={cn("rounded-md px-2 py-1 text-xs font-black", criteria[c.id] === "met" ? "bg-emerald-50 text-emerald-700" : criteria[c.id] === "intercepted" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700")}>{criteria[c.id] === "met" ? "Cumple" : criteria[c.id] === "intercepted" ? "Interceptado" : "Refuerzo"}</span></div>)}</div>
                  {saving ? <p className="mt-3 text-xs text-slate-500">Guardando progreso…</p> : saveResult?.status === "error" ? <p className="mt-3 text-xs font-bold text-rose-600">{saveResult.message}</p> : completionSaved ? <p className="mt-3 text-xs font-bold text-emerald-700">Caso completado y progreso actualizado.</p> : null}
                  {completionSaved && nextCaseHref ? <a className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-violet-700 px-4 text-center font-bold text-white shadow-sm hover:bg-violet-800" href={nextCaseHref}>Pasar al siguiente caso</a> : null}
                  {completionSaved && !nextCaseHref ? <a className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-violet-700 px-4 text-center font-bold text-white shadow-sm hover:bg-violet-800" href="/simulaciones">Volver a simulaciones</a> : null}
                  <button className="mt-3 min-h-11 w-full rounded-xl border border-violet-200 bg-white px-4 font-bold text-violet-700" onClick={restart}>Repetir caso</button>
                </div>
              ) : selected === null ? (
                <div><p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">Nueva atención</p><h2 className="mt-2 text-2xl font-black">Paciente en ventanilla</h2><p className="mt-2 text-sm text-slate-600">“{scenario.patient.dialogue}”</p><p className="mt-4 rounded-xl bg-violet-50 p-3 text-sm font-semibold text-violet-800">Interactúa con el entorno para realizar la atención.</p></div>
              ) : selected === "patient" ? (
                <div><p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">Paciente</p><h2 className="mt-2 text-xl font-black">Interactuar</h2><div className="mt-4 grid gap-2">{!documentVisible && <button className="rounded-xl border border-violet-200 px-4 py-3 text-left text-sm font-bold hover:bg-violet-50" onClick={requestDocument}>Solicitar documento</button>}<button className="rounded-xl border border-violet-200 px-4 py-3 text-left text-sm font-bold hover:bg-violet-50" onClick={() => setReasonAsked(true)}>Consultar motivo del retiro</button>{preparationDecision && <><button className="rounded-xl border border-violet-200 px-4 py-3 text-left text-sm font-bold hover:bg-violet-50" onClick={verifyFinalIdentity}>Verificar identidad antes de entregar</button><button className="rounded-xl border border-violet-200 px-4 py-3 text-left text-sm font-bold hover:bg-violet-50" onClick={giveInstructions}>Entregar indicaciones</button><button className="rounded-xl bg-violet-700 px-4 py-3 text-left text-sm font-bold text-white" onClick={attemptDelivery}>Entregar</button></>}</div></div>
              ) : selected === "document" ? (
                <div><p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">Documento ficticio</p><h2 className="mt-2 text-xl font-black">Identificación</h2>{documentRead ? <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-4"><p className="font-black">{scenario.patient.name}</p><p className="mt-1 text-sm">RUT {scenario.patient.rut}</p></div> : <button className="mt-4 min-h-11 w-full rounded-xl bg-violet-700 px-4 font-bold text-white" onClick={() => setDocumentRead(true)}>Examinar documento</button>}</div>
              ) : selected === "computer" ? (
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">SISTEMA</p>
                  <h2 className="mt-2 text-xl font-black">Buscar usuario</h2>
                  <p className="mt-2 text-sm text-slate-600">Ingresa manualmente el identificador que tengas disponible.</p>
                  <label className="mb-1 mt-4 block text-xs font-black text-slate-700">RUT</label>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><input className="min-h-11 rounded-xl border border-violet-200 px-3 text-sm outline-none focus:border-violet-500" value={rut} onChange={(e) => setRut(e.target.value)} placeholder="RUT" /><button className="rounded-xl bg-violet-700 px-4 text-sm font-bold text-white" onClick={searchPatient}>Buscar</button></div>
                  {patientLoaded ? <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3"><p className="font-black text-slate-900">{scenario.patient.name}</p><p className="mt-1 text-xs text-slate-500">Prescripciones disponibles: {scenario.prescriptions.length}</p><div className="mt-3 space-y-2">{scenario.prescriptions.map((prescription) => <PrescriptionCard key={prescription.id} prescription={prescription} opened={openedPrescriptions.includes(prescription.id)} onOpen={() => openPrescription(prescription.id)} />)}</div><button className="mt-4 min-h-11 w-full rounded-xl bg-violet-700 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={sendToPreparation} disabled={preparationState !== "idle"}>Enviar solicitud a preparación</button></div> : null}
                </div>
              ) : selected === "preparation" ? (
                <div><p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">Rol de preparación</p><h2 className="mt-2 text-xl font-black">TENS 2</h2><p className="mt-2 text-sm text-slate-600">Estado: {preparationState === "idle" ? "En espera" : preparationState === "preparing" ? "Preparando" : preparationState === "delivering" ? "Trasladando preparación" : "Preparación entregada"}.</p></div>
              ) : selected === "tray" && trayVisible ? (
                <div><p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">Bandeja</p><h2 className="mt-2 text-xl font-black">Revisar preparación</h2><div className="mt-4 space-y-3">{scenario.medications.map((m) => <div key={m.id} className="rounded-xl border border-slate-200 p-3"><p className="font-black">{m.name}</p><div className="mt-2 grid grid-cols-2 gap-2">{(["name","strength","form","quantity"] as Field[]).map((f) => <button key={f} className={cn("rounded-lg border px-2 py-2 text-xs font-bold", (inspected[m.id] ?? []).includes(f) ? "border-violet-400 bg-violet-50" : "border-slate-200")} onClick={() => inspectMedication(m.id, f)}>{f === "name" ? m.name : f === "strength" ? m.strength : f === "form" ? m.form : m.quantity}</button>)}</div></div>)}</div><div className="mt-4 grid gap-2 sm:grid-cols-2"><button className="rounded-xl border border-violet-200 px-3 py-3 text-sm font-bold" onClick={markConform}>Preparación conforme</button><button className="rounded-xl bg-violet-700 px-3 py-3 text-sm font-bold text-white" onClick={requestCorrection}>Solicitar corrección</button></div></div>
              ) : <div><p className="text-sm text-slate-600">Selecciona un elemento disponible de la escena.</p></div>}
            </div></div>
          </div>
        </div>

        <aside className="space-y-4 bg-[#fcfcfe] p-5">
          {phase === "result" ? null : <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">Misión</p><p className="mt-2 text-base font-bold text-slate-900">{scenario.mission}</p></div>}
          {phase === "result" ? null : <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"><h3 className="font-black">Información disponible</h3>{information.length ? <ul className="mt-3 space-y-2 text-sm text-slate-600">{information.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Aún no has obtenido información adicional.</p>}</div>}
          {event && phase === "active" ? <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4"><p className="text-xs font-black uppercase tracking-[.14em] text-violet-600">Evento</p><p className="mt-2 text-sm font-semibold text-slate-800">{event}</p></div> : null}
        </aside>
      </div>
      <footer className="border-t border-violet-100 bg-white px-5 py-3 text-center text-xs font-semibold text-slate-500">ⓘ &nbsp; Simulación interactiva — no reemplaza protocolos institucionales.</footer>
    </div>
  );
}

function PrescriptionCard({ prescription, opened, onOpen }: { prescription: Prescription; opened: boolean; onOpen: () => void }) {
  return <div className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm font-bold">{prescription.title}</span><button className="text-xs font-black text-violet-700" onClick={onOpen}>{opened ? "Abierto" : "Abrir"}</button></div>{opened ? <div className="mt-2 border-t border-slate-100 pt-2 text-xs leading-5 text-slate-600"><p>{prescription.medication} · {prescription.strength}</p><p>{prescription.form} · {prescription.quantity}</p><p>Estado: {prescription.status}</p></div> : null}</div>;
}
