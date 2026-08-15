"use client";

import { useRef, useState } from "react";
import { saveSimulationAttempt, type SaveSimulationAttemptResult } from "@/features/progress/actions";
import { cn } from "@/lib/utils";
import type { AttemptCriterionResult, DispensingCriterionId, TrainingCase, TrainingMode } from "@/types/training-simulation";

type Props = { levelNumber: number; mode: TrainingMode; trainingCase: TrainingCase };
type Status = "pending" | "progress" | "met" | "reinforcement" | "intercepted";
type Step = "start" | "identity" | "system" | "prescriptions" | "emission" | "preparation" | "tray" | "finalIdentity" | "guidance" | "result";
type Field = "name" | "strength" | "form" | "quantity";

const patient = { name: "Marta Fuentes Soto", rut: "12.345.678-9" };
const rx = [
  { id: "r1", title: "Prescripción 01", text: "Losartán 50 mg", status: "Emitida" },
  { id: "r2", title: "Prescripción 02", text: "Amlodipino 5 mg", status: "Emitida" },
  { id: "r3", title: "Prescripción 03", text: "Paracetamol 500 mg", status: "Emitida" },
];
const medications = [
  { id: "losartan", name: "Losartán", strength: "50 mg", expected: "50 mg", form: "Comprimido", quantity: "30 unidades" },
  { id: "amlodipino", name: "Amlodipino", strength: "10 mg", expected: "5 mg", form: "Comprimido", quantity: "30 unidades" },
];
const criteria: { id: DispensingCriterionId; group: string; label: string }[] = [
  { id: "criterion-1-request-identity-document", group: "Identificación", label: "Solicita carnet de identidad y/o crónico" },
  { id: "criterion-2-system-identity-match", group: "Identificación", label: "Digita RUT y verifica nombre de usuario" },
  { id: "criterion-3-identify-all-prescriptions", group: "Validación operativa", label: "Identifica todas las prescripciones disponibles" },
  { id: "criterion-4-confirm-prescription-issued", group: "Validación operativa", label: "Verifica que la receta esté emitida" },
  { id: "criterion-5-compare-prepared-items", group: "Preparación", label: "Medicamentos preparados corresponden a la receta" },
  { id: "criterion-6-recheck-identity-before-handoff", group: "Despacho", label: "Vuelve a verificar identidad antes de la entrega" },
  { id: "criterion-7-provide-corresponding-instructions", group: "Despacho", label: "Entrega las indicaciones correspondientes" },
];
const stepOrder: Step[] = ["start", "identity", "system", "prescriptions", "emission", "preparation", "tray", "finalIdentity", "guidance", "result"];

function initialCriteria() {
  return Object.fromEntries(criteria.map((item) => [item.id, "pending"])) as Record<DispensingCriterionId, Status>;
}

