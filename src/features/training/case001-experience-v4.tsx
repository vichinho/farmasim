"use client";

import { useEffect, useRef, useState } from "react";

import { saveSimulationAttempt, type SaveSimulationAttemptResult } from "@/features/progress/actions";
import { Case001IllustratedScene } from "@/features/training/case001-illustrated-scene";
import type { SceneHotspotId } from "@/features/training/case001-scene-hotspots";
import { cn } from "@/lib/utils";
import type { AttemptCriterionResult, DispensingCriterionId, TrainingCase, TrainingMode } from "@/types/training-simulation";

type Props = { levelNumber: number; mode: TrainingMode; trainingCase: TrainingCase };
type Status = "pending" | "progress" | "met" | "reinforcement" | "intercepted";
type Step = "start" | "identity" | "system" | "prescriptions" | "emission" | "preparation" | "tray" | "finalIdentity" | "guidance" | "result";
type Field = "name" | "strength" | "form" | "quantity";

const patient = { name: "Marta Fuentes Soto", rut: "12.345.678-9" };
const prescriptions = [
  { id: "r1", title: "Prescripción 01", text: "Losartán 50 mg", status: "Emitida" },
  { id: "r2", title: "Prescripción 02", text: "Amlodipino 5 mg", status: "Emitida" },
  { id: "r3", title: "Prescripción 03", text: "Paracetamol 500 mg", status: "Emitida" },
];
const medications = [
  { id: "losartan", name: "Losartán", strength: "50 mg", expected: "50 mg", form: "Comprimido", quantity: "30 unidades" },
  { id: "amlodipino", name: "Amlodipino", strength: "10 mg", expected: "5 mg", form: "Comprimido", quantity: "30 unidades" },
];
const criteria: { id: DispensingCriterionId; label: string }[] = [
  { id: "criterion-1-request-identity-document", label: "Solicita carnet de identidad y/o crónico" },
  { id: "criterion-2-system-identity-match", label: "Digita RUT y verifica nombre de usuario" },
  { id: "criterion-3-identify-all-prescriptions", label: "Identifica todas las prescripciones disponibles" },
  { id: "criterion-4-confirm-prescription-issued", label: "Verifica que la receta esté emitida" },
  { id: "criterion-5-compare-prepared-items", label: "Medicamentos preparados corresponden a la receta" },
  { id: "criterion-6-recheck-identity-before-handoff", label: "Vuelve a verificar identidad antes de la entrega" },
  { id: "criterion-7-provide-corresponding-instructions", label: "Entrega las indicaciones correspondientes" },
];
const steps: Step[] = ["start", "identity", "system", "prescriptions", "emission", "preparation", "tray", "finalIdentity", "guidance", "result"];
const initialCriteria = () => Object.fromEntries(criteria.map((item) => [item.id, "pending"])) as Record<DispensingCriterionId, Status>;
const normalizeRut = (value: string) => value.toUpperCase().replace(/[^0-9K]/g, "");
const STORAGE_KEY = "farmasim-case001-v4";

