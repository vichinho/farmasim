"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { ambulatoryDispensingScenario } from "./scenario-data";
import type { DispensingChecklist, PrescriptionReview, SimulationEvent } from "./types";

type Focus = "patient" | "document" | "computer" | "prescriptions" | "tray" | "tens" | "instructions" | "handoff" | null;
type Field = "medication" | "concentration" | "form" | "quantity" | "directions";

const STORAGE_KEY = "farmaverse:operational-case-001";
const fields: Field[] = ["medication", "concentration", "form", "quantity", "directions"];
const fieldLabels: Record<Field, string> = { medication: "Medicamento", concentration: "Concentración", form: "Forma farmacéutica", quantity: "Cantidad", directions: "Indicación" };

function blankReview(): PrescriptionReview {
  return Object.fromEntries(ambulatoryDispensingScenario.prescriptions.map((prescription) => [
    prescription.id,
    { opened: false, reviewedFields: { medication: false, concentration: false, form: false, quantity: false, directions: false } },
  ]));
}

function blankChecklist(): DispensingChecklist {
  return { identificationRequested: false, patientVerifiedInSystem: false, allPrescriptionsReviewed: false, prescriptionsValidated: false, medicationPreparationChecked: false, finalPatientIdentityVerified: false, instructionsDelivered: false };
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    patient: <><circle cx="12" cy="7" r="3" /><path d="M5 21c.6-4.3 3-6.5 7-6.5s6.4 2.2 7 6.5" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="12" r="1.8" /><path d="M12 10h5M12 14h5M6 16h4" /></>,
    computer: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 21h8M12 16v5" /></>,
    prescription: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v5h5M10 12h5M10 16h5" /></>,
    tray: <><path d="M4 9h16l-2 10H6z" /><path d="M7 9 9 5h6l2 4M8 14h8" /></>,
    tens: <><circle cx="12" cy="7" r="3" /><path d="M6 21v-3a6 6 0 0 1 12 0v3M4 12h16" /></>,
    handoff: <><path d="M3 15h6l2 2h4l2-2h4" /><path d="M5 15V9h5l2 3 2-3h5v6M8 20h8" /></>,
    shield: <path d="M12 3 20 6v5c0 5-3.5 8.2-8 10-4.5-1.8-8-5-8-10V6z" />,
  };
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">{paths[name]}</svg>;
}

function SceneButton({ active, label, name, onClick, status }: { active: boolean; label: string; name: string; onClick: () => void; status?: string }) {
  return <button aria-label={label} className={`group absolute rounded-2xl border text-left shadow-lg transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${active ? "border-teal-300 bg-white/95 ring-4 ring-teal-400/20" : "border-white/80 bg-white/90 hover:-translate-y-0.5 hover:border-teal-300"}`} onClick={onClick} type="button">
    <span className="flex items-center gap-2 p-2.5 text-slate-800"><span className="rounded-xl bg-teal-50 p-2 text-teal-700"><Icon name={name} /></span><span><span className="block text-xs font-extrabold tracking-wide">{label}</span>{status ? <span className="mt-0.5 block text-[10px] text-slate-500">{status}</span> : null}</span></span>
  </button>;
}

