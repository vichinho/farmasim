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
  const [interceptionFeedback, setInterceptionFeedback] = useState(false);
  const [complete, setComplete] = useState(false);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);
  const [rutValue, setRutValue] = useState("");

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
  function requestDocument() { setChecklist((current) => ({ ...current, identificationRequested: true })); setDocumentVisible(true); setFocus("document"); log("Solicitó documento de identidad"); }
  function searchPatient() { setChecklist((current) => ({ ...current, patientVerifiedInSystem: true })); setSystemOpen(true); log("Buscó paciente e ingresó identificador en sistema"); }
  function inspectPrescription(id: string, field?: Field) { setReviews((current) => ({ ...current, [id]: { opened: true, reviewedFields: { ...current[id].reviewedFields, ...(field ? { [field]: true } : {}) } } })); if (field) log(`Revisó ${fieldLabels[field].toLowerCase()} de ${id}`); else log(`Abrió ${id}`); }
  function inspectPrepared(id: string) { setOpenedPrepared((items) => items.includes(id) ? items : [...items, id]); log(`Inspeccionó ${id}`); }
  function confirmTray() { setChecklist((current) => ({ ...current, medicationPreparationChecked: true })); log("Confirmó preparación revisada"); closeFocus(); }
  function correctTray() { setTrayCorrected(true); setIncorrectConcentrationDetected(true); setChecklist((current) => ({ ...current, medicationPreparationChecked: false })); log("Solicitó corrección de preparación a TENS 2"); }
  function chooseInstruction(value: string) { setInstructionChoice(value); setChecklist((current) => ({ ...current, instructionsDelivered: value === "1 comprimido cada 12 horas" })); log("Entregó indicación al paciente"); }
  function verifyFinalIdentity() { setChecklist((current) => ({ ...current, finalPatientIdentityVerified: true })); log("Realizó confirmación de identidad antes del despacho"); }
  function attemptHandoff() { log("Intentó entregar medicamentos"); if (criticalErrorRemains) { setFinalBarrier(true); return; } setComplete(true); closeFocus(); }
  function restart() { window.localStorage.removeItem(STORAGE_KEY); setFocus(null); setChecklist(blankChecklist()); setReviews(blankReview()); setEvents([]); setDocumentVisible(false); setSystemOpen(false); setTrayCorrected(false); setIncorrectConcentrationDetected(false); setOpenedPrepared([]); setInstructionChoice(null); setFinalBarrier(false); setComplete(false); }

  return <section className="overflow-hidden rounded-[22px] border border-slate-300 bg-[#d9e4e1] shadow-[0_28px_70px_rgb(15_23_42/.2)]">
    <header className="flex items-center justify-between bg-gradient-to-r from-[#031225] via-[#09253e] to-[#031225] px-5 py-3 text-white"><p className="text-sm font-extrabold">CASO 001 · DISPENSACIÓN AMBULATORIA</p><p className="text-xs font-semibold text-slate-300">08:37 h · Ventanilla 01</p></header>
    <div className="block p-3">
      <aside className="hidden rounded-2xl border border-slate-300 bg-[#edf3f1] p-3 shadow-lg"><div className="flex items-center justify-between rounded-lg bg-[#073a5f] px-3 py-2 text-sm font-extrabold text-white"><span>SISTEMA DE GESTIÓN DE FARMACIA</span><Icon name="computer" /></div></aside>
      <main className="relative min-h-[680px] overflow-hidden rounded-2xl border border-slate-300 bg-slate-200 shadow-xl"><Image alt="Farmacia ficticia para entrenamiento" className="object-cover" fill priority sizes="(max-width: 1280px) 100vw, 55vw" src="/scenes/pharmacy-training-room-v3.png" /><div className="absolute inset-0 bg-gradient-to-t from-[#071c2a99] via-transparent to-transparent" /><div aria-label="TENS jugadora en ventanilla" className="absolute bottom-0 right-[19%] z-[9] h-48 w-24 rounded-t-full bg-[#0b6674] shadow-[-8px_0_0_rgb(4_43_54/.3)]"><span className="absolute -top-10 left-5 h-14 w-14 rounded-full bg-[#b87f63]" /><span className="absolute -top-3 left-1 h-10 w-20 rounded-t-full bg-[#172334]" /></div><button aria-label="Hablar con la segunda TENS" className="absolute right-[9%] top-[18%] z-10 flex flex-col items-center gap-1 rounded-xl bg-white/10 p-2 text-white hover:bg-white/25" onClick={() => setFocus("tens")} type="button"><span className="h-10 w-10 rounded-full bg-[#ae7058] ring-4 ring-[#08707c]" /><span className="h-16 w-14 rounded-t-2xl bg-[#08707c]" /></button><button aria-label="Hablar con paciente Luis Herrera" className="absolute bottom-0 left-1/2 z-10 w-[48%] min-w-52 max-w-96 -translate-x-1/2 focus-visible:outline-4 focus-visible:outline-teal-300" onClick={() => setFocus("patient")} type="button"><Image alt="Paciente virtual Luis Herrera" className="h-auto w-full drop-shadow-[0_18px_14px_rgb(0_0_0/.3)]" draggable={false} height={1536} sizes="(max-width: 700px) 62vw, 24rem" src="/scenes/patient-a01-3d-render-v3.png" width={1024} /></button><div className="absolute bottom-7 left-1/2 z-20 w-[min(30rem,58%)] -translate-x-1/2 rounded-2xl border border-white/80 bg-white/95 px-5 py-3 text-center text-sm font-medium text-slate-800 shadow-lg">Buenas tardes, vengo a retirar mis medicamentos.</div>{documentVisible ? <button aria-label="Abrir documento de identidad del paciente" className="absolute left-[53%] top-[57%] z-20 rounded-lg border-2 border-teal-300 bg-white p-2 text-teal-700 shadow-lg transition hover:scale-105" onClick={() => setFocus("document")} type="button"><Icon name="card" /></button> : null}<button aria-label="Abrir bandeja preparada" className="absolute bottom-10 right-5 z-20 rounded-xl border border-teal-200 bg-[#063a47]/95 p-3 text-left text-white shadow-lg" onClick={() => setFocus("tray")} type="button"><span className="flex items-center gap-2 text-sm font-bold"><Icon name="tray" /> Bandeja</span></button><button aria-label="Abrir computador de farmacia" className="absolute bottom-10 left-5 z-20 rounded-xl border border-white/60 bg-white/90 p-3 text-left text-slate-900 shadow-lg" onClick={() => setFocus("computer")} type="button"><span className="flex items-center gap-2 text-sm font-bold"><Icon name="computer" /> Terminal</span></button><button aria-label="Entregar medicamentos" className="absolute bottom-6 left-1/2 z-20 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-2 border-slate-200 bg-white/95 text-slate-800 shadow-lg transition hover:scale-110" onClick={() => setFocus("handoff")} type="button"><Icon name="handoff" /></button></main>
    </div>
    {focus ? <InteractionDialog focus={focus} scenario={scenario} documentVisible={documentVisible} systemOpen={systemOpen} reviews={reviews} prepared={prepared} openedPrepared={openedPrepared} trayCorrected={trayCorrected} instructionChoice={instructionChoice} rutValue={rutValue} onRutChange={setRutValue} onClose={closeFocus} onOpenPrescriptions={() => setFocus("prescriptions")} onRequestDocument={requestDocument} onSearchPatient={searchPatient} onInspectPrescription={inspectPrescription} onInspectPrepared={inspectPrepared} onConfirmTray={confirmTray} onCorrectTray={correctTray} onChooseInstruction={chooseInstruction} onVerifyFinalIdentity={verifyFinalIdentity} onAttemptHandoff={attemptHandoff} /> : null}
    {finalBarrier ? <FinalSafetyBarrier onContinue={() => { setFinalBarrier(false); setInterceptionFeedback(true); }} /> : null}
    {interceptionFeedback ? <InterceptionFeedback onContinue={() => { setInterceptionFeedback(false); setFocus("tray"); }} /> : null}
    {complete ? <SimulationFeedback checklist={checklistForClose} onRestart={restart} /> : null}
  </section>;
}