export function Case001ExperienceV4({ levelNumber, mode, trainingCase }: Props) {
  const [step, setStep] = useState<Step>("start");
  const [criterionState, setCriterionState] = useState(initialCriteria);
  const [documentVisible, setDocumentVisible] = useState(false);
  const [rut, setRut] = useState("");
  const [patientLoaded, setPatientLoaded] = useState(false);
  const [opened, setOpened] = useState<string[]>([]);
  const [emissionChecked, setEmissionChecked] = useState(false);
  const [inspected, setInspected] = useState<Record<string, Field[]>>({});
  const [detected, setDetected] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [finalIdentity, setFinalIdentity] = useState(false);
  const [guidanceDone, setGuidanceDone] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<SceneHotspotId | null>("patient");
  const [alert, setAlert] = useState<string | null>(null);
  const [save, setSave] = useState<SaveSimulationAttemptResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const attemptId = useRef(crypto.randomUUID());
  const startedAt = useRef(new Date().toISOString());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const restored = JSON.parse(raw);
        if (restored.step) setStep(restored.step);
        if (restored.criterionState) setCriterionState(restored.criterionState);
        if (typeof restored.documentVisible === "boolean") setDocumentVisible(restored.documentVisible);
        if (restored.rut) setRut(restored.rut);
        if (typeof restored.patientLoaded === "boolean") setPatientLoaded(restored.patientLoaded);
        if (Array.isArray(restored.opened)) setOpened(restored.opened);
        if (typeof restored.emissionChecked === "boolean") setEmissionChecked(restored.emissionChecked);
        if (restored.inspected) setInspected(restored.inspected);
        if (typeof restored.detected === "boolean") setDetected(restored.detected);
        if (typeof restored.resolved === "boolean") setResolved(restored.resolved);
        if (typeof restored.finalIdentity === "boolean") setFinalIdentity(restored.finalIdentity);
        if (typeof restored.guidanceDone === "boolean") setGuidanceDone(restored.guidanceDone);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || step === "result") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, criterionState, documentVisible, rut, patientLoaded, opened, emissionChecked, inspected, detected, resolved, finalIdentity, guidanceDone }));
  }, [hydrated, step, criterionState, documentVisible, rut, patientLoaded, opened, emissionChecked, inspected, detected, resolved, finalIdentity, guidanceDone]);

  const index = steps.indexOf(step);
  const progress = Math.round(((index + 1) / steps.length) * 100);
  const workspace = step === "start" || step === "identity" ? "service" : ["system", "prescriptions", "emission"].includes(step) ? "system" : ["preparation", "tray"].includes(step) ? "preparation" : "verification";
  const setCriterion = (id: DispensingCriterionId, status: Status) => setCriterionState((current) => ({ ...current, [id]: status }));
  const go = (next: Step, hotspot?: SceneHotspotId) => { setAlert(null); setStep(next); if (hotspot) setActiveHotspot(hotspot); };

  function handleHotspotClick(id: SceneHotspotId) {
    setActiveHotspot(id);
    if (id === "patient" && step === "start") go("identity", "patient");
    else if (id === "patient" && step === "identity" && !documentVisible) requestDocument();
    else if (id === "computer" && documentVisible && ["identity", "system"].includes(step)) go("system", "computer");
    else if (id === "preparation" && step === "emission") go("preparation", "preparation");
    else if (id === "tray" && step === "preparation") go("tray", "tray");
    else if (id === "patient" && step === "finalIdentity") setFinalIdentity(true);
  }

  function requestDocument() {
    setDocumentVisible(true);
    setCriterion("criterion-1-request-identity-document", "met");
  }

  function inspect(medicationId: string, field: Field) {
    setInspected((current) => ({ ...current, [medicationId]: Array.from(new Set([...(current[medicationId] ?? []), field])) }));
    const medication = medications.find((item) => item.id === medicationId);
    if (medication && field === "strength" && medication.strength !== medication.expected) {
      setDetected(true);
      setAlert("Detectaste una discrepancia de concentración. Debe resolverse antes del despacho.");
    }
  }

  function finishTray() {
    const complete = medications.every((medication) => (["name", "strength", "form", "quantity"] as Field[]).every((field) => (inspected[medication.id] ?? []).includes(field)));
    if (!complete) return setAlert("Aún faltan datos por revisar en la bandeja.");
    if (!detected) { setCriterion("criterion-5-compare-prepared-items", "reinforcement"); return setAlert("La revisión terminó sin detectar la discrepancia. Revisa nuevamente la bandeja."); }
    if (!resolved) return setAlert("La discrepancia fue detectada, pero todavía debe resolverse.");
    go("finalIdentity", "patient");
  }

  async function finish() {
    const results: AttemptCriterionResult[] = criteria.map(({ id }) => ({ criterionId: id, status: criterionState[id] === "intercepted" ? "intercepted" : criterionState[id] === "met" ? "met" : "reinforcement" }));
    const correctAnswers = results.filter((item) => item.status !== "reinforcement").length;
    setStep("result"); setSaving(true); localStorage.removeItem(STORAGE_KEY);
    setSave(await saveSimulationAttempt({ attemptId: attemptId.current, correctAnswers, incorrectAnswers: 7 - correctAnswers, criterionResults: results, levelNumber, scenarioSlug: trainingCase.id, startedAt: startedAt.current }));
    setSaving(false);
  }

  function restart() {
    localStorage.removeItem(STORAGE_KEY); setStep("start"); setCriterionState(initialCriteria()); setDocumentVisible(false); setRut(""); setPatientLoaded(false); setOpened([]); setEmissionChecked(false); setInspected({}); setDetected(false); setResolved(false); setFinalIdentity(false); setGuidanceDone(false); setActiveHotspot("patient"); setAlert(null); setSave(null); attemptId.current = crypto.randomUUID(); startedAt.current = new Date().toISOString();
  }

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-violet-100 bg-white shadow-[0_22px_70px_rgba(76,48,130,.13)]">
      <Header index={index} mode={mode} progress={progress} />
      <div className="grid xl:grid-cols-[minmax(0,1fr)_27.5rem]">
        <div className="min-w-0 border-b border-violet-100 xl:border-b-0 xl:border-r">
          <div className="relative min-h-[720px] overflow-hidden bg-[#eef1f6]">
            <Case001IllustratedScene workspace={workspace} documentVisible={documentVisible} trayVisible={step === "tray" || step === "preparation"} activeHotspot={activeHotspot} onHotspotClick={handleHotspotClick} />
            <div className="absolute bottom-5 left-5 z-30 w-[min(92%,26rem)]">
              <div className="max-h-[350px] overflow-auto rounded-[1.2rem] border border-violet-100 bg-white/96 p-5 shadow-[0_16px_42px_rgba(17,24,39,.13)] backdrop-blur-xl">
                <ContextPanel step={step} rut={rut} setRut={setRut} patientLoaded={patientLoaded} opened={opened} emissionChecked={emissionChecked} inspected={inspected} detected={detected} resolved={resolved} finalIdentity={finalIdentity} guidanceDone={guidanceDone} criterionState={criterionState} saving={saving} save={save} documentVisible={documentVisible} requestDocument={requestDocument} setPatientLoaded={setPatientLoaded} setOpened={setOpened} setEmissionChecked={setEmissionChecked} setCriterion={setCriterion} setResolved={setResolved} setFinalIdentity={setFinalIdentity} setGuidanceDone={setGuidanceDone} setAlert={setAlert} inspect={inspect} finishTray={finishTray} finish={finish} restart={restart} go={go} />
              </div>
            </div>
          </div>
          <ActionDock step={step} go={go} requestDocument={requestDocument} />
        </div>
        <aside className="space-y-4 bg-[#fcfcfe] p-5"><Objectives /><Criteria state={criterionState} />{alert ? <SafetyAlert message={alert} /> : <SafetyOk />}<Reminder /></aside>
      </div>
      <footer className="border-t border-violet-100 bg-white px-5 py-3 text-center text-xs font-semibold text-slate-500">ⓘ &nbsp; Simulación interactiva — no reemplaza protocolos institucionales.</footer>
    </div>
  );
}

