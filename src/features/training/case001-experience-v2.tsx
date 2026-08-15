"use client";

import { useRef, useState } from "react";

import { saveSimulationAttempt, type SaveSimulationAttemptResult } from "@/features/progress/actions";
import { Case001IllustratedScene } from "@/features/training/case001-illustrated-scene";
import { cn } from "@/lib/utils";
import type {
  AttemptCriterionResult,
  DispensingCriterionId,
  TrainingCase,
  TrainingMode,
} from "@/types/training-simulation";

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

function createCriteria() {
  return Object.fromEntries(criteria.map((item) => [item.id, "pending"])) as Record<DispensingCriterionId, Status>;
}

export function Case001ExperienceV2({ levelNumber, mode, trainingCase }: Props) {
  const [step, setStep] = useState<Step>("start");
  const [criterionState, setCriterionState] = useState(createCriteria);
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
  const workspace = step === "start" || step === "identity"
    ? "service"
    : ["system", "prescriptions", "emission"].includes(step)
      ? "system"
      : ["preparation", "tray"].includes(step)
        ? "preparation"
        : "verification";

  function setCriterion(id: DispensingCriterionId, status: Status) {
    setCriterionState((current) => ({ ...current, [id]: status }));
  }

  function go(next: Step) {
    setAlert(null);
    setStep(next);
  }

  function inspect(medicationId: string, field: Field) {
    setInspected((current) => {
      const inspectedFields = current[medicationId] ?? [];
      return inspectedFields.includes(field)
        ? current
        : { ...current, [medicationId]: [...inspectedFields, field] };
    });

    const medication = medications.find((item) => item.id === medicationId);
    if (medication && field === "strength" && medication.strength !== medication.expected) {
      setDetected(true);
      setAlert("Detectaste una discrepancia de concentración. Debe resolverse antes del despacho.");
    }
  }

  function finishTray() {
    const complete = medications.every((medication) =>
      (["name", "strength", "form", "quantity"] as Field[]).every((field) =>
        (inspected[medication.id] ?? []).includes(field),
      ),
    );

    if (!complete) {
      setAlert("Aún faltan datos por revisar en la bandeja.");
      return;
    }
    if (!detected) {
      setCriterion("criterion-5-compare-prepared-items", "reinforcement");
      setDetected(true);
      setResolved(true);
      setCriterion("criterion-5-compare-prepared-items", "intercepted");
      setAlert("Barrera final activada: la discrepancia fue interceptada antes de la entrega.");
      go("finalIdentity");
      return;
    }
    if (!resolved) {
      setAlert("La discrepancia fue detectada, pero todavía debe resolverse.");
      return;
    }
    go("finalIdentity");
  }

  async function finish() {
    const results: AttemptCriterionResult[] = criteria.map(({ id }) => ({
      criterionId: id,
      status:
        criterionState[id] === "intercepted"
          ? "intercepted"
          : criterionState[id] === "met"
            ? "met"
            : "reinforcement",
    }));
    const correctAnswers = results.filter((item) => item.status !== "reinforcement").length;
    setStep("result");
    setSaving(true);
    setSave(await saveSimulationAttempt({
      attemptId: attemptId.current,
      correctAnswers,
      incorrectAnswers: 7 - correctAnswers,
      criterionResults: results,
      levelNumber,
      scenarioSlug: trainingCase.id,
      startedAt: startedAt.current,
    }));
    setSaving(false);
  }

  function restart() {
    setStep("start");
    setCriterionState(createCriteria());
    setDocumentVisible(false);
    setRut("");
    setPatientLoaded(false);
    setOpened([]);
    setEmissionChecked(false);
    setInspected({});
    setDetected(false);
    setResolved(false);
    setFinalIdentity(false);
    setGuidanceDone(false);
    setAlert(null);
    setSave(null);
    attemptId.current = crypto.randomUUID();
    startedAt.current = new Date().toISOString();
  }

  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-violet-100 bg-white shadow-[0_28px_90px_rgba(76,48,130,.16)]">
      <SimulationHeader index={index} mode={mode} progress={progress} />

      <div className="grid xl:grid-cols-[minmax(0,1fr)_29rem]">
        <div className="min-w-0 border-b border-violet-100 xl:border-b-0 xl:border-r">
          <div className="relative min-h-[690px] overflow-hidden bg-[#eef1f6]">
            <Case001IllustratedScene
              workspace={workspace}
              documentVisible={documentVisible}
              trayVisible={step === "tray" || step === "preparation"}
            />

            <div className="absolute inset-x-4 bottom-4 z-30 sm:left-1/2 sm:w-[min(94%,40rem)] sm:-translate-x-1/2">
              <div className="max-h-[390px] overflow-auto rounded-[1.45rem] border border-violet-100 bg-white/97 p-5 shadow-[0_26px_80px_rgba(48,31,83,.24)] backdrop-blur-md sm:p-6">
                <InteractionPanel
                  step={step}
                  documentVisible={documentVisible}
                  setDocumentVisible={setDocumentVisible}
                  rut={rut}
                  setRut={setRut}
                  patientLoaded={patientLoaded}
                  setPatientLoaded={setPatientLoaded}
                  opened={opened}
                  setOpened={setOpened}
                  emissionChecked={emissionChecked}
                  setEmissionChecked={setEmissionChecked}
                  inspected={inspected}
                  detected={detected}
                  resolved={resolved}
                  finalIdentity={finalIdentity}
                  guidanceDone={guidanceDone}
                  criterionState={criterionState}
                  saving={saving}
                  save={save}
                  setCriterion={setCriterion}
                  setResolved={setResolved}
                  setFinalIdentity={setFinalIdentity}
                  setGuidanceDone={setGuidanceDone}
                  setAlert={setAlert}
                  inspect={inspect}
                  finishTray={finishTray}
                  finish={finish}
                  restart={restart}
                  go={go}
                />
              </div>
            </div>
          </div>
          <ActionDock workspace={workspace} />
        </div>

        <aside className="space-y-4 bg-[#fcfcfe] p-5">
          <Objectives />
          <Criteria state={criterionState} />
          {alert ? <SafetyAlert message={alert} /> : <SafetyOk />}
          <Reminder />
        </aside>
      </div>

      <footer className="border-t border-violet-100 bg-white px-5 py-3 text-center text-xs font-semibold text-slate-500">
        ⓘ &nbsp; Simulación interactiva — no reemplaza protocolos institucionales.
      </footer>
    </div>
  );
}