export function PharmacySimulation() {
  const scenario = ambulatoryDispensingScenario;
  const [focus, setFocus] = useState<Focus>(null);
  const [checklist, setChecklist] = useState(blankChecklist);
  const [reviews, setReviews] = useState(blankReview);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [documentVisible, setDocumentVisible] = useState(false);
  const [systemOpen, setSystemOpen] = useState(false);
  const [trayCorrected, setTrayCorrected] = useState(false);
  const [incorrectConcentrationDetected, setIncorrectConcentrationDetected] = useState(false);
  const [openedPrepared, setOpenedPrepared] = useState<string[]>([]);
  const [instructionChoice, setInstructionChoice] = useState<string | null>(null);
  const [finalBarrier, setFinalBarrier] = useState(false);
  const [complete, setComplete] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) { setHasRestoredProgress(true); return; }
      try {
        const state = JSON.parse(saved) as Partial<{ checklist: DispensingChecklist; reviews: PrescriptionReview; documentVisible: boolean; systemOpen: boolean; trayCorrected: boolean; incorrectConcentrationDetected: boolean; openedPrepared: string[]; instructionChoice: string | null; events: SimulationEvent[] }>;
        if (state.checklist) setChecklist(state.checklist);
        if (state.reviews) setReviews(state.reviews);
        setDocumentVisible(Boolean(state.documentVisible)); setSystemOpen(Boolean(state.systemOpen)); setTrayCorrected(Boolean(state.trayCorrected)); setIncorrectConcentrationDetected(Boolean(state.incorrectConcentrationDetected)); setOpenedPrepared(state.openedPrepared ?? []); setInstructionChoice(state.instructionChoice ?? null); setEvents(state.events ?? []);
      } catch { window.localStorage.removeItem(STORAGE_KEY); }
      setHasRestoredProgress(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasRestoredProgress) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ checklist, reviews, documentVisible, systemOpen, trayCorrected, incorrectConcentrationDetected, openedPrepared, instructionChoice, events }));
  }, [checklist, reviews, documentVisible, systemOpen, trayCorrected, incorrectConcentrationDetected, openedPrepared, instructionChoice, events, hasRestoredProgress]);

  const reviewedAll = useMemo(() => scenario.prescriptions.every((p) => fields.every((field) => reviews[p.id].reviewedFields[field])), [reviews, scenario.prescriptions]);
  const openedAll = useMemo(() => scenario.prescriptions.every((p) => reviews[p.id].opened), [reviews, scenario.prescriptions]);
  const checklistForClose = { ...checklist, allPrescriptionsReviewed: reviewedAll, prescriptionsValidated: openedAll && scenario.prescriptions.every((p) => p.valid) };
  const prepared = scenario.preparedMedications.map((item) => item.id === "prepared-losartan" && trayCorrected ? { ...item, concentration: "50 mg" } : item);
  const criticalErrorRemains = !trayCorrected;

  function log(action: string) { setEvents((current) => [...current, { action, at: new Date().toISOString() }]); }
  function closeFocus() { setFocus(null); }
  function requestDocument() { setChecklist((current) => ({ ...current, identificationRequested: true })); setDocumentVisible(true); log("Solicitó documento de identidad"); }
  function searchPatient() { setChecklist((current) => ({ ...current, patientVerifiedInSystem: true })); setSystemOpen(true); log("Buscó paciente e ingresó identificador en sistema"); }
  function inspectPrescription(id: string, field?: Field) { setReviews((current) => ({ ...current, [id]: { opened: true, reviewedFields: { ...current[id].reviewedFields, ...(field ? { [field]: true } : {}) } } })); if (field) log(`Revisó ${fieldLabels[field].toLowerCase()} de ${id}`); else log(`Abrió ${id}`); }
  function inspectPrepared(id: string) { setOpenedPrepared((items) => items.includes(id) ? items : [...items, id]); log(`Inspeccionó ${id}`); }
  function confirmTray() { setChecklist((current) => ({ ...current, medicationPreparationChecked: true })); log("Confirmó preparación revisada"); closeFocus(); }
  function correctTray() { setTrayCorrected(true); setIncorrectConcentrationDetected(true); setChecklist((current) => ({ ...current, medicationPreparationChecked: false })); log("Solicitó corrección de preparación a TENS 2"); }
  function chooseInstruction(value: string) { setInstructionChoice(value); setChecklist((current) => ({ ...current, instructionsDelivered: value === "1 comprimido cada 12 horas" })); log("Entregó indicación al paciente"); }
  function verifyFinalIdentity() { setChecklist((current) => ({ ...current, finalPatientIdentityVerified: true })); log("Realizó confirmación de identidad antes del despacho"); }
  function attemptHandoff() { log("Intentó entregar medicamentos"); if (criticalErrorRemains) { setFinalBarrier(true); return; } setComplete(true); closeFocus(); }
  function restart() { window.localStorage.removeItem(STORAGE_KEY); setFocus(null); setChecklist(blankChecklist()); setReviews(blankReview()); setEvents([]); setDocumentVisible(false); setSystemOpen(false); setTrayCorrected(false); setIncorrectConcentrationDetected(false); setOpenedPrepared([]); setInstructionChoice(null); setFinalBarrier(false); setComplete(false); }

  return <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#edf5f4] shadow-[0_28px_70px_rgb(15_23_42/.14)]">
    <header className="flex flex-wrap items-center justify-between gap-4 bg-[#061126] px-5 py-4 text-white sm:px-7"><div><p className="text-[11px] font-extrabold tracking-[.16em] text-teal-300">FARMAVERSE · SIMULACIÓN OPERATIVA</p><h1 className="mt-1 text-xl font-bold">Una tarea a la vez</h1></div><div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2.5 w-2.5 rounded-full bg-teal-400" /> Caso 001 · En curso</div></header>
    <div className="grid min-h-[680px] xl:grid-cols-[220px_minmax(0,1fr)_290px]">
      <aside className="border-b border-slate-200 bg-white/80 p-5 xl:border-b-0 xl:border-r"><p className="text-[10px] font-extrabold tracking-[.15em] text-slate-500">CONTEXTO DEL CASO</p><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Hora</dt><dd className="mt-1 font-bold">08:37 h</dd></div><div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Puesto</dt><dd className="mt-1 font-bold">Ventanilla 01</dd></div><div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Turno</dt><dd className="mt-1 font-bold">A-01 · Paciente virtual</dd></div></dl><div className="mt-8 border-t border-slate-200 pt-5"><p className="text-[10px] font-extrabold tracking-[.15em] text-slate-500">RECORRIDO</p><ol className="mt-4 space-y-3 text-sm font-semibold text-slate-500">{["Atención", "Sistema", "Prescripciones", "Doble chequeo", "Despacho"].map((item, index) => <li className="flex gap-2" key={item}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600">{index + 1}</span>{item}</li>)}</ol></div></aside>
      <main className="p-4 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">Atención activa</span><h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">Estación de dispensación</h2><p className="mt-1 text-sm text-slate-600">Explora la escena y ejecuta las acciones que estimes necesarias.</p></div><button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50" onClick={() => setShowDebug((value) => !value)} type="button">Depuración</button></div>
        <div className="relative min-h-[430px] overflow-hidden rounded-[22px] border-4 border-white bg-slate-200 shadow-inner"><Image alt="Farmacia ficticia para entrenamiento" className="object-cover" fill priority sizes="(max-width: 1280px) 100vw, 60vw" src="/scenes/pharmacy-training-room-v3.png" /><div className="absolute inset-0 bg-gradient-to-t from-[#071c2aaa] via-transparent to-transparent" />
          <button className="absolute bottom-2 left-1/2 z-10 w-[43%] min-w-48 max-w-80 -translate-x-1/2 cursor-pointer focus-visible:outline-4 focus-visible:outline-teal-300" onClick={() => setFocus("patient")} type="button"><Image alt="Paciente virtual Luis Herrera" className="h-auto w-full drop-shadow-[0_18px_14px_rgb(0_0_0/.3)] transition group-hover:scale-[1.02]" draggable={false} height={1536} sizes="(max-width: 700px) 62vw, 20rem" src="/scenes/patient-a01-3d-render-v3.png" width={1024} /></button>
          <SceneButton active={focus === "patient"} label="Paciente" name="patient" onClick={() => setFocus("patient")} status="A-01 · En espera" />
          <div className="absolute left-3 top-3"><SceneButton active={focus === "document"} label="Documento" name="card" onClick={() => setFocus("document")} status={documentVisible ? "Disponible" : "Solicítalo al paciente"} /></div>
          <div className="absolute right-3 top-3"><SceneButton active={focus === "computer"} label="Computador" name="computer" onClick={() => setFocus("computer")} status={systemOpen ? "Ficha abierta" : "Sistema clínico"} /></div>
          <div className="absolute bottom-3 left-3"><SceneButton active={focus === "tens"} label="TENS 2" name="tens" onClick={() => setFocus("tens")} status="Preparación disponible" /></div>
          <div className="absolute bottom-3 right-3"><SceneButton active={focus === "tray"} label="Bandeja" name="tray" onClick={() => setFocus("tray")} status={trayCorrected ? "Nueva preparación" : "3 productos"} /></div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3"><button className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-teal-300" onClick={() => setFocus("prescriptions")} type="button"><span className="flex items-center gap-2 text-teal-700"><Icon name="prescription" /><b>Prescripciones</b></span><span className="mt-2 block text-xs text-slate-600">Tres registros independientes</span></button><button className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-teal-300" onClick={() => setFocus("instructions")} type="button"><span className="flex items-center gap-2 text-teal-700"><Icon name="card" /><b>Indicaciones</b></span><span className="mt-2 block text-xs text-slate-600">Orientación al paciente</span></button><button className="rounded-2xl bg-teal-700 p-4 text-left text-white shadow-sm hover:bg-teal-800" onClick={() => setFocus("handoff")} type="button"><span className="flex items-center gap-2"><Icon name="handoff" /><b>Despacho</b></span><span className="mt-2 block text-xs text-teal-100">Verifica y entrega al final</span></button></div>
      </main>
      <aside className="border-t border-slate-200 bg-white/80 p-5 xl:border-l xl:border-t-0"><p className="text-[10px] font-extrabold tracking-[.15em] text-slate-500">ESTADO DE SEGURIDAD</p><div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4"><div className="flex items-center gap-2 font-bold text-teal-950"><span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> Proceso en curso</div><p className="mt-2 text-sm leading-6 text-teal-900">El sistema registra las acciones. Puedes volver a revisar cualquier elemento antes del despacho.</p></div><div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Icon name="shield" /> Barreras disponibles</div><p className="mt-2 text-sm leading-6 text-slate-600">Identificación, revisión de ficha, doble chequeo y confirmación final.</p></div>{showDebug ? <pre className="mt-5 max-h-64 overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] leading-5 text-teal-200">{JSON.stringify({ checklist: checklistForClose, trayCorrected, incorrectConcentrationDetected, events }, null, 2)}</pre> : null}</aside>
    </div>
    {focus ? <InteractionDialog focus={focus} scenario={scenario} documentVisible={documentVisible} systemOpen={systemOpen} reviews={reviews} prepared={prepared} openedPrepared={openedPrepared} trayCorrected={trayCorrected} instructionChoice={instructionChoice} onClose={closeFocus} onRequestDocument={requestDocument} onSearchPatient={searchPatient} onInspectPrescription={inspectPrescription} onInspectPrepared={inspectPrepared} onConfirmTray={confirmTray} onCorrectTray={correctTray} onChooseInstruction={chooseInstruction} onVerifyFinalIdentity={verifyFinalIdentity} onAttemptHandoff={attemptHandoff} /> : null}
    {finalBarrier ? <FinalSafetyBarrier onContinue={() => { setFinalBarrier(false); setFocus("tray"); }} /> : null}
    {complete ? <SimulationFeedback checklist={checklistForClose} onRestart={restart} /> : null}
  </section>;
}