function Header({ index, mode, progress }: { index: number; mode: TrainingMode; progress: number }) { return <header className="grid gap-4 border-b border-violet-100 bg-white px-5 py-4 lg:grid-cols-[1fr_minmax(18rem,32rem)_auto] lg:items-center"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-violet-700 text-2xl font-black text-white shadow-sm">+</div><div><p className="text-xl font-black tracking-tight text-violet-800">FarmaSim</p><p className="text-xs font-semibold text-slate-500">Simulaciones · Caso 001</p></div></div><div><div className="mb-2 flex justify-between text-xs font-black text-slate-700"><span>Etapa {index + 1} de 10</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${progress}%` }} /></div></div><div className="flex justify-end gap-2"><span className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">★ {mode.shortLabel}</span><span className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black">08:37</span></div></header>; }

function ContextPanel(p: any) {
  if (p.step === "start") return <Card title="Nueva atención" text="08:37 h · Farmacia ambulatoria ficticia"><Patient /><Button onClick={() => p.go("identity", "patient")}>Recibir al paciente</Button></Card>;
  if (p.step === "identity") return <Card title="Identificación" text="Solicita un documento antes de utilizar el sistema."><Patient />{p.documentVisible ? <FakeDocument /> : <Button onClick={p.requestDocument}>Solicitar documento</Button>}{p.documentVisible && <Button onClick={() => p.go("system", "computer")}>Ir al computador</Button>}</Card>;
  if (p.step === "system") return <Card title="Sistema clínico ficticio" text="Ingresa el RUT visible y contrasta el nombre mostrado."><label className="mb-1 block text-xs font-black text-slate-700">RUT del documento</label><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><input className="min-h-11 rounded-xl border border-violet-200 bg-white px-3 text-sm outline-none focus:border-violet-500" value={p.rut} onChange={(e) => p.setRut(e.target.value)} placeholder="12.345.678-9" /><Button className="mt-0 px-5" onClick={() => { if (normalizeRut(p.rut) === normalizeRut(patient.rut)) { p.setPatientLoaded(true); p.setAlert(null); p.setCriterion("criterion-2-system-identity-match", "progress"); } else p.setAlert("El RUT no coincide con el documento ficticio."); }}>Buscar usuario</Button></div><p className="mt-2 text-[0.68rem] text-slate-500">Se acepta con o sin puntos y guion.</p>{p.patientLoaded && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="font-black">{patient.name}</p><p className="text-sm text-slate-600">RUT {patient.rut}</p><Button onClick={() => { p.setCriterion("criterion-2-system-identity-match", "met"); p.go("prescriptions", "computer"); }}>Confirmar coincidencia</Button></div>}</Card>;
  if (p.step === "prescriptions") return <Card title="Prescripciones disponibles" text="Abre todos los registros disponibles."><div className="grid gap-2">{prescriptions.map((item) => <button type="button" key={item.id} onClick={() => p.setOpened((current: string[]) => current.includes(item.id) ? current : [...current, item.id])} className={cn("rounded-xl border p-3 text-left transition", p.opened.includes(item.id) ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-300")}><div className="flex justify-between gap-3"><strong>{item.title}</strong><span className="text-xs font-black text-violet-700">{p.opened.includes(item.id) ? "Revisada" : "Abrir"}</span></div>{p.opened.includes(item.id) && <p className="mt-1 text-sm text-slate-600">{item.text} · {item.status}</p>}</button>)}</div><Button onClick={() => { p.setCriterion("criterion-3-identify-all-prescriptions", p.opened.length === prescriptions.length ? "met" : "reinforcement"); p.go("emission", "computer"); }}>Continuar</Button></Card>;
  if (p.step === "emission") return <Card title="Validación operativa" text="Comprueba el estado de emisión visible."><div className="rounded-xl border border-slate-200 bg-white p-3"><strong>Losartán 50 mg</strong><p className="text-sm text-slate-600">Estado: <span className="font-black text-emerald-700">Emitida</span></p></div>{!p.emissionChecked ? <Button onClick={() => { p.setEmissionChecked(true); p.setCriterion("criterion-4-confirm-prescription-issued", "met"); }}>Comprobar emisión</Button> : <Button onClick={() => p.go("preparation", "preparation")}>Solicitar preparación</Button>}</Card>;
  if (p.step === "preparation") return <Card title="Preparación" text="TENS 2 prepara y entrega la bandeja."><div className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-sm text-slate-700">La bandeja queda disponible para el doble chequeo.</div><Button onClick={() => p.go("tray", "tray")}>Recibir bandeja</Button></Card>;
  if (p.step === "tray") return <Card title="Doble chequeo" text="Revisa nombre, concentración, forma y cantidad."><div className="grid gap-3">{medications.map((med) => <Medication key={med.id} med={med} inspected={p.inspected[med.id] ?? []} onInspect={(field) => p.inspect(med.id, field)} />)}</div>{p.detected && !p.resolved && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><strong className="text-amber-900">Discrepancia detectada</strong><p className="text-sm text-amber-800">La concentración no corresponde a la prescripción.</p><Button onClick={() => { p.setResolved(true); p.setCriterion("criterion-5-compare-prepared-items", "intercepted"); p.setAlert("Error interceptado y corregido antes del despacho."); }}>Separar producto y solicitar corrección</Button></div>}<Button onClick={p.finishTray}>Finalizar doble chequeo</Button></Card>;
  if (p.step === "finalIdentity") return <Card title="Identidad final" text="Vuelve a verificar al paciente antes de entregar."><FakeDocument />{!p.finalIdentity ? <Button onClick={() => { p.setFinalIdentity(true); p.setCriterion("criterion-6-recheck-identity-before-handoff", "met"); }}>Comparar documento y usuario</Button> : <Button onClick={() => p.go("guidance", "patient")}>Continuar</Button>}</Card>;
  if (p.step === "guidance") return <Card title="Indicaciones" text="Entrega la orientación ficticia del escenario.">{!p.guidanceDone ? <Button onClick={() => { p.setGuidanceDone(true); p.setCriterion("criterion-7-provide-corresponding-instructions", "met"); }}>Entregar indicaciones</Button> : <Button onClick={p.finish}>Finalizar atención</Button>}</Card>;
  return <Card title="Resultado" text="Resumen según los siete criterios."><div className="space-y-2">{criteria.map((criterion,index) => <div key={criterion.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2 text-sm"><span>{index+1}. {criterion.label}</span><Pill status={p.criterionState[criterion.id]} /></div>)}</div>{p.saving && <p className="mt-3 text-sm">Guardando progreso…</p>}{p.save && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{p.save.message}</p>}<Button onClick={p.restart}>Repetir caso</Button></Card>;
}

function ActionDock({ step, go, requestDocument }: { step: Step; go: (step: Step, hotspot?: SceneHotspotId) => void; requestDocument: () => void }) {
  const items = [
    { label: "Solicitar documento", icon: "▣", active: step === "start" || step === "identity", onClick: () => { requestDocument(); go("identity", "patient"); } },
    { label: "Ir al computador", icon: "▤", active: step === "system", onClick: () => go("system", "computer") },
    { label: "Abrir prescripciones", icon: "▱", active: step === "prescriptions" || step === "emission", onClick: () => go("prescriptions", "computer") },
    { label: "Revisar bandeja", icon: "▥", active: step === "preparation" || step === "tray", onClick: () => go("tray", "tray") },
    { label: "Verificar identidad final", icon: "◈", active: step === "finalIdentity", onClick: () => go("finalIdentity", "patient") },
    { label: "Entregar indicaciones", icon: "◌", active: step === "guidance", onClick: () => go("guidance", "patient") },
    { label: "Solicitar apoyo QF", icon: "+", active: false, onClick: () => {} },
  ];
  return <div className="flex gap-2 overflow-x-auto border-t border-violet-100 bg-white p-3 snap-x">{items.map((item) => <button key={item.label} type="button" onClick={item.onClick} className={cn("flex min-h-20 min-w-[9.2rem] snap-start items-center gap-3 rounded-2xl border px-3 py-3 text-left transition", item.active ? "border-violet-500 bg-violet-700 text-white shadow-md shadow-violet-200" : "border-violet-100 bg-white text-violet-700 hover:border-violet-300")}><span className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-lg font-black", item.active ? "bg-white/15" : "bg-violet-50")}>{item.icon}</span><span className="text-[0.68rem] font-black leading-4">{item.label}</span></button>)}</div>;
}

function Card({ title, text, children }: { title: string; text: string; children: React.ReactNode }) { return <div><p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-violet-600">Acción interactiva</p><h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-600">{text}</p><div className="mt-4">{children}</div></div>; }
function Button({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className?: string }) { return <button type="button" onClick={onClick} className={cn("mt-4 min-h-11 w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500", className)}>{children}</button>; }
function Patient() { return <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3"><div className="grid size-10 place-items-center rounded-full bg-emerald-100 font-black text-emerald-700">P</div><div><p className="font-black">Paciente virtual</p><p className="text-xs text-slate-500">Datos completamente ficticios</p></div></div>; }
function FakeDocument() { return <div className="mt-3 rounded-xl border border-violet-200 bg-white p-3"><p className="text-[0.6rem] font-black uppercase tracking-wide text-violet-600">Documento ficticio</p><p className="mt-1 font-black">{patient.name}</p><p className="text-sm text-slate-600">RUT {patient.rut}</p></div>; }
function Medication({ med, inspected, onInspect }: { med: (typeof medications)[number]; inspected: Field[]; onInspect: (field: Field) => void }) { const rows: [Field,string,string][] = [["name","Nombre",med.name],["strength","Concentración",med.strength],["form","Forma",med.form],["quantity","Cantidad",med.quantity]]; return <div className="rounded-xl border border-slate-200 bg-white p-3"><div className="grid gap-2 sm:grid-cols-2">{rows.map(([field,label,value]) => <button type="button" key={field} onClick={() => onInspect(field)} className={cn("rounded-lg border p-2 text-left transition", inspected.includes(field) ? "border-violet-300 bg-violet-50" : "border-slate-200 hover:border-violet-300")}><span className="block text-[0.58rem] font-black uppercase text-slate-400">{label}</span><span className="text-sm font-black">{value}</span></button>)}</div></div>; }
function Objectives() { return <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-black text-violet-700">◎</div><h3 className="font-black">Objetivos del caso</h3></div><ul className="mt-4 space-y-2 text-sm leading-5 text-slate-700"><li>• Validar identidad y prescripciones.</li><li>• Verificar medicamento, concentración, forma y cantidad.</li><li>• Interceptar discrepancias antes del despacho.</li></ul></div>; }
function Criteria({ state }: { state: Record<DispensingCriterionId, Status> }) { return <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-black text-violet-700">▤</div><h3 className="font-black">Criterios evaluados</h3></div><div className="mt-4 space-y-2">{criteria.map((item,index) => <div key={item.id} className="flex items-start justify-between gap-2"><p className="text-[0.67rem] leading-4 text-slate-700">{index+1}. {item.label}</p><Pill status={state[item.id]} /></div>)}</div></div>; }
function Pill({ status }: { status: Status }) { const labels: Record<Status,string> = { pending:"Pendiente", progress:"En progreso", met:"Cumple", reinforcement:"Refuerzo", intercepted:"Interceptado" }; return <span className={cn("shrink-0 rounded-md px-2 py-1 text-[0.55rem] font-black", status === "met" ? "bg-emerald-50 text-emerald-700" : status === "intercepted" ? "bg-amber-50 text-amber-800" : status === "reinforcement" ? "bg-rose-50 text-rose-700" : status === "progress" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500")}>{labels[status]}</span>; }
function SafetyAlert({ message }: { message: string }) { return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm"><p className="font-black text-amber-900">⚠ Revisión de seguridad</p><p className="mt-2 text-sm leading-5 text-amber-800">{message}</p></div>; }
function SafetyOk() { return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"><p className="font-black text-emerald-900">● Sin alertas activas</p><p className="mt-1 text-xs text-emerald-800">Todo en orden para continuar.</p></div>; }
function Reminder() { return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm"><p className="font-black">🔔 NO OLVIDAR</p><p className="mt-1 text-sm leading-5 text-slate-700">Verifica medicamento, concentración, forma farmacéutica y cantidad antes del despacho.</p></div>; }