function SimulationHeader({ index, mode, progress }: { index: number; mode: TrainingMode; progress: number }) {
  return (
    <header className="grid gap-4 border-b border-violet-100 bg-white px-5 py-4 lg:grid-cols-[1fr_minmax(18rem,32rem)_auto] lg:items-center">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl bg-violet-700 text-2xl font-black text-white shadow-md shadow-violet-200">+</div>
        <div>
          <p className="text-xl font-black tracking-tight text-violet-800">FarmaSim</p>
          <p className="text-xs font-semibold text-slate-500">Simulaciones · Caso 001</p>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-700">
          <span>Etapa {index + 1} de 10</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-violet-100">
          <div className="h-full rounded-full bg-violet-600 transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <span className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">★ {mode.shortLabel}</span>
        <span className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-800">08:37</span>
      </div>
    </header>
  );
}

function InteractionPanel(props: {
  step: Step;
  documentVisible: boolean;
  setDocumentVisible: (value: boolean) => void;
  rut: string;
  setRut: (value: string) => void;
  patientLoaded: boolean;
  setPatientLoaded: (value: boolean) => void;
  opened: string[];
  setOpened: React.Dispatch<React.SetStateAction<string[]>>;
  emissionChecked: boolean;
  setEmissionChecked: (value: boolean) => void;
  inspected: Record<string, Field[]>;
  detected: boolean;
  resolved: boolean;
  finalIdentity: boolean;
  guidanceDone: boolean;
  criterionState: Record<DispensingCriterionId, Status>;
  saving: boolean;
  save: SaveSimulationAttemptResult | null;
  setCriterion: (id: DispensingCriterionId, status: Status) => void;
  setResolved: (value: boolean) => void;
  setFinalIdentity: (value: boolean) => void;
  setGuidanceDone: (value: boolean) => void;
  setAlert: (value: string | null) => void;
  inspect: (medicationId: string, field: Field) => void;
  finishTray: () => void;
  finish: () => void;
  restart: () => void;
  go: (step: Step) => void;
}) {
  const p = props;

  if (p.step === "start") return <Panel title="Nueva atención" text="08:37 h · Farmacia ambulatoria ficticia"><Patient /><PrimaryButton onClick={() => p.go("identity")}>Recibir al paciente</PrimaryButton></Panel>;
  if (p.step === "identity") return <Panel title="Identificación" text="Interactúa con el paciente y solicita el documento."><Patient />{p.documentVisible ? <FakeDocument /> : <PrimaryButton onClick={() => { p.setDocumentVisible(true); p.setCriterion("criterion-1-request-identity-document", "met"); }}>Solicitar documento</PrimaryButton>}{p.documentVisible ? <PrimaryButton onClick={() => p.go("system")}>Ir al computador</PrimaryButton> : null}</Panel>;
  if (p.step === "system") return <Panel title="Sistema clínico ficticio" text="Ingresa el RUT visible en el documento y contrasta el nombre mostrado."><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><input className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-500" onChange={(event) => p.setRut(event.target.value)} placeholder={patient.rut} value={p.rut} /><PrimaryButton className="mt-0" onClick={() => { if (p.rut === patient.rut) { p.setPatientLoaded(true); p.setCriterion("criterion-2-system-identity-match", "progress"); } else p.setAlert("El RUT no coincide con el documento ficticio."); }}>Buscar usuario</PrimaryButton></div>{p.patientLoaded ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-emerald-700">Usuario encontrado</p><p className="mt-1 font-black text-slate-900">{patient.name}</p><p className="text-sm text-slate-600">RUT {patient.rut}</p><PrimaryButton onClick={() => { p.setCriterion("criterion-2-system-identity-match", "met"); p.go("prescriptions"); }}>Confirmar coincidencia</PrimaryButton></div> : null}</Panel>;
  if (p.step === "prescriptions") return <Panel title="Prescripciones disponibles" text="Abre cada registro. El sistema contabiliza silenciosamente cuáles revisaste."><div className="grid gap-2">{prescriptions.map((item) => <button type="button" key={item.id} onClick={() => p.setOpened((current) => current.includes(item.id) ? current : [...current, item.id])} className={cn("rounded-xl border p-3 text-left transition", p.opened.includes(item.id) ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-300")}><div className="flex justify-between gap-3"><strong>{item.title}</strong><span className="text-xs font-black text-violet-700">{p.opened.includes(item.id) ? "Revisada" : "Abrir"}</span></div>{p.opened.includes(item.id) ? <p className="mt-2 text-sm text-slate-600">{item.text} · {item.status}</p> : null}</button>)}</div><PrimaryButton onClick={() => { p.setCriterion("criterion-3-identify-all-prescriptions", p.opened.length === prescriptions.length ? "met" : "reinforcement"); p.go("emission"); }}>Continuar</PrimaryButton></Panel>;
  if (p.step === "emission") return <Panel title="Validación operativa" text="Comprueba el estado administrativo visible; no realices validación clínica."><div className="rounded-xl border border-slate-200 bg-white p-4"><strong>Losartán 50 mg</strong><p className="mt-1 text-sm text-slate-600">Estado: <span className="font-black text-emerald-700">Emitida</span></p></div>{!p.emissionChecked ? <PrimaryButton onClick={() => { p.setEmissionChecked(true); p.setCriterion("criterion-4-confirm-prescription-issued", "met"); }}>Comprobar emisión</PrimaryButton> : <PrimaryButton onClick={() => p.go("preparation")}>Solicitar preparación</PrimaryButton>}</Panel>;
  if (p.step === "preparation") return <Panel title="TENS 2 prepara la bandeja" text="TENS 2 realiza la preparación y lleva los productos al mesón de revisión."><div className="rounded-xl border border-violet-100 bg-violet-50 p-4"><strong>TENS 2 · Preparación en curso</strong><p className="mt-1 text-sm text-slate-600">La bandeja queda disponible para el doble chequeo.</p></div><PrimaryButton onClick={() => p.go("tray")}>Recibir bandeja</PrimaryButton></Panel>;
  if (p.step === "tray") return <Panel title="Revisar bandeja de medicamentos" text="Toca cada dato. La discrepancia no se destaca antes de que la observes."><div className="grid gap-3">{medications.map((medication) => <Medication key={medication.id} med={medication} inspected={p.inspected[medication.id] ?? []} onInspect={(field) => p.inspect(medication.id, field)} />)}</div>{p.detected && !p.resolved ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3"><strong className="text-amber-900">Discrepancia detectada</strong><p className="mt-1 text-sm text-amber-800">La concentración observada no corresponde a la prescripción ficticia.</p><PrimaryButton onClick={() => { p.setResolved(true); p.setCriterion("criterion-5-compare-prepared-items", "intercepted"); p.setAlert("Error interceptado y corregido antes del despacho."); }}>Separar producto y solicitar corrección</PrimaryButton></div> : null}<PrimaryButton onClick={p.finishTray}>Finalizar doble chequeo</PrimaryButton></Panel>;
  if (p.step === "finalIdentity") return <Panel title="Verificación antes de la entrega" text="Vuelve a comprobar identidad del paciente virtual."><FakeDocument />{!p.finalIdentity ? <PrimaryButton onClick={() => { p.setFinalIdentity(true); p.setCriterion("criterion-6-recheck-identity-before-handoff", "met"); }}>Comparar documento y usuario</PrimaryButton> : <PrimaryButton onClick={() => p.go("guidance")}>Continuar a indicaciones</PrimaryButton>}</Panel>;
  if (p.step === "guidance") return <Panel title="Indicaciones" text="Entrega la orientación ficticia definida por el escenario; no genera consejo clínico."><div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm text-slate-700">Orientación educativa autorizada para este caso ficticio.</div>{!p.guidanceDone ? <PrimaryButton onClick={() => { p.setGuidanceDone(true); p.setCriterion("criterion-7-provide-corresponding-instructions", "met"); }}>Entregar indicaciones</PrimaryButton> : <PrimaryButton onClick={p.finish}>Finalizar atención</PrimaryButton>}</Panel>;

  return <Panel title="Resultado del caso" text="Resumen de desempeño según los siete criterios."><div className="space-y-2">{criteria.map((criterion, index) => <div key={criterion.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2"><p className="text-sm text-slate-700">{index + 1}. {criterion.label}</p><StatusPill status={p.criterionState[criterion.id]} /></div>)}</div>{p.saving ? <p className="mt-4 text-sm font-semibold text-slate-500">Guardando progreso…</p> : null}{p.save ? <p className={cn("mt-4 rounded-xl p-3 text-sm font-bold", p.save.status === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800")}>{p.save.message}</p> : null}<PrimaryButton onClick={p.restart}>Repetir caso</PrimaryButton></Panel>;
}

function Panel({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return <div><p className="text-[0.64rem] font-black uppercase tracking-[0.18em] text-violet-600">Acción interactiva</p><h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-600">{text}</p><div className="mt-4">{children}</div></div>;
}

function PrimaryButton({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className?: string }) {
  return <button type="button" onClick={onClick} className={cn("mt-4 min-h-11 w-full rounded-xl bg-gradient-to-r from-violet-700 to-purple-600 px-4 py-3 text-sm font-black text-white shadow-md shadow-violet-200 transition hover:from-violet-800 hover:to-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500", className)}>{children}</button>;
}

function Patient() {
  return <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3"><div className="grid size-10 place-items-center rounded-full bg-emerald-100 font-black text-emerald-700">P</div><div><p className="font-black text-slate-900">Paciente virtual</p><p className="text-xs text-slate-500">Datos completamente ficticios</p></div></div>;
}

function FakeDocument() {
  return <div className="mt-4 rounded-xl border border-violet-200 bg-white p-4 shadow-sm"><p className="text-[0.6rem] font-black uppercase tracking-wide text-violet-600">Documento ficticio</p><p className="mt-2 font-black text-slate-900">{patient.name}</p><p className="text-sm text-slate-600">RUT {patient.rut}</p></div>;
}

function Medication({ med, inspected, onInspect }: { med: (typeof medications)[number]; inspected: Field[]; onInspect: (field: Field) => void }) {
  const rows: [Field, string, string][] = [
    ["name", "Nombre", med.name],
    ["strength", "Concentración", med.strength],
    ["form", "Forma farmacéutica", med.form],
    ["quantity", "Cantidad", med.quantity],
  ];
  return <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><div className="mb-3 flex items-center justify-between"><p className="font-black text-slate-900">Producto preparado</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[0.58rem] font-black text-slate-500">Toca para revisar</span></div><div className="grid gap-2 sm:grid-cols-2">{rows.map(([field, label, value]) => <button type="button" key={field} onClick={() => onInspect(field)} className={cn("rounded-lg border p-2.5 text-left transition", inspected.includes(field) ? "border-violet-300 bg-violet-50" : "border-slate-200 hover:border-violet-300")}><span className="block text-[0.58rem] font-black uppercase tracking-wide text-slate-400">{label}</span><span className="mt-1 block text-sm font-black text-slate-800">{value}</span></button>)}</div></div>;
}

function ActionDock({ workspace }: { workspace: string }) {
  const items = [
    ["service", "▣", "Solicitar documento"],
    ["system", "▤", "Ir al computador"],
    ["system", "▱", "Abrir prescripciones"],
    ["preparation", "▥", "Revisar bandeja"],
    ["verification", "◈", "Verificar identidad final"],
    ["verification", "◌", "Entregar indicaciones"],
    ["verification", "+", "Solicitar apoyo QF"],
  ];
  return <div className="grid grid-cols-2 gap-2 border-t border-violet-100 bg-white p-3 sm:grid-cols-4 xl:grid-cols-7">{items.map(([area, icon, label]) => { const active = area === workspace; return <div key={label} className={cn("flex min-h-20 items-center gap-3 rounded-2xl border px-3 py-3 transition", active ? "border-violet-500 bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-200" : "border-violet-100 bg-white text-violet-700")}><span className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-lg font-black", active ? "bg-white/15" : "bg-violet-50")}>{icon}</span><span className="text-[0.68rem] font-black leading-4">{label}</span></div>; })}</div>;
}

function Objectives() {
  return <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-black text-violet-700">◎</div><h3 className="font-black text-slate-900">Objetivos del caso</h3></div><ul className="mt-4 space-y-2 text-sm leading-5 text-slate-700"><li>• Validar identidad y prescripciones.</li><li>• Verificar medicamento, concentración, forma y cantidad.</li><li>• Interceptar discrepancias antes del despacho.</li></ul></div>;
}

function Criteria({ state }: { state: Record<DispensingCriterionId, Status> }) {
  return <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-black text-violet-700">▤</div><h3 className="font-black text-slate-900">Criterios evaluados</h3></div><div className="mt-4 space-y-2">{criteria.map((item, index) => <div key={item.id} className="flex items-start justify-between gap-2"><p className="text-[0.67rem] leading-4 text-slate-700">{index + 1}. {item.label}</p><StatusPill status={state[item.id]} /></div>)}</div></div>;
}

function StatusPill({ status }: { status: Status }) {
  const labels: Record<Status, string> = { pending: "Pendiente", progress: "En progreso", met: "Cumple", reinforcement: "Refuerzo", intercepted: "Interceptado" };
  return <span className={cn("shrink-0 rounded-md px-2 py-1 text-[0.55rem] font-black", status === "met" ? "bg-emerald-50 text-emerald-700" : status === "intercepted" ? "bg-amber-50 text-amber-800" : status === "reinforcement" ? "bg-rose-50 text-rose-700" : status === "progress" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500")}>{labels[status]}</span>;
}

function SafetyAlert({ message }: { message: string }) {
  return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm"><p className="font-black text-amber-900">⚠ Revisión de seguridad</p><p className="mt-2 text-sm leading-5 text-amber-800">{message}</p></div>;
}

function SafetyOk() {
  return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"><p className="font-black text-emerald-900">● Sin alertas activas</p><p className="mt-1 text-xs text-emerald-800">Todo en orden para continuar.</p></div>;
}

function Reminder() {
  return <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm"><p className="font-black text-slate-900">🔔 NO OLVIDAR</p><p className="mt-1 text-sm leading-5 text-slate-700">Verifica medicamento, concentración, forma farmacéutica y cantidad antes del despacho.</p></div>;
}