function InteractionDialog({ focus, scenario, documentVisible, systemOpen, reviews, prepared, openedPrepared, trayCorrected, instructionChoice, onClose, onRequestDocument, onSearchPatient, onInspectPrescription, onInspectPrepared, onConfirmTray, onCorrectTray, onChooseInstruction, onVerifyFinalIdentity, onAttemptHandoff }: { focus: Exclude<Focus, null>; scenario: typeof ambulatoryDispensingScenario; documentVisible: boolean; systemOpen: boolean; reviews: PrescriptionReview; prepared: typeof ambulatoryDispensingScenario.preparedMedications; openedPrepared: string[]; trayCorrected: boolean; instructionChoice: string | null; onClose: () => void; onRequestDocument: () => void; onSearchPatient: () => void; onInspectPrescription: (id: string, field?: Field) => void; onInspectPrepared: (id: string) => void; onConfirmTray: () => void; onCorrectTray: () => void; onChooseInstruction: (value: string) => void; onVerifyFinalIdentity: () => void; onAttemptHandoff: () => void }) {
  const heading: Record<Exclude<Focus, null>, string> = { patient: "Paciente virtual", document: "Documento de identidad", computer: "Sistema de ficha", prescriptions: "Prescripciones", tray: "Bandeja de preparación", tens: "Segunda TENS", instructions: "Indicaciones al paciente", handoff: "Despacho" };
  return <div aria-modal="true" className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:items-center" role="dialog"><div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[24px] bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold tracking-[.15em] text-teal-700">INTERACCIÓN CONTEXTUAL</p><h3 className="mt-1 text-2xl font-bold text-slate-950">{heading[focus]}</h3></div><button aria-label="Cerrar" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} type="button">Cerrar</button></div><div className="mt-5">{focus === "patient" ? <div><p className="text-lg leading-8 text-slate-700">“Buenas tardes, vengo a retirar mis medicamentos.”</p><div className="mt-5 flex flex-wrap gap-3"><Action label="Solicitar documento" onClick={onRequestDocument} /><Action label="Preguntar por el retiro" onClick={onClose} secondary /><Action label="Solicitar esperar un momento" onClick={onClose} secondary /></div></div> : null}
  {focus === "document" ? <div>{documentVisible ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-bold tracking-wider text-slate-500">CARNET · DATOS FICTICIOS</p><p className="mt-4 text-xl font-bold">{scenario.patient.fullName}</p><p className="mt-1 text-slate-600">RUT {scenario.patient.rut}</p></div> : <p className="leading-7 text-slate-600">El paciente puede presentar su documento durante la atención. Puedes solicitarlo directamente al paciente.</p>}</div> : null}
  {focus === "computer" ? <div><p className="text-slate-600">Terminal de consulta del paciente.</p><div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><label className="text-xs font-bold text-slate-600">RUT / identificador</label><div className="mt-2 flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" defaultValue={documentVisible ? scenario.patient.rut : ""} placeholder="Ingresa identificador" readOnly /><Action label={systemOpen ? "Ficha abierta" : "Buscar paciente"} onClick={onSearchPatient} /></div></div>{systemOpen ? <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4"><b>{scenario.patient.fullName}</b><p className="mt-1 text-sm text-teal-900">Ficha ficticia encontrada. Abre las prescripciones desde el panel correspondiente.</p></div> : null}</div> : null}
  {focus === "prescriptions" ? <div className="space-y-3">{scenario.prescriptions.map((prescription) => <PrescriptionCard key={prescription.id} prescription={prescription} review={reviews[prescription.id]} onInspect={onInspectPrescription} />)}</div> : null}
  {focus === "tray" ? <div><p className="text-slate-600">La TENS 2 dejó la preparación sobre el mesón. Consulta cada caja y contrástala con la ficha si lo consideras necesario.</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{prepared.map((medication) => <button className={`rounded-2xl border p-4 text-left transition hover:border-teal-400 ${openedPrepared.includes(medication.id) ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-white"}`} key={medication.id} onClick={() => onInspectPrepared(medication.id)} type="button"><span className="text-[10px] font-extrabold tracking-wider text-teal-700">CAJA</span><b className="mt-2 block text-lg">{medication.name}</b><p className="mt-1 text-sm text-slate-600">{openedPrepared.includes(medication.id) ? `${medication.concentration} · ${medication.form} · ${medication.quantity} unidades` : "Abrir para revisar"}</p></button>)}</div><div className="mt-5 flex flex-wrap gap-3"><Action label="Preparación revisada" onClick={onConfirmTray} /><Action label={trayCorrected ? "Corrección solicitada" : "Solicitar corrección a TENS 2"} onClick={onCorrectTray} secondary /></div></div> : null}
  {focus === "tens" ? <div><p className="leading-7 text-slate-600">La segunda TENS realizó la preparación y la dejó disponible en bandeja. Su preparación requiere una revisión independiente antes del despacho.</p><Action label="Revisar bandeja" onClick={() => { onClose(); }} /></div> : null}
  {focus === "instructions" ? <div><p className="text-slate-600">El paciente pregunta cómo debe tomar Losartán. Selecciona la indicación que entregarás.</p><div className="mt-4 grid gap-3">{["1 comprimido cada 12 horas", "1 comprimido cada 24 horas", "2 comprimidos cada 12 horas"].map((option) => <button className={`rounded-xl border p-4 text-left text-sm font-semibold ${instructionChoice === option ? "border-teal-500 bg-teal-50 text-teal-950" : "border-slate-200 hover:border-teal-300"}`} key={option} onClick={() => onChooseInstruction(option)} type="button">{option}</button>)}</div></div> : null}
  {focus === "handoff" ? <div><p className="leading-7 text-slate-600">Antes de entregar, aún puedes confirmar la identidad del paciente o revisar nuevamente la preparación.</p><div className="mt-5 flex flex-wrap gap-3"><Action label="Confirmar nombre y RUT" onClick={onVerifyFinalIdentity} secondary /><Action label="ENTREGAR MEDICAMENTOS" onClick={onAttemptHandoff} /></div></div> : null}</div></div></div>;
}

function PrescriptionCard({ prescription, review, onInspect }: { prescription: typeof ambulatoryDispensingScenario.prescriptions[number]; review: PrescriptionReview[string]; onInspect: (id: string, field?: Field) => void }) {
  return <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-slate-500">PRESCRIPCIÓN {prescription.id.slice(-2)}</p><b>{prescription.medication.name}</b></div><Action label={review.opened ? "Registro abierto" : "Abrir registro"} onClick={() => onInspect(prescription.id)} secondary /></div>{review.opened ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{fields.map((field) => <button className={`rounded-lg border px-3 py-2 text-left text-sm ${review.reviewedFields[field] ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-300"}`} key={field} onClick={() => onInspect(prescription.id, field)} type="button"><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{fieldLabels[field]}</span><span className="font-semibold">{field === "medication" ? prescription.medication.name : field === "concentration" ? prescription.medication.concentration : field === "form" ? prescription.medication.form : field === "quantity" ? prescription.medication.quantity : prescription.medication.directions}</span></button>)}</div> : null}</article>;
}

function Action({ label, onClick, secondary = false }: { label: string; onClick: () => void; secondary?: boolean }) { return <button className={`rounded-xl px-4 py-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${secondary ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50" : "bg-teal-700 text-white hover:bg-teal-800"}`} onClick={onClick} type="button">{label}</button>; }

function FinalSafetyBarrier({ onContinue }: { onContinue: () => void }) { return <div aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-[#050b19]/80 p-4 backdrop-blur-md" role="alertdialog"><div className="w-full max-w-2xl rounded-[28px] border border-amber-400/50 bg-white p-7 shadow-2xl sm:p-10"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><Icon name="shield" /></div><p className="mt-6 text-sm font-extrabold tracking-[.16em] text-amber-700">DETENTE</p><h2 className="mt-2 text-3xl font-bold text-slate-950">Error de medicación interceptado</h2><p className="mt-3 font-bold text-rose-700">NO ENTREGAR</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-slate-100 p-4"><p className="text-xs font-bold tracking-wide text-slate-500">PRESCRIPCIÓN</p><p className="mt-2 font-semibold">Losartán 50 mg<br />Comprimidos · cantidad 30</p></div><div className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="text-xs font-bold tracking-wide text-rose-700">PREPARACIÓN</p><p className="mt-2 font-semibold text-rose-950">Losartán 100 mg<br />Comprimidos · cantidad 30</p></div></div><p className="mt-6 leading-7 text-slate-700">La concentración incorrecta no fue detectada durante el doble chequeo. La simulación interceptó el error antes de que el medicamento alcanzara al paciente.</p><Action label="Volver a la preparación" onClick={onContinue} /></div></div>; }

function SimulationFeedback({ checklist, onRestart }: { checklist: DispensingChecklist; onRestart: () => void }) { const criteria = [{ label: "Identificación", value: checklist.identificationRequested }, { label: "Verificación en sistema", value: checklist.patientVerifiedInSystem }, { label: "Prescripciones", value: checklist.allPrescriptionsReviewed }, { label: "Recetas emitidas", value: checklist.prescriptionsValidated }, { label: "Preparación", value: checklist.medicationPreparationChecked }, { label: "Identidad final", value: checklist.finalPatientIdentityVerified }, { label: "Indicaciones", value: checklist.instructionsDelivered }]; return <div aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog"><div className="w-full max-w-2xl rounded-[28px] bg-white p-7 shadow-2xl sm:p-10"><p className="text-xs font-extrabold tracking-[.15em] text-teal-700">CIERRE DEL ESCENARIO</p><h2 className="mt-2 text-3xl font-bold">Proceso finalizado</h2><div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5"><p className="font-bold text-teal-950">NO OLVIDAR</p><p className="mt-2 leading-7 text-teal-900">Antes del despacho verifica medicamento, concentración, forma farmacéutica y cantidad.</p></div><div className="mt-6 grid gap-2 sm:grid-cols-2">{criteria.map((criterion) => <div className="rounded-xl border border-slate-200 p-3 text-sm" key={criterion.label}><b>{criterion.label}</b><span className={`ml-2 text-xs font-bold ${criterion.value ? "text-teal-700" : "text-amber-700"}`}>{criterion.value ? "Cumplido" : "En refuerzo"}</span></div>)}</div><p className="mt-6 text-sm leading-6 text-slate-600">Para el siguiente caso, se puede reforzar la misma competencia con una concentración distinta, por ejemplo Amlodipino 5 mg versus 10 mg.</p><Action label="Reiniciar escenario" onClick={onRestart} /></div></div>; }
