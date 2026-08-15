"use client";

import { useRef, useState } from "react";

import { saveSimulationAttempt, type SaveSimulationAttemptResult } from "@/features/progress/actions";
import { Case001IllustratedScene } from "@/features/training/case001-illustrated-scene";
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

export function Case001ExperienceV3({ levelNumber, mode, trainingCase }: Props) {
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
  const [alert, setAlert] = useState<string | null>(null);
  const [save, setSave] = useState<SaveSimulationAttemptResult | null>(null);
  const [saving, setSaving] = useState(false);
  const attemptId = useRef(crypto.randomUUID());
  const startedAt = useRef(new Date().toISOString());

  const index = steps.indexOf(step);
  const progress = Math.round(((index + 1) / steps.length) * 100);
  const workspace = step === "start" || step === "identity" ? "service" : ["system", "prescriptions", "emission"].includes(step) ? "system" : ["preparation", "tray"].includes(step) ? "preparation" : "verification";
  const setCriterion = (id: DispensingCriterionId, status: Status) => setCriterionState((current) => ({ ...current, [id]: status }));
  const go = (next: Step) => { setAlert(null); setStep(next); };

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
    if (!detected) {
      setCriterion("criterion-5-compare-prepared-items", "reinforcement");
      return setAlert("La revisión terminó sin detectar la discrepancia. Revisa nuevamente la bandeja.");
    }
    if (!resolved) return setAlert("La discrepancia fue detectada, pero todavía debe resolverse.");
    go("finalIdentity");
  }

  async function finish() {
    const results: AttemptCriterionResult[] = criteria.map(({ id }) => ({ criterionId: id, status: criterionState[id] === "intercepted" ? "intercepted" : criterionState[id] === "met" ? "met" : "reinforcement" }));
    const correctAnswers = results.filter((item) => item.status !== "reinforcement").length;
    setStep("result"); setSaving(true);
    setSave(await saveSimulationAttempt({ attemptId: attemptId.current, correctAnswers, incorrectAnswers: 7 - correctAnswers, criterionResults: results, levelNumber, scenarioSlug: trainingCase.id, startedAt: startedAt.current }));
    setSaving(false);
  }

  function restart() {
    setStep("start"); setCriterionState(initialCriteria()); setDocumentVisible(false); setRut(""); setPatientLoaded(false); setOpened([]); setEmissionChecked(false); setInspected({}); setDetected(false); setResolved(false); setFinalIdentity(false); setGuidanceDone(false); setAlert(null); setSave(null); attemptId.current = crypto.randomUUID(); startedAt.current = new Date().toISOString();
  }

  return <div className="overflow-hidden rounded-[1.8rem] border border-violet-100 bg-white shadow-[0_28px_90px_rgba(76,48,130,.16)]">
    <Header index={index} mode={mode} progress={progress} />
    <div className="grid xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div className="min-w-0 border-b border-violet-100 xl:border-b-0 xl:border-r">
        <div className="relative min-h-[690px] overflow-hidden bg-[#eef1f6]">
          <Case001IllustratedScene workspace={workspace} documentVisible={documentVisible} trayVisible={step === "tray" || step === "preparation"} />
          <div className="absolute bottom-5 left-5 z-30 w-[min(94%,37rem)] md:left-[14%]">
            <div className="max-h-[330px] overflow-auto rounded-[1.35rem] border border-violet-100 bg-white/95 p-5 shadow-[0_20px_60px_rgba(48,31,83,.2)] backdrop-blur-xl">
              <Panel step={step} rut={rut} setRut={setRut} patientLoaded={patientLoaded} opened={opened} emissionChecked={emissionChecked} inspected={inspected} detected={detected} resolved={resolved} finalIdentity={finalIdentity} guidanceDone={guidanceDone} criterionState={criterionState} saving={saving} save={save} documentVisible={documentVisible} setDocumentVisible={setDocumentVisible} setPatientLoaded={setPatientLoaded} setOpened={setOpened} setEmissionChecked={setEmissionChecked} setCriterion={setCriterion} setResolved={setResolved} setFinalIdentity={setFinalIdentity} setGuidanceDone={setGuidanceDone} setAlert={setAlert} inspect={inspect} finishTray={finishTray} finish={finish} restart={restart} go={go} />
            </div>
          </div>
        </div>
        <Dock workspace={workspace} />
      </div>
      <aside className="space-y-4 bg-[#fcfcfe] p-5"><Objectives /><Criteria state={criterionState} />{alert ? <SafetyAlert message={alert} /> : <SafetyOk />}<Reminder /></aside>
    </div>
    <footer className="border-t border-violet-100 bg-white px-5 py-3 text-center text-xs font-semibold text-slate-500">ⓘ &nbsp; Simulación interactiva — no reemplaza protocolos institucionales.</footer>
  </div>;
}