export function Case001Experience({ levelNumber, mode, trainingCase }: Props) {
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

  const setCriterion = (id: DispensingCriterionId, status: Status) => setCriterionState((old) => ({ ...old, [id]: status }));
  const go = (next: Step) => { setAlert(null); setStep(next); };
  const index = stepOrder.indexOf(step);
  const progress = Math.round(((index + 1) / stepOrder.length) * 100);
  const workspace = step === "identity" || step === "start" ? "service" : ["system", "prescriptions", "emission"].includes(step) ? "system" : ["preparation", "tray"].includes(step) ? "preparation" : "verification";

  function inspect(medicationId: string, field: Field) {
    setInspected((old) => {
      const current = old[medicationId] ?? [];
      return current.includes(field) ? old : { ...old, [medicationId]: [...current, field] };
    });
    const med = medications.find((item) => item.id === medicationId);
    if (med && field === "strength" && med.strength !== med.expected) {
      setDetected(true);
      setAlert("Detectaste una discrepancia de concentración. Debe resolverse antes del despacho.");
    }
  }

  function finishTray() {
    const complete = medications.every((med) => ["name", "strength", "form", "quantity"].every((field) => (inspected[med.id] ?? []).includes(field as Field)));
    if (!complete) { setAlert("Aún faltan campos por revisar en la bandeja."); return; }
    if (!detected) {
      setCriterion("criterion-5-compare-prepared-items", "reinforcement");
      setAlert("La revisión terminó sin detectar la concentración discrepante. La barrera final interceptará el error antes de la entrega.");
      return;
    }
    if (!resolved) { setAlert("La discrepancia fue detectada, pero todavía no está resuelta."); return; }
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

  return <div className="overflow-hidden rounded-[1.9rem] border border-violet-100 bg-[#f8f7fc] shadow-[0_26px_80px_rgba(75,45,128,.16)]">
    <header className="grid gap-4 border-b border-violet-100 bg-white px-5 py-4 lg:grid-cols-[1fr_minmax(18rem,31rem)_auto] lg:items-center">
      <div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-violet-700 text-2xl font-black text-white">+</div><div><p className="text-lg font-black text-violet-800">FarmaSim</p><p className="text-xs font-semibold text-slate-500">Simulaciones · Caso 001</p></div></div>
      <div><div className="mb-2 flex justify-between text-xs font-black text-slate-700"><span>Etapa {index + 1} de 10</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-violet-600 transition-[width]" style={{ width: `${progress}%` }} /></div></div>
      <div className="flex justify-end gap-2"><span className="rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">★ {mode.shortLabel}</span><span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black">08:37</span></div>
    </header>

    <div className="grid xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div className="min-w-0 border-b border-violet-100 xl:border-b-0 xl:border-r">
        <div className="relative min-h-[650px] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50">
          <Scene workspace={workspace} documentVisible={documentVisible} trayVisible={step === "tray" || step === "preparation"} />
          <div className="absolute inset-x-3 bottom-3 z-30 sm:left-1/2 sm:w-[min(94%,46rem)] sm:-translate-x-1/2"><div className="max-h-[470px] overflow-auto rounded-[1.5rem] border border-violet-100 bg-white/95 p-5 shadow-[0_24px_70px_rgba(48,31,83,.22)] backdrop-blur">
            {step === "start" && <Panel title="Nueva atención" text="08:37 h · Farmacia ambulatoria ficticia"><Patient /><Button onClick={() => go("identity")}>Recibir al paciente</Button></Panel>}
            {step === "identity" && <Panel title="Identificación" text="Interactúa con el paciente y solicita el documento."><Patient />{documentVisible ? <FakeDocument /> : <Button onClick={() => { setDocumentVisible(true); setCriterion("criterion-1-request-identity-document", "met"); }}>Solicitar documento</Button>}{documentVisible && <Button onClick={() => go("system")}>Ir al computador</Button>}</Panel>}
            {step === "system" && <Panel title="Sistema clínico ficticio" text="Ingresa el RUT visible y compara el nombre."><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><input className="min-h-11 rounded-xl border border-slate-200 px-3" value={rut} onChange={(e) => setRut(e.target.value)} placeholder={patient.rut} /><Button className="mt-0" onClick={() => { if (rut === patient.rut) { setPatientLoaded(true); setCriterion("criterion-2-system-identity-match", "progress"); } else setAlert("El RUT no coincide con el documento ficticio."); }}>Buscar usuario</Button></div>{patientLoaded && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-black">{patient.name}</p><p className="text-sm text-slate-600">RUT {patient.rut}</p><Button onClick={() => { setCriterion("criterion-2-system-identity-match", "met"); go("prescriptions"); }}>Confirmar coincidencia</Button></div>}</Panel>}
            {step === "prescriptions" && <Panel title="Prescripciones disponibles" text="Abre cada registro. La app contabiliza silenciosamente cuáles revisaste."><div className="grid gap-2">{rx.map((item) => <button key={item.id} onClick={() => setOpened((old) => old.includes(item.id) ? old : [...old, item.id])} className={cn("rounded-xl border p-3 text-left", opened.includes(item.id) ? "border-violet-400 bg-violet-50" : "border-slate-200") }><div className="flex justify-between"><strong>{item.title}</strong><span className="text-xs font-black text-violet-700">{opened.includes(item.id) ? "Revisada" : "Abrir"}</span></div>{opened.includes(item.id) && <p className="mt-2 text-sm text-slate-600">{item.text} · {item.status}</p>}</button>)}</div><Button onClick={() => { setCriterion("criterion-3-identify-all-prescriptions", opened.length === rx.length ? "met" : "reinforcement"); go("emission"); }}>Continuar</Button></Panel>}
            {step === "emission" && <Panel title="Validación operativa" text="Comprueba el estado administrativo visible; no realices validación clínica."><div className="rounded-xl border border-slate-200 p-4"><strong>Losartán 50 mg</strong><p className="text-sm text-slate-600">Estado: <span className="font-black text-emerald-700">Emitida</span></p></div>{!emissionChecked ? <Button onClick={() => { setEmissionChecked(true); setCriterion("criterion-4-confirm-prescription-issued", "met"); }}>Comprobar emisión</Button> : <Button onClick={() => go("preparation")}>Solicitar preparación</Button>}</Panel>}
            {step === "preparation" && <Panel title="TENS 2 prepara la bandeja" text="TENS 2 realiza la preparación y lleva los productos al mesón de revisión."><div className="rounded-xl bg-violet-50 p-4"><strong>TENS 2 · Preparación en curso</strong><p className="mt-1 text-sm text-slate-600">La bandeja queda disponible para el doble chequeo.</p></div><Button onClick={() => go("tray")}>Recibir bandeja</Button></Panel>}
            {step === "tray" && <Panel title="Revisar bandeja" text="Toca cada dato. La discrepancia no se destaca antes de que la observes."><div className="grid gap-3">{medications.map((med) => <Medication key={med.id} med={med} inspected={inspected[med.id] ?? []} onInspect={(field) => inspect(med.id, field)} />)}</div>{detected && !resolved && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3"><strong className="text-amber-900">Discrepancia detectada</strong><p className="mt-1 text-sm text-amber-800">La concentración observada no corresponde a la prescripción.</p><Button onClick={() => { setResolved(true); setCriterion("criterion-5-compare-prepared-items", "intercepted"); setAlert("Error interceptado y corregido antes del despacho."); }}>Separar producto y solicitar corrección</Button></div>}<Button onClick={finishTray}>Finalizar doble chequeo</Button>{!detected && Object.values(inspected).some((fields) => fields.length === 4) && <button className="mt-3 w-full text-xs font-black text-amber-800 underline" onClick={() => { setDetected(true); setResolved(true); setCriterion("criterion-5-compare-prepared-items", "intercepted"); setAlert("Barrera final activada: discrepancia interceptada antes del despacho."); go("finalIdentity"); }}>Continuar a barrera final</button>}</Panel>}
            {step === "finalIdentity" && <Panel title="Verificación antes de la entrega" text="Vuelve a comprobar identidad del paciente virtual."><FakeDocument />{!finalIdentity ? <Button onClick={() => { setFinalIdentity(true); setCriterion("criterion-6-recheck-identity-before-handoff", "met"); }}>Comparar documento y usuario</Button> : <Button onClick={() => go("guidance")}>Continuar a indicaciones</Button>}</Panel>}
            {step === "guidance" && <Panel title="Indicaciones" text="Entrega la orientación ficticia definida por el escenario; no genera consejo clínico."><div className="rounded-xl bg-violet-50 p-4 text-sm">Orientación educativa autorizada para este caso ficticio.</div>{!guidanceDone ? <Button onClick={() => { setGuidanceDone(true); setCriterion("criterion-7-provide-corresponding-instructions", "met"); }}>Entregar indicaciones</Button> : <Button onClick={finish}>Finalizar atención</Button>}</Panel>}
            {step === "result" && <Panel title="Resultado del caso" text="Resumen por los siete criterios."><div className="space-y-2">{criteria.map((item, i) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2"><p className="text-sm">{i + 1}. {item.label}</p><Pill status={criterionState[item.id]} /></div>)}</div>{saving && <p className="mt-4 text-sm text-slate-500">Guardando progreso…</p>}{save && <p className={cn("mt-4 rounded-xl p-3 text-sm font-bold", save.status === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800")}>{save.message}</p>}<Button onClick={restart}>Repetir caso</Button></Panel>}
          </div></div>
        </div>
        <Dock workspace={workspace} />
      </div>
      <aside className="space-y-4 bg-white p-5"><Objectives /><Criteria state={criterionState} />{alert ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="font-black text-amber-900">⚠ Revisión de seguridad</p><p className="mt-2 text-sm text-amber-800">{alert}</p></div> : <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-black text-emerald-900">● Sin alertas activas</p></div>}<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="font-black">🔔 NO OLVIDAR</p><p className="mt-1 text-sm text-slate-700">Verifica medicamento, concentración, forma farmacéutica y cantidad antes del despacho.</p></div></aside>
    </div>
    <footer className="border-t border-violet-100 bg-white px-5 py-3 text-center text-xs font-semibold text-slate-500">Simulación interactiva — no reemplaza protocolos institucionales.</footer>
  </div>;
}

function Scene({ workspace, documentVisible, trayVisible }: { workspace: string; documentVisible: boolean; trayVisible: boolean }) {
  return <div className="absolute inset-0"><div className="absolute inset-x-0 top-0 h-[61%] bg-gradient-to-b from-[#eee9f8] via-[#f5f4f8] to-[#e9eef4]"/><div className="absolute inset-x-0 bottom-0 h-[43%] bg-slate-100"/><div className="absolute left-[57%] top-[9%] grid h-[34%] w-[35%] grid-cols-5 gap-1 rounded-xl border-4 border-slate-400 bg-slate-500/80 p-2 shadow-xl">{Array.from({length:30}).map((_,i)=><div key={i} className={i%5===0?"bg-violet-200":"bg-white"}/>)}</div><div className="absolute left-[4%] top-[57%] h-[18%] w-[56%] -skew-x-6 rounded-xl border bg-white shadow-xl"/><div className="absolute left-[53%] top-[61%] h-[20%] w-[39%] -skew-x-6 rounded-xl border bg-slate-50 shadow-xl"/><div className={cn("absolute left-[30%] top-[45%] z-10", workspace==="system"&&"scale-105")}><div className={cn("h-20 w-28 rounded-lg border-4 bg-slate-900", workspace==="system"?"border-violet-500 ring-4 ring-violet-300/50":"border-slate-700")}><div className="m-2 h-10 rounded bg-violet-100"/></div></div><Actor className="left-[10%] top-[38%]" label="Paciente" active={workspace==="service"}/><Actor className="left-[43%] top-[26%]" label="TENS 1 · Recepción" active={workspace==="service"||workspace==="system"} staff/><Actor className="left-[73%] top-[31%]" label="TENS 2 · Bandeja" active={workspace==="preparation"} staff tray={trayVisible}/>{documentVisible&&<Spot className="left-[16%] top-[66%]" label="Documento sobre el mesón" active/>}<Spot className="left-[35%] top-[57%]" label="Computador" active={workspace==="system"}/><Spot className="left-[63%] top-[18%]" label="Gavetas / almacenamiento" active={workspace==="storage"}/><Spot className="left-[76%] top-[66%]" label="Mesón de preparación" active={workspace==="preparation"||workspace==="verification"}/></div>;
}
function Actor({className,label,active,staff=false,tray=false}:{className:string;label:string;active:boolean;staff?:boolean;tray?:boolean}){return <div className={cn("absolute z-20 w-32 -translate-x-1/2 text-center",className,active&&"scale-105")}><div className={cn("mx-auto size-14 rounded-full border-4 bg-amber-100",staff?"border-violet-300":"border-emerald-200",active&&"ring-4 ring-violet-300/50")}/><div className={cn("mx-auto -mt-1 h-24 w-20 rounded-[2rem_2rem_1rem_1rem] border-4",staff?"border-violet-300 bg-violet-500":"border-emerald-200 bg-emerald-500")}/>{tray&&<div className="absolute left-1/2 top-24 h-5 w-28 -translate-x-1/2 rounded bg-violet-100"/>}<div className="mt-2 inline-flex rounded-full border border-violet-200 bg-white px-3 py-1 text-[0.66rem] font-black text-violet-700">{label}</div></div>}
function Spot({className,label,active}:{className:string;label:string;active:boolean}){return <div className={cn("absolute z-20 -translate-x-1/2",className)}><div className={cn("mx-auto size-4 rounded-full border-4 border-white",active?"animate-pulse bg-violet-600 ring-4 ring-violet-300/60":"bg-violet-400")}/><div className="mt-1 whitespace-nowrap rounded-xl border bg-white px-3 py-1.5 text-[0.64rem] font-black text-violet-700">{label}</div></div>}
function Panel({title,text,children}:{title:string;text:string;children:React.ReactNode}){return <div><p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-violet-600">Acción interactiva</p><h3 className="mt-1 text-lg font-black">{title}</h3><p className="mt-1 text-sm text-slate-600">{text}</p><div className="mt-4">{children}</div></div>}
function Button({children,onClick,className}:{children:React.ReactNode;onClick:()=>void;className?:string}){return <button type="button" onClick={onClick} className={cn("mt-4 min-h-11 w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-black text-white hover:bg-violet-800",className)}>{children}</button>}
function Patient(){return <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-full bg-emerald-100 font-black text-emerald-700">P</div><div><p className="font-black">Paciente virtual</p><p className="text-xs text-slate-500">Datos completamente ficticios</p></div></div>}
function FakeDocument(){return <div className="mt-4 rounded-xl border border-violet-200 p-4"><p className="text-[0.6rem] font-black uppercase text-violet-600">Documento ficticio</p><p className="mt-2 font-black">{patient.name}</p><p className="text-sm text-slate-600">RUT {patient.rut}</p></div>}
function Medication({med,inspected,onInspect}:{med:(typeof medications)[number];inspected:Field[];onInspect:(field:Field)=>void}){const rows:[Field,string,string][]=[["name","Nombre",med.name],["strength","Concentración",med.strength],["form","Forma farmacéutica",med.form],["quantity","Cantidad",med.quantity]];return <div className="rounded-xl border border-slate-200 p-3"><div className="grid gap-2 sm:grid-cols-2">{rows.map(([field,label,value])=><button key={field} onClick={()=>onInspect(field)} className={cn("rounded-lg border p-2.5 text-left",inspected.includes(field)?"border-violet-300 bg-violet-50":"border-slate-200")}><span className="block text-[0.58rem] font-black uppercase text-slate-400">{label}</span><span className="text-sm font-black">{value}</span></button>)}</div></div>}
function Dock({workspace}:{workspace:string}){const items=[["service","▣","Solicitar documento"],["system","▤","Ir al computador"],["system","▱","Abrir prescripciones"],["preparation","▥","Revisar bandeja"],["verification","◈","Verificar identidad final"],["verification","◌","Entregar indicaciones"],["verification","+","Solicitar apoyo QF"]];return <div className="grid grid-cols-2 gap-2 border-t border-violet-100 bg-white p-3 sm:grid-cols-4 xl:grid-cols-7">{items.map(([w,icon,label])=><div key={label} className={cn("flex min-h-20 items-center gap-3 rounded-2xl border px-3 py-3",w===workspace?"border-violet-500 bg-violet-600 text-white":"border-violet-100 text-violet-700")}><span className="grid size-9 place-items-center rounded-xl bg-violet-50/20 font-black">{icon}</span><span className="text-[0.68rem] font-black">{label}</span></div>)}</div>}
function Objectives(){return <div className="rounded-2xl border border-violet-100 p-4"><h3 className="font-black">◎ Objetivos del caso</h3><ul className="mt-3 space-y-2 text-sm text-slate-700"><li>• Validar identidad y prescripciones.</li><li>• Verificar medicamento, concentración, forma y cantidad.</li><li>• Interceptar discrepancias antes del despacho.</li></ul></div>}
function Criteria({state}:{state:Record<DispensingCriterionId,Status>}){return <div className="rounded-2xl border border-violet-100 p-4"><h3 className="font-black">▤ Criterios evaluados</h3><div className="mt-3 space-y-2">{criteria.map((item,i)=><div key={item.id} className="flex items-start justify-between gap-2"><p className="text-[0.67rem] text-slate-700">{i+1}. {item.label}</p><Pill status={state[item.id]}/></div>)}</div></div>}
function Pill({status}:{status:Status}){const labels={pending:"Pendiente",progress:"En progreso",met:"Cumple",reinforcement:"Refuerzo",intercepted:"Interceptado"};return <span className={cn("shrink-0 rounded px-2 py-1 text-[0.55rem] font-black",status==="met"?"bg-emerald-50 text-emerald-700":status==="intercepted"?"bg-amber-50 text-amber-800":status==="reinforcement"?"bg-rose-50 text-rose-700":status==="progress"?"bg-blue-50 text-blue-700":"bg-slate-100 text-slate-500")}>{labels[status]}</span>}