function InteractionDialog({ focus, scenario, documentVisible, systemOpen, reviews, prepared, openedPrepared, trayCorrected, instructionChoice, rutValue, onRutChange, onClose, onOpenPrescriptions, onRequestDocument, onSearchPatient, onInspectPrescription, onInspectPrepared, onConfirmTray, onCorrectTray, onChooseInstruction, onVerifyFinalIdentity, onAttemptHandoff }: { focus: Exclude<Focus, null>; scenario: typeof ambulatoryDispensingScenario; documentVisible: boolean; systemOpen: boolean; reviews: PrescriptionReview; prepared: typeof ambulatoryDispensingScenario.preparedMedications; openedPrepared: string[]; trayCorrected: boolean; instructionChoice: string | null; rutValue: string; onRutChange: (value: string) => void; onClose: () => void; onOpenPrescriptions: () => void; onRequestDocument: () => void; onSearchPatient: () => void; onInspectPrescription: (id: string, field?: Field) => void; onInspectPrepared: (id: string) => void; onConfirmTray: () => void; onCorrectTray: () => void; onChooseInstruction: (value: string) => void; onVerifyFinalIdentity: () => void; onAttemptHandoff: () => void }) {
  const heading: Record<Exclude<Focus, null>, string> = { patient: "Paciente virtual", document: "Documento de identidad", computer: "Sistema de ficha", prescriptions: "Prescripciones", tray: "Bandeja de preparación", tens: "Segunda TENS", instructions: "Indicaciones al paciente", handoff: "Despacho" };
  const positions: Record<Exclude<Focus, null>, string> = { patient: "bottom-28 left-1/2 -translate-x-1/2", document: "top-24 left-1/2 -translate-x-1/2", computer: "bottom-28 left-6", prescriptions: "bottom-28 left-6", tray: "bottom-28 right-6", tens: "top-28 right-20", instructions: "bottom-28 left-1/2 -translate-x-1/2", handoff: "bottom-28 right-1/2 translate-x-1/2" };
  return <div className="pointer-events-none fixed inset-0 z-50" role="dialog"><div className={`pointer-events-auto absolute max-h-[72vh] w-[min(32rem,calc(100vw-2rem))] overflow-auto rounded-2xl border border-slate-200 bg-white/98 p-4 shadow-[0_18px_50px_rgb(15_23_42/.28)] backdrop-blur ${positions[focus]}`}><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold tracking-[.15em] text-teal-700">{heading[focus]}</p></div><button aria-label="Cerrar interacción" className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100" onClick={onClose} type="button">Cerrar</button></div><div className="mt-3">{focus === "patient" ? <div><p className="text-base leading-7 text-slate-700">“Buenas tardes, vengo a retirar mis medicamentos.”</p><div className="mt-3 flex flex-wrap gap-2"><Action label="Solicitar documento" onClick={onRequestDocument} /><Action label="Preguntar por el retiro" onClick={onClose} secondary /><Action label="Pedir nombre completo" onClick={onClose} secondary /></div></div> : null}
  {focus === "document" ? <div>{documentVisible ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-bold tracking-wider text-slate-500">CARNET · DATOS FICTICIOS</p><p className="mt-4 text-xl font-bold">{scenario.patient.fullName}</p><p className="mt-1 text-slate-600">RUT {scenario.patient.rut}</p><p className="mt-1 text-slate-600">Fecha de nacimiento: 06/05/1956</p></div> : <p className="leading-7 text-slate-600">El paciente puede presentar su documento durante la atención. Puedes solicitarlo directamente al paciente.</p>}</div> : null}
  {focus === "computer" ? <div><p className="text-slate-600">Terminal de consulta del paciente.</p><div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><label className="text-xs font-bold text-slate-600">RUT / identificador</label><div className="mt-2 flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" onChange={(event) => onRutChange(event.target.value)} placeholder="Ingresa RUT, por ejemplo 12.345.678-9" value={rutValue} /><Action label={systemOpen ? "Ficha abierta" : "Buscar paciente"} onClick={onSearchPatient} /></div></div>{systemOpen ? <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4"><b>{scenario.patient.fullName}</b><p className="mt-1 text-sm text-teal-900">Ficha ficticia encontrada.</p><div className="mt-3"><Action label="Abrir prescripciones" onClick={onOpenPrescriptions} secondary /></div></div> : null}</div> : null}
  {focus === "prescriptions" ? <div className="space-y-3">{scenario.prescriptions.map((prescription) => <PrescriptionCard key={prescription.id} prescription={prescription} review={reviews[prescription.id]} onInspect={onInspectPrescription} />)}</div> : null}
  {focus === "tray" ? <div><p className="text-slate-600">Bandeja entregada por TENS 2.</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{prepared.map((medication) => <button className={`rounded-2xl border p-4 text-left transition hover:border-teal-400 ${openedPrepared.includes(medication.id) ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-white"}`} key={medication.id} onClick={() => onInspectPrepared(medication.id)} type="button"><span className="text-[10px] font-extrabold tracking-wider text-teal-700">CAJA</span><b className="mt-2 block text-lg">{medication.name}</b><p className="mt-1 text-sm text-slate-600">{openedPrepared.includes(medication.id) ? `${medication.concentration} · ${medication.form} · ${medication.quantity} unidades` : "Abrir caja"}</p></button>)}</div><div className="mt-5 flex flex-wrap gap-2"><Action label="Preparación revisada" onClick={onConfirmTray} /><Action label={trayCorrected ? "Corrección solicitada" : "Solicitar corrección"} onClick={onCorrectTray} secondary /></div></div> : null}
  {focus === "tens" ? <div><p className="leading-7 text-slate-600">La segunda TENS dejó una bandeja sobre el mesón.</p><Action label="Abrir bandeja" onClick={() => { onClose(); }} /></div> : null}
  {focus === "instructions" ? <div><p className="text-slate-600">El paciente pregunta cómo debe tomar Losartán. Selecciona la indicación que entregarás.</p><div className="mt-4 grid gap-3">{["1 comprimido cada 12 horas", "1 comprimido cada 24 horas", "2 comprimidos cada 12 horas"].map((option) => <button className={`rounded-xl border p-4 text-left text-sm font-semibold ${instructionChoice === option ? "border-teal-500 bg-teal-50 text-teal-950" : "border-slate-200 hover:border-teal-300"}`} key={option} onClick={() => onChooseInstruction(option)} type="button">{option}</button>)}</div></div> : null}
  {focus === "handoff" ? <div><p className="leading-7 text-slate-600">Mesón de despacho.</p><div className="mt-5 flex flex-wrap gap-2"><Action label="Confirmar nombre y RUT" onClick={onVerifyFinalIdentity} secondary /><Action label="ENTREGAR MEDICAMENTOS" onClick={onAttemptHandoff} /></div></div> : null}</div></div></div>;
}

function PrescriptionCard({ prescription, review, onInspect }: { prescription: typeof ambulatoryDispensingScenario.prescriptions[number]; review: PrescriptionReview[string]; onInspect: (id: string, field?: Field) => void }) {
  return <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-slate-500">PRESCRIPCIÓN {prescription.id.slice(-2)}</p><b>{prescription.medication.name}</b></div><Action label={review.opened ? "Registro abierto" : "Abrir registro"} onClick={() => onInspect(prescription.id)} secondary /></div>{review.opened ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{fields.map((field) => <button className={`rounded-lg border px-3 py-2 text-left text-sm ${review.reviewedFields[field] ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-300"}`} key={field} onClick={() => onInspect(prescription.id, field)} type="button"><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{fieldLabels[field]}</span><span className="font-semibold">{field === "medication" ? prescription.medication.name : field === "concentration" ? prescription.medication.concentration : field === "form" ? prescription.medication.form : field === "quantity" ? prescription.medication.quantity : prescription.medication.directions}</span></button>)}</div> : null}</article>;
}

function Action({ label, onClick, secondary = false }: { label: string; onClick: () => void; secondary?: boolean }) { return <button className={`rounded-full border px-3 py-2 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${secondary ? "border-slate-300 bg-white text-slate-700 hover:border-teal-400 hover:text-teal-800" : "border-teal-600 bg-teal-50 text-teal-900 hover:bg-teal-100"}`} onClick={onClick} type="button">{label}</button>; }

function FinalSafetyBarrier({ onContinue }: { onContinue: () => void }) { return <div aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-[#050b19]/80 p-4 backdrop-blur-md" role="alertdialog"><div className="w-full max-w-2xl rounded-[28px] border border-amber-400/50 bg-white p-7 shadow-2xl sm:p-10"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><Icon name="shield" /></div><p className="mt-6 text-sm font-extrabold tracking-[.16em] text-amber-700">DETENTE</p><h2 className="mt-2 text-3xl font-bold text-slate-950">Error de medicación interceptado</h2><p className="mt-3 font-bold text-rose-700">NO ENTREGAR</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-slate-100 p-4"><p className="text-xs font-bold tracking-wide text-slate-500">PRESCRIPCIÓN</p><p className="mt-2 font-semibold">Losartán 50 mg<br />Comprimidos · cantidad 30</p></div><div className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="text-xs font-bold tracking-wide text-rose-700">PREPARACIÓN</p><p className="mt-2 font-semibold text-rose-950">Losartán 100 mg<br />Comprimidos · cantidad 30</p></div></div><p className="mt-6 leading-7 text-slate-700">La concentración incorrecta no fue detectada durante el doble chequeo. La simulación interceptó el error antes de que el medicamento alcanzara al paciente.</p><Action label="Volver a la preparación" onClick={onContinue} /></div></div>; }

function InterceptionFeedback({ onContinue }: { onContinue: () => void }) {
  return <div aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog"><div className="w-full max-w-xl rounded-[28px] bg-white p-7 shadow-2xl sm:p-9"><p className="text-xs font-extrabold tracking-[.15em] text-teal-700">RETROALIMENTACIÓN</p><h2 className="mt-2 text-3xl font-bold">NO OLVIDAR</h2><p className="mt-4 leading-7 text-slate-700">Antes del despacho verifica:</p><ul className="mt-3 grid gap-2 text-sm font-semibold text-slate-800 sm:grid-cols-2"><li>Medicamento</li><li>Concentración</li><li>Forma farmacéutica</li><li>Cantidad</li></ul><p className="mt-5 text-sm leading-6 text-slate-600">La barrera final evitó que el producto llegara al paciente. Vuelve a la preparación, solicita corrección y verifica de nuevo.</p><div className="mt-6"><Action label="Volver a la preparación" onClick={onContinue} /></div></div></div>;
}

function SimulationFeedback({ checklist, onRestart }: { checklist: DispensingChecklist; onRestart: () => void }) { const criteria = [{ label: "Identificación", value: checklist.identificationRequested }, { label: "Verificación en sistema", value: checklist.patientVerifiedInSystem }, { label: "Prescripciones", value: checklist.allPrescriptionsReviewed }, { label: "Recetas emitidas", value: checklist.prescriptionsValidated }, { label: "Preparación", value: checklist.medicationPreparationChecked }, { label: "Identidad final", value: checklist.finalPatientIdentityVerified }, { label: "Indicaciones", value: checklist.instructionsDelivered }]; return <div aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog"><div className="w-full max-w-2xl rounded-[28px] bg-white p-7 shadow-2xl sm:p-10"><p className="text-xs font-extrabold tracking-[.15em] text-teal-700">CIERRE DEL ESCENARIO</p><h2 className="mt-2 text-3xl font-bold">Proceso finalizado</h2><div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5"><p className="font-bold text-teal-950">NO OLVIDAR</p><p className="mt-2 leading-7 text-teal-900">Antes del despacho verifica medicamento, concentración, forma farmacéutica y cantidad.</p></div><div className="mt-6 grid gap-2 sm:grid-cols-2">{criteria.map((criterion) => <div className="rounded-xl border border-slate-200 p-3 text-sm" key={criterion.label}><b>{criterion.label}</b><span className={`ml-2 text-xs font-bold ${criterion.value ? "text-teal-700" : "text-amber-700"}`}>{criterion.value ? "Cumplido" : "En refuerzo"}</span></div>)}</div><p className="mt-6 text-sm leading-6 text-slate-600">Para el siguiente caso, se puede reforzar la misma competencia con una concentración distinta, por ejemplo Amlodipino 5 mg versus 10 mg.</p><Action label="Reiniciar escenario" onClick={onRestart} /></div></div>; }