function Header({ index, mode, progress }: { index: number; mode: TrainingMode; progress: number }) { return <header className="grid gap-4 border-b border-violet-100 bg-white px-5 py-4 lg:grid-cols-[1fr_minmax(18rem,32rem)_auto] lg:items-center"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-violet-700 text-2xl font-black text-white">+</div><div><p className="text-xl font-black text-violet-800">FarmaSim</p><p className="text-xs font-semibold text-slate-500">Simulaciones · Caso 001</p></div></div><div><div className="mb-2 flex justify-between text-xs font-black text-slate-700"><span>Etapa {index + 1} de 10</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${progress}%` }} /></div></div><div className="flex justify-end gap-2"><span className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">★ {mode.shortLabel}</span><span className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black">08:37</span></div></header>; }

function Panel(p: any) {
  if (p.step === "start") return <Card title="Nueva atención" text="08:37 h · Farmacia ambulatoria ficticia"><Patient /><Button onClick={() => p.go("identity")}>Recibir al paciente</Button></Card>;
  if (p.step === "identity") return <Card title="Identificación" text="Solicita un documento antes de utilizar el sistema."><Patient />{p.documentVisible ? <FakeDocument /> : <Button onClick={() => { p.setDocumentVisible(true); p.setCriterion("criterion-1-request-identity-document", "met"); }}>Solicitar documento</Button>}{p.documentVisible && <Button onClick={() => p.go("system")}>Ir al computador</Button>}</Card>;
  if (p.step === "system") return <Card title="Sistema clínico ficticio" text="Ingresa el RUT visible y contrasta el nombre mostrado."><label className="mb-1 block text-xs font-black text-slate-700">RUT del documento</label><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><input className="min-h-11 rounded-xl border border-violet-200 bg-white px-3 outline-none focus:border-violet-500" value={p.rut} onChange={(e) => p.setRut(e.target.value)} placeholder="12.345.678-9" /><Button className="mt-0 px-5" onClick={() => { if (normalizeRut(p.rut) === normalizeRut(patient.rut)) { p.setPatientLoaded(true); p.setAlert(null); p.setCriterion("criterion-2-system-identity-match", "progress"); } else p.setAlert("El RUT no coincide con el documento ficticio."); }}>Buscar usuario</Button></div><p className="mt-2 text-[0.68rem] text-slate-500">Se acepta con o sin puntos y guion.</p>{p.patientLoaded && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="font-black">{patient.name}</p><p className="text-sm text-slate-600">RUT {patient.rut}</p><Button onClick={() => { p.setCriterion("criterion-2-system-identity-match", "met"); p.go("prescriptions"); }}>Confirmar coincidencia</Button></div>}</Card>;
  if (p.step === "prescriptions") return <Card title="Prescripciones disponibles" text="Abre todos los registros disponibles."><div className="grid gap-2">{prescriptions.map((item) => <button type="button" key={item.id} onClick={() => p.setOpened((current: string[]) => current.includes(item.id) ? current : [...current, item.id])} className={cn("rounded-xl border p-3 text-left", p.opened.includes(item.id) ? "border-violet-400 bg-violet-50" : "border-slate-200")}><div className="flex justify-between"><strong>{item.title}</strong><span className="text-xs font-black text-violet-700">{p.opened.includes(item.id) ? "Revisada" : "Abrir"}</span></div>{p.opened.includes(item.id) && <p className="mt-1 text-sm text-slate-600">{item.text} · {item.status}</p>}</button>)}</div><Button onClick={() => { p.setCriterion("criterion-3-identify-all-prescriptions", p.opened.length === prescriptions.length ? "met" : "reinforcement"); p.go("emission"); }}>Continuar</Button></Card>;
  if (p.step === "emission") return <Card title="Validación operativa" text="Comprueba el estado de emisión visible."><div className="rounded-xl border p-3"><strong>Losartán 50 mg</strong><p className="text-sm text-slate-600">Estado: <span className="font-black text-emerald-700">Emitida</span></p></div>{!p.emissionChecked ? <Button onClick={() => { p.setEmissionChecked(true); p.setCriterion("criterion-4-confirm-prescription-issued", "met"); }}>Comprobar emisión</Button> : <Button onClick={() => p.go("preparation")}>Solicitar preparación</Button>}</Card>;
  if (p.step === "preparation") return <Card title="Preparación" text="TENS 2 prepara y entrega la bandeja."><div className="rounded-xl bg-violet-50 p-3 text-sm">La bandeja quedará disponible para doble chequeo.</div><Button onClick={() => p.go("tray")}>Recibir bandeja</Button></Card>;
  if (p.step === "tray") return <Card title="Doble chequeo" text="Revisa nombre, concentración, forma y cantidad."><div className="grid gap-3">{medications.map((med) => <Medication key={med.id} med={med} inspected={p.inspected[med.id] ?? []} onInspect={(field) => p.inspect(med.id, field)} />)}</div>{p.detected && !p.resolved && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><strong className="text-amber-900">Discrepancia detectada</strong><p className="text-sm text-amber-800">La concentración no corresponde a la prescripción.</p><Button onClick={() => { p.setResolved(true); p.setCriterion("criterion-5-compare-prepared-items", "intercepted"); p.setAlert("Error interceptado y corregido antes del despacho."); }}>Separar producto y solicitar corrección</Button></div>}<Button onClick={p.finishTray}>Finalizar doble chequeo</Button></Card>;
  if (p.step === "finalIdentity") return <Card title="Identidad final" text="Vuelve a verificar al paciente antes de entregar."><FakeDocument />{!p.finalIdentity ? <Button onClick={() => { p.setFinalIdentity(true); p.setCriterion("criterion-6-recheck-identity-before-handoff", "met"); }}>Comparar documento y usuario</Button> : <Button onClick={() => p.go("guidance")}>Continuar</Button>}</Card>;
  if (p.step === "guidance") return <Card title="Indicaciones" text="Entrega la orientación ficticia del escenario.">{!p.guidanceDone ? <Button onClick={() => { p.setGuidanceDone(true); p.setCriterion("criterion-7-provide-corresponding-instructions", "met"); }}>Entregar indicaciones</Button> : <Button onClick={p.finish}>Finalizar atención</Button>}</Card>;
  return <Card title="Resultado" text="Resumen según los siete criterios."><div className="space-y-2">{criteria.map((criterion, index) => <div key={criterion.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm"><span>{index + 1}. {criterion.label}</span><Pill status={p.criterionState[criterion.id]} /></div>)}</div>{p.saving && <p className="mt-3 text-sm">Guardando progreso…</p>}{p.save && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-bold">{p.save.message}</p>}<Button onClick={p.restart}>Repetir caso</Button></Card>;
}

function Card({ title, text, children }: { title: string; text: string; children: React.ReactNode }) { return <div><p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-violet-600">Acción interactiva</p><h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3><p className="mt-1 text-sm text-slate-600">{text}</p><div className="mt-4">{children}</div></div>; }
function Button({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className?: string }) { return <button type="button" onClick={onClick} className={cn("mt-4 min-h-11 w-full rounded-xl bg-gradient-to-r from-violet-700 to-purple-600 px-4 py-3 text-sm font-black text-white shadow-md shadow-violet-200 hover:from-violet-800 hover:to-purple-700", className)}>{children}</button>; }
function Patient() { return <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3"><div className="grid size-10 place-items-center rounded-full bg-emerald-100 font-black text-emerald-700">P</div><div><p className="font-black">Paciente virtual</p><p className="text-xs text-slate-500">Datos completamente ficticios</p></div></div>; }
function FakeDocument() { return <div className="mt-3 rounded-xl border border-violet-200 bg-white p-3"><p className="text-[0.6rem] font-black uppercase text-violet-600">Documento ficticio</p><p className="mt-1 font-black">{patient.name}</p><p className="text-sm text-slate-600">RUT {patient.rut}</p></div>; }
function Medication({ med, inspected, onInspect }: { med: (typeof medications)[number]; inspected: Field[]; onInspect: (field: Field) => void }) { const rows: [Field, string, string][] = [["name", "Nombre", med.name], ["strength", "Concentración", med.strength], ["form", "Forma", med.form], ["quantity", "Cantidad", med.quantity]]; return <div className="rounded-xl border bg-white p-3"><div className="grid gap-2 sm:grid-cols-2">{rows.map(([field, label, value]) => <button type="button" key={field} onClick={() => onInspect(field)} className={cn("rounded-lg border p-2 text-left", inspected.includes(field) ? "border-violet-300 bg-violet-50" : "border-slate-200")}><span className="block text-[0.58rem] font-black uppercase text-slate-400">{label}</span><span className="text-sm font-black">{value}</span></button>)}</div></div>; }
function Dock({ workspace }: { workspace: string }) { const items = [["service","▣","Solicitar documento"],["system","▤","Ir al computador"],["system","▱","Abrir prescripciones"],["preparation","▥","Revisar bandeja"],["verification","◈","Verificar identidad final"],["verification","◌","Entregar indicaciones"],["verification","+","Solicitar apoyo QF"]]; return <div className="grid grid-cols-2 gap-2 border-t border-violet-100 bg-white p-3 sm:grid-cols-4 xl:grid-cols-7">{items.map(([area,icon,label]) => <div key={label} className={cn("flex min-h-20 items-center gap-3 rounded-2xl border px-3 py-3", area === workspace ? "border-violet-500 bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-200" : "border-violet-100 text-violet-700")}><span className="grid size-9 place-items-center rounded-xl bg-violet-50/20 font-black">{icon}</span><span className="text-[0.68rem] font-black leading-4">{label}</span></div>)}</div>; }
function Objectives() { return <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"><h3 className="font-black">◎ Objetivos del caso</h3><ul className="mt-4 space-y-2 text-sm text-slate-700"><li>• Validar identidad y prescripciones.</li><li>• Verificar medicamento, concentración, forma y cantidad.</li><li>• Interceptar discrepancias antes del despacho.</li></ul></div>; }
function Criteria({ state }: { state: Record<DispensingCriterionId, Status> }) { return <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"><h3 className="font-black">▤ Criterios evaluados</h3><div className="mt-4 space-y-2">{criteria.map((item,index) => <div key={item.id} className="flex items-start justify-between gap-2"><p className="text-[0.67rem] leading-4 text-slate-700">{index+1}. {item.label}</p><Pill status={state[item.id]} /></div>)}</div></div>; }
function Pill({ status }: { status: Status }) { const labels: Record<Status,string> = { pending:"Pendiente", progress:"En progreso", met:"Cumple", reinforcement:"Refuerzo", intercepted:"Interceptado" }; return <span className={cn("shrink-0 rounded-md px-2 py-1 text-[0.55rem] font-black", status === "met" ? "bg-emerald-50 text-emerald-700" : status === "intercepted" ? "bg-amber-50 text-amber-800" : status === "reinforcement" ? "bg-rose-50 text-rose-700" : status === "progress" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500")}>{labels[status]}</span>; }
function SafetyAlert({ message }: { message: string }) { return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm"><p className="font-black text-amber-900">⚠ Revisión de seguridad</p><p className="mt-2 text-sm text-amber-800">{message}</p></div>; }
function SafetyOk() { return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"><p className="font-black text-emerald-900">● Sin alertas activas</p><p className="mt-1 text-xs text-emerald-800">Todo en orden para continuar.</p></div>; }
function Reminder() { return <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm"><p className="font-black">🔔 NO OLVIDAR</p><p className="mt-1 text-sm text-slate-700">Verifica medicamento, concentración, forma farmacéutica y cantidad antes del despacho.</p></div>; }
