"use client";

import { useMemo, useRef, useState } from "react";

import { saveSimulationAttempt, type SaveSimulationAttemptResult } from "@/features/progress/actions";
import { cn } from "@/lib/utils";
import type {
  AttemptCriterionResult,
  DispensingCriterionId,
  TrainingCase,
  TrainingMode,
} from "@/types/training-simulation";

type Case001InteractiveSessionProps = {
  levelNumber: number;
  mode: TrainingMode;
  trainingCase: TrainingCase;
};

type CriterionUiStatus = "pending" | "progress" | "met" | "reinforcement" | "intercepted";

type StepId =
  | "context"
  | "identity"
  | "system"
  | "prescriptions"
  | "emission"
  | "preparation"
  | "tray"
  | "final-identity"
  | "guidance"
  | "result";

type MedicationField = "name" | "strength" | "form" | "quantity";

const criterionMeta: { id: DispensingCriterionId; group: string; label: string }[] = [
  { id: "criterion-1-request-identity-document", group: "Identificación", label: "Solicita carnet de identidad y/o crónico" },
  { id: "criterion-2-system-identity-match", group: "Identificación", label: "Digita RUT y verifica nombre de usuario" },
  { id: "criterion-3-identify-all-prescriptions", group: "Validación operativa", label: "Identifica todas las prescripciones disponibles" },
  { id: "criterion-4-confirm-prescription-issued", group: "Validación operativa", label: "Verifica que la receta esté emitida" },
  { id: "criterion-5-compare-prepared-items", group: "Preparación", label: "Medicamentos preparados corresponden a la receta" },
  { id: "criterion-6-recheck-identity-before-handoff", group: "Despacho", label: "Vuelve a verificar identidad antes de la entrega" },
  { id: "criterion-7-provide-corresponding-instructions", group: "Despacho", label: "Entrega las indicaciones correspondientes" },
];

const steps: { id: StepId; label: string }[] = [
  { id: "context", label: "Inicio" },
  { id: "identity", label: "Identificación" },
  { id: "system", label: "Sistema" },
  { id: "prescriptions", label: "Prescripciones" },
  { id: "emission", label: "Emisión" },
  { id: "preparation", label: "Preparación" },
  { id: "tray", label: "Doble chequeo" },
  { id: "final-identity", label: "Identidad final" },
  { id: "guidance", label: "Indicaciones" },
  { id: "result", label: "Resultado" },
];

const fakePatient = {
  name: "Marta Fuentes Soto",
  rut: "12.345.678-9",
};

const prescriptions = [
  { id: "rx-001", title: "Prescripción 01", medication: "Losartán 50 mg", status: "Emitida" },
  { id: "rx-002", title: "Prescripción 02", medication: "Amlodipino 5 mg", status: "Emitida" },
  { id: "rx-003", title: "Prescripción 03", medication: "Paracetamol 500 mg", status: "Emitida" },
];

const tray = [
  { id: "losartan", name: "Losartán", strength: "50 mg", expectedStrength: "50 mg", form: "Comprimido", quantity: "30 unidades", discrepant: false },
  { id: "amlodipino", name: "Amlodipino", strength: "10 mg", expectedStrength: "5 mg", form: "Comprimido", quantity: "30 unidades", discrepant: true },
];

function createCriterionState(): Record<DispensingCriterionId, CriterionUiStatus> {
  return Object.fromEntries(criterionMeta.map((criterion) => [criterion.id, "pending"])) as Record<DispensingCriterionId, CriterionUiStatus>;
}

export function Case001InteractiveSession({ levelNumber, mode, trainingCase }: Case001InteractiveSessionProps) {
  const [step, setStep] = useState<StepId>("context");
  const [criteria, setCriteria] = useState(createCriterionState);
  const [documentVisible, setDocumentVisible] = useState(false);
  const [rutInput, setRutInput] = useState("");
  const [patientLoaded, setPatientLoaded] = useState(false);
  const [openedPrescriptionIds, setOpenedPrescriptionIds] = useState<string[]>([]);
  const [emissionChecked, setEmissionChecked] = useState(false);
  const [trayArrived, setTrayArrived] = useState(false);
  const [inspectedFields, setInspectedFields] = useState<Record<string, MedicationField[]>>({});
  const [discrepancyDetected, setDiscrepancyDetected] = useState(false);
  const [discrepancyResolved, setDiscrepancyResolved] = useState(false);
  const [finalIdentityChecked, setFinalIdentityChecked] = useState(false);
  const [guidanceDelivered, setGuidanceDelivered] = useState(false);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<SaveSimulationAttemptResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const attemptId = useRef(crypto.randomUUID());
  const startedAt = useRef(new Date().toISOString());

  const stepIndex = steps.findIndex((item) => item.id === step);
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);
  const activeWorkspace = getWorkspace(step);

  const criteriaComplete = useMemo(
    () => criterionMeta.filter((criterion) => ["met", "intercepted"].includes(criteria[criterion.id])).length,
    [criteria],
  );

  function updateCriterion(id: DispensingCriterionId, status: CriterionUiStatus) {
    setCriteria((current) => ({ ...current, [id]: status }));
  }

  function go(nextStep: StepId) {
    setSafetyMessage(null);
    setStep(nextStep);
  }

  function requestDocument() {
    setDocumentVisible(true);
    updateCriterion("criterion-1-request-identity-document", "met");
  }

  function searchPatient() {
    if (rutInput.replace(/\s/g, "") !== fakePatient.rut) {
      setSafetyMessage("El RUT ficticio ingresado no coincide con el documento visible. Revisa antes de continuar.");
      return;
    }
    setPatientLoaded(true);
    updateCriterion("criterion-2-system-identity-match", "progress");
  }

  function confirmIdentityMatch() {
    if (!patientLoaded) return;
    updateCriterion("criterion-2-system-identity-match", "met");
    go("prescriptions");
  }

  function togglePrescription(id: string) {
    setOpenedPrescriptionIds((current) => (current.includes(id) ? current : [...current, id]));
  }

  function finishPrescriptionReview() {
    if (openedPrescriptionIds.length === prescriptions.length) {
      updateCriterion("criterion-3-identify-all-prescriptions", "met");
    } else {
      updateCriterion("criterion-3-identify-all-prescriptions", "reinforcement");
    }
    go("emission");
  }

  function confirmEmission() {
    setEmissionChecked(true);
    updateCriterion("criterion-4-confirm-prescription-issued", "met");
  }

  function receiveTray() {
    setTrayArrived(true);
    go("tray");
  }

  function inspectField(medicationId: string, field: MedicationField) {
    setInspectedFields((current) => {
      const previous = current[medicationId] ?? [];
      return previous.includes(field) ? current : { ...current, [medicationId]: [...previous, field] };
    });

    const medication = tray.find((item) => item.id === medicationId);
    if (medication?.discrepant && field === "strength") {
      setDiscrepancyDetected(true);
      setSafetyMessage("Detectaste una discrepancia de concentración. La preparación debe corregirse antes del despacho.");
    }
  }

  function resolveDiscrepancy() {
    if (!discrepancyDetected) return;
    setDiscrepancyResolved(true);
    updateCriterion("criterion-5-compare-prepared-items", "intercepted");
    setSafetyMessage("Error interceptado: la concentración fue corregida antes de llegar al paciente virtual.");
  }

  function finishTrayReview() {
    const allInspected = tray.every((medication) => {
      const fields = inspectedFields[medication.id] ?? [];
      return ["name", "strength", "form", "quantity"].every((field) => fields.includes(field as MedicationField));
    });

    if (!allInspected) {
      setSafetyMessage("Aún faltan elementos por comprobar en la bandeja: nombre, concentración, forma farmacéutica y cantidad.");
      return;
    }

    if (discrepancyDetected && !discrepancyResolved) {
      setSafetyMessage("No se puede continuar al despacho mientras exista una discrepancia detectada sin resolver.");
      return;
    }

    if (!discrepancyDetected) {
      updateCriterion("criterion-5-compare-prepared-items", "reinforcement");
      setSafetyMessage("La revisión se completó, pero la discrepancia de concentración no fue identificada. La barrera final la interceptará antes del despacho.");
      return;
    }

    go("final-identity");
  }

  function interceptAtFinalBarrier() {
    setDiscrepancyDetected(true);
    setDiscrepancyResolved(true);
    updateCriterion("criterion-5-compare-prepared-items", "intercepted");
    setSafetyMessage("Barrera final activada: se detectó la discrepancia antes de la entrega.");
    go("final-identity");
  }

  function verifyFinalIdentity() {
    setFinalIdentityChecked(true);
    updateCriterion("criterion-6-recheck-identity-before-handoff", "met");
  }

  function deliverGuidance() {
    setGuidanceDelivered(true);
    updateCriterion("criterion-7-provide-corresponding-instructions", "met");
  }

  async function finishCase() {
    const criterionResults: AttemptCriterionResult[] = criterionMeta.map(({ id }) => ({
      criterionId: id,
      status:
        criteria[id] === "intercepted"
          ? "intercepted"
          : criteria[id] === "met"
            ? "met"
            : "reinforcement",
    }));
    const correctAnswers = criterionResults.filter((result) => result.status === "met" || result.status === "intercepted").length;
    const incorrectAnswers = criterionResults.length - correctAnswers;

    setStep("result");
    setIsSaving(true);
    const result = await saveSimulationAttempt({
      attemptId: attemptId.current,
      correctAnswers,
      criterionResults,
      incorrectAnswers,
      levelNumber,
      scenarioSlug: trainingCase.id,
      startedAt: startedAt.current,
    });
    setSaveResult(result);
    setIsSaving(false);
  }

  function restart() {
    setStep("context");
    setCriteria(createCriterionState());
    setDocumentVisible(false);
    setRutInput("");
    setPatientLoaded(false);
    setOpenedPrescriptionIds([]);
    setEmissionChecked(false);
    setTrayArrived(false);
    setInspectedFields({});
    setDiscrepancyDetected(false);
    setDiscrepancyResolved(false);
    setFinalIdentityChecked(false);
    setGuidanceDelivered(false);
    setSafetyMessage(null);
    setSaveResult(null);
    attemptId.current = crypto.randomUUID();
    startedAt.current = new Date().toISOString();
  }

  return (
    <div className="overflow-hidden rounded-[1.9rem] border border-violet-100 bg-[#f8f7fc] shadow-[0_26px_80px_rgba(75,45,128,.16)]">
      <SimulationHeader mode={mode} progress={progress} stepIndex={stepIndex} />

      <div className="grid xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="min-w-0 border-b border-violet-100 xl:border-b-0 xl:border-r">
          <div className="relative min-h-[650px] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50">
            <PharmacyScene activeWorkspace={activeWorkspace} documentVisible={documentVisible} trayArrived={trayArrived} />

            <div className="absolute right-5 top-5 z-20 hidden max-w-[18rem] rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur md:block">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-violet-600">Paso actual</p>
              <h2 className="mt-1 text-sm font-black text-slate-950">{steps[stepIndex]?.label}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">Interactúa con los elementos de la farmacia para demostrar la acción.</p>
            </div>

            <div className="absolute inset-x-3 bottom-3 z-30 sm:inset-x-auto sm:left-1/2 sm:w-[min(94%,46rem)] sm:-translate-x-1/2">
              <InteractionPanel
                criteria={criteria}
                discrepancyDetected={discrepancyDetected}
                discrepancyResolved={discrepancyResolved}
                documentVisible={documentVisible}
                emissionChecked={emissionChecked}
                finalIdentityChecked={finalIdentityChecked}
                guidanceDelivered={guidanceDelivered}
                inspectedFields={inspectedFields}
                isSaving={isSaving}
                onConfirmEmission={confirmEmission}
                onConfirmIdentityMatch={confirmIdentityMatch}
                onDeliverGuidance={deliverGuidance}
                onFinishCase={finishCase}
                onFinishPrescriptionReview={finishPrescriptionReview}
                onFinishTrayReview={finishTrayReview}
                onInspectField={inspectField}
                onInterceptAtFinalBarrier={interceptAtFinalBarrier}
                onOpenPrescription={togglePrescription}
                onReceiveTray={receiveTray}
                onRequestDocument={requestDocument}
                onResolveDiscrepancy={resolveDiscrepancy}
                onRestart={restart}
                onSearchPatient={searchPatient}
                onStart={() => go("identity")}
                onToPreparation={() => go("preparation")}
                onToSystem={() => go("system")}
                onVerifyFinalIdentity={verifyFinalIdentity}
                openedPrescriptionIds={openedPrescriptionIds}
                patientLoaded={patientLoaded}
                rutInput={rutInput}
                saveResult={saveResult}
                setRutInput={setRutInput}
                step={step}
              />
            </div>
          </div>

          <ActionDock activeWorkspace={activeWorkspace} />
        </div>

        <aside className="space-y-4 bg-white p-4 sm:p-5">
          <ObjectivesCard />
          <CriteriaCard criteria={criteria} />
          {safetyMessage ? <SafetyAlert message={safetyMessage} /> : <SafetyOk />}
          <ReminderCard />
        </aside>
      </div>

      <footer className="border-t border-violet-100 bg-white px-5 py-3 text-center text-xs font-semibold text-slate-500">
        Simulación interactiva — no reemplaza protocolos institucionales.
      </footer>
    </div>
  );
}

function SimulationHeader({ mode, progress, stepIndex }: { mode: TrainingMode; progress: number; stepIndex: number }) {
  return (
    <header className="grid gap-4 border-b border-violet-100 bg-white px-5 py-4 lg:grid-cols-[1fr_minmax(17rem,31rem)_auto] lg:items-center">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl bg-violet-700 text-2xl font-black text-white shadow-md shadow-violet-200">+</div>
        <div>
          <p className="text-lg font-black tracking-tight text-violet-800">FarmaSim</p>
          <p className="text-xs font-semibold text-slate-500">Simulaciones · Caso 001</p>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-700">
          <span>Etapa {stepIndex + 1} de {steps.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-violet-100">
          <div className="h-full rounded-full bg-violet-600 transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <span className="rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">★ {mode.shortLabel}</span>
        <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Caso guiado</span>
      </div>
    </header>
  );
}

function PharmacyScene({ activeWorkspace, documentVisible, trayArrived }: { activeWorkspace: string; documentVisible: boolean; trayArrived: boolean }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-x-0 top-0 h-[61%] bg-gradient-to-b from-[#eee9f8] via-[#f5f4f8] to-[#e9eef4]" />
      <div className="absolute inset-x-0 bottom-0 h-[43%] bg-[linear-gradient(135deg,#e6e9ef_25%,transparent_25%),linear-gradient(225deg,#e6e9ef_25%,transparent_25%),linear-gradient(45deg,#e6e9ef_25%,transparent_25%),linear-gradient(315deg,#e6e9ef_25%,#f7f8fa_25%)] bg-[length:42px_42px]" />
      <div className="absolute left-[4%] top-[8%] hidden h-40 w-28 rounded-xl border-4 border-violet-200 bg-violet-100 p-3 text-center md:block">
        <div className="text-3xl font-black text-violet-700">+</div>
        <p className="mt-2 text-[0.6rem] font-black leading-4 text-violet-700">SEGURIDAD DEL PACIENTE</p>
        <p className="mt-3 text-left text-[0.58rem] font-bold leading-4 text-violet-600">✓ Verifica<br />✓ Confirma<br />✓ Comunica</p>
      </div>
      <div className={cn("absolute left-[57%] top-[9%] grid h-[34%] w-[35%] grid-cols-5 gap-1 rounded-xl border-4 bg-slate-500/80 p-2 shadow-xl", activeWorkspace === "storage" ? "border-violet-500 ring-4 ring-violet-300/50" : "border-slate-400")}>
        {Array.from({ length: 30 }).map((_, index) => <div className={cn("rounded-sm border border-white/60", index % 5 === 0 ? "bg-violet-200" : index % 4 === 0 ? "bg-emerald-100" : "bg-white")} key={index} />)}
      </div>
      <div className="absolute left-[4%] top-[57%] h-[18%] w-[56%] -skew-x-6 rounded-xl border border-slate-300 bg-gradient-to-b from-white to-slate-200 shadow-xl" />
      <div className="absolute left-[53%] top-[61%] h-[20%] w-[39%] -skew-x-6 rounded-xl border border-slate-300 bg-gradient-to-b from-slate-50 to-slate-300 shadow-xl" />
      <div className={cn("absolute left-[30%] top-[45%] z-10", activeWorkspace === "system" && "scale-105")}>
        <div className={cn("h-20 w-28 rounded-lg border-4 bg-slate-900 shadow-lg", activeWorkspace === "system" ? "border-violet-500 ring-4 ring-violet-300/50" : "border-slate-700")}><div className="m-2 h-10 rounded bg-gradient-to-br from-violet-100 to-sky-100" /></div>
        <div className="mx-auto h-6 w-3 bg-slate-600" /><div className="mx-auto h-2 w-14 rounded-full bg-slate-700" />
      </div>
      <Actor className="left-[10%] top-[38%]" label="Paciente" tone="patient" active={activeWorkspace === "service"} />
      <Actor className="left-[43%] top-[26%]" label="TENS 1 · Recepción" tone="staff" active={activeWorkspace === "service" || activeWorkspace === "system"} />
      <Actor className="left-[73%] top-[31%]" label={trayArrived ? "TENS 2 · Bandeja lista" : "TENS 2 · Preparación"} tone="staff" active={activeWorkspace === "preparation"} tray={trayArrived || activeWorkspace === "preparation"} />
      {documentVisible ? <Hotspot className="left-[16%] top-[66%]" active label="Documento sobre el mesón" /> : null}
      <Hotspot className="left-[35%] top-[57%]" active={activeWorkspace === "system"} label="Computador" />
      <Hotspot className="left-[63%] top-[18%]" active={activeWorkspace === "storage"} label="Gavetas / almacenamiento" />
      <Hotspot className="left-[76%] top-[66%]" active={activeWorkspace === "preparation" || activeWorkspace === "verification"} label="Mesón de preparación" />
    </div>
  );
}

function Actor({ active, className, label, tone, tray = false }: { active: boolean; className: string; label: string; tone: "patient" | "staff"; tray?: boolean }) {
  return <div className={cn("absolute z-20 w-32 -translate-x-1/2 text-center transition", className, active && "scale-105")}><div className={cn("mx-auto size-14 rounded-full border-4 bg-amber-100 shadow", tone === "staff" ? "border-violet-300" : "border-emerald-200", active && "ring-4 ring-violet-300/50")} /><div className={cn("mx-auto -mt-1 h-24 w-20 rounded-[2rem_2rem_1rem_1rem] border-4 shadow-md", tone === "staff" ? "border-violet-300 bg-violet-500" : "border-emerald-200 bg-emerald-500")} />{tray ? <div className="absolute left-1/2 top-24 h-5 w-28 -translate-x-1/2 rounded-md border-2 border-violet-300 bg-violet-100 shadow"><span className="absolute left-3 -top-3 size-4 rounded bg-white" /><span className="absolute left-9 -top-4 size-5 rounded bg-amber-100" /><span className="absolute right-3 -top-3 size-4 rounded bg-white" /></div> : null}<div className="mx-auto mt-2 inline-flex rounded-full border border-violet-200 bg-white/95 px-3 py-1 text-[0.66rem] font-black text-violet-700 shadow">{label}</div></div>;
}

function Hotspot({ active, className, label }: { active: boolean; className: string; label: string }) {
  return <div className={cn("absolute z-20 -translate-x-1/2", className)}><div className={cn("mx-auto size-4 rounded-full border-4 border-white shadow transition", active ? "animate-pulse bg-violet-600 ring-4 ring-violet-300/60" : "bg-violet-400")} /><div className={cn("mt-1 whitespace-nowrap rounded-xl border bg-white/95 px-3 py-1.5 text-[0.64rem] font-black shadow", active ? "border-violet-300 text-violet-700" : "border-slate-200 text-slate-500")}>{label}</div></div>;
}

function InteractionPanel(props: {
  criteria: Record<DispensingCriterionId, CriterionUiStatus>;
  discrepancyDetected: boolean;
  discrepancyResolved: boolean;
  documentVisible: boolean;
  emissionChecked: boolean;
  finalIdentityChecked: boolean;
  guidanceDelivered: boolean;
  inspectedFields: Record<string, MedicationField[]>;
  isSaving: boolean;
  onConfirmEmission: () => void;
  onConfirmIdentityMatch: () => void;
  onDeliverGuidance: () => void;
  onFinishCase: () => void;
  onFinishPrescriptionReview: () => void;
  onFinishTrayReview: () => void;
  onInspectField: (medicationId: string, field: MedicationField) => void;
  onInterceptAtFinalBarrier: () => void;
  onOpenPrescription: (id: string) => void;
  onReceiveTray: () => void;
  onRequestDocument: () => void;
  onResolveDiscrepancy: () => void;
  onRestart: () => void;
  onSearchPatient: () => void;
  onStart: () => void;
  onToPreparation: () => void;
  onToSystem: () => void;
  onVerifyFinalIdentity: () => void;
  openedPrescriptionIds: string[];
  patientLoaded: boolean;
  rutInput: string;
  saveResult: SaveSimulationAttemptResult | null;
  setRutInput: (value: string) => void;
  step: StepId;
}) {
  const p = props;
  return (
    <div className="rounded-[1.35rem] bg-white p-4 sm:p-5">
      {p.step === "context" ? <Panel title="Nueva atención" subtitle="08:37 h · Farmacia ambulatoria ficticia"><PatientLine /><PrimaryButton onClick={p.onStart}>Recibir al paciente</PrimaryButton></Panel> : null}
      {p.step === "identity" ? <Panel title="Identificación" subtitle="Interactúa con el paciente; no respondas una pregunta teórica."><PatientLine /><div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-3 text-sm text-slate-700">Paciente: “Buenos días, vengo a retirar mis medicamentos del mes.”</div>{p.documentVisible ? <FakeDocument /> : <PrimaryButton onClick={p.onRequestDocument}>Solicitar documento</PrimaryButton>}{p.documentVisible ? <PrimaryButton onClick={p.onToSystem}>Ir al computador</PrimaryButton> : null}</Panel> : null}
      {p.step === "system" ? <Panel title="Sistema clínico ficticio" subtitle="Ingresa el RUT visible en el documento y contrasta el nombre mostrado."><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><input className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500" onChange={(event) => p.setRutInput(event.target.value)} placeholder="12.345.678-9" value={p.rutInput} /><PrimaryButton className="mt-0" onClick={p.onSearchPatient}>Buscar usuario</PrimaryButton></div>{p.patientLoaded ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-emerald-700">Usuario encontrado</p><p className="mt-1 font-black text-slate-900">{fakePatient.name}</p><p className="text-sm text-slate-600">RUT {fakePatient.rut}</p><PrimaryButton onClick={p.onConfirmIdentityMatch}>Confirmar coincidencia y abrir prescripciones</PrimaryButton></div> : null}</Panel> : null}
      {p.step === "prescriptions" ? <Panel title="Prescripciones disponibles" subtitle="Abre los registros. El sistema contabiliza silenciosamente cuáles revisaste."><div className="grid gap-2">{prescriptions.map((rx) => <button className={cn("rounded-xl border p-3 text-left transition", p.openedPrescriptionIds.includes(rx.id) ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-300")} key={rx.id} onClick={() => p.onOpenPrescription(rx.id)}><div className="flex items-center justify-between gap-3"><span className="font-black text-slate-900">{rx.title}</span><span className="text-xs font-black text-violet-700">{p.openedPrescriptionIds.includes(rx.id) ? "Revisada" : "Abrir"}</span></div>{p.openedPrescriptionIds.includes(rx.id) ? <p className="mt-2 text-sm text-slate-600">{rx.medication} · Estado: {rx.status}</p> : null}</button>)}</div><PrimaryButton onClick={p.onFinishPrescriptionReview}>Continuar</PrimaryButton></Panel> : null}
      {p.step === "emission" ? <Panel title="Validación operativa" subtitle="Comprueba el estado visible de emisión; no realices validación clínica."><div className="rounded-xl border border-slate-200 p-4"><p className="font-black text-slate-900">Prescripción principal</p><p className="mt-1 text-sm text-slate-600">Losartán 50 mg · Estado: <strong className="text-emerald-700">Emitida</strong></p></div>{!p.emissionChecked ? <PrimaryButton onClick={p.onConfirmEmission}>Comprobar estado de emisión</PrimaryButton> : <PrimaryButton onClick={p.onToPreparation}>Solicitar preparación</PrimaryButton>}</Panel> : null}
      {p.step === "preparation" ? <Panel title="TENS 2 prepara la bandeja" subtitle="TENS 1 observa el flujo y recibirá los productos preparados para revisión."><div className="flex items-center gap-4 rounded-xl border border-violet-100 bg-violet-50 p-4"><div className="grid size-12 place-items-center rounded-full bg-violet-600 font-black text-white">T2</div><div><p className="font-black text-slate-900">Preparación en curso</p><p className="text-sm text-slate-600">La bandeja será llevada al mesón de revisión.</p></div></div><PrimaryButton onClick={p.onReceiveTray}>Recibir bandeja</PrimaryButton></Panel> : null}
      {p.step === "tray" ? <Panel title="Revisar bandeja de medicamentos" subtitle="Toca cada dato para demostrar la revisión. La app no destacará la discrepancia antes de que la observes."><div className="grid gap-3">{tray.map((medication) => <MedicationCard inspected={p.inspectedFields[medication.id] ?? []} key={medication.id} medication={medication} onInspect={(field) => p.onInspectField(medication.id, field)} />)}</div>{p.discrepancyDetected && !p.discrepancyResolved ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="font-black text-amber-900">Discrepancia detectada</p><p className="mt-1 text-sm text-amber-800">La concentración observada no corresponde a la prescripción ficticia.</p><PrimaryButton onClick={p.onResolveDiscrepancy}>Separar producto y solicitar corrección</PrimaryButton></div> : null}<PrimaryButton onClick={p.onFinishTrayReview}>Finalizar doble chequeo</PrimaryButton>{!p.discrepancyDetected && Object.values(p.inspectedFields).some((fields) => fields.length >= 4) ? <button className="mt-2 w-full rounded-xl px-4 py-3 text-xs font-black text-amber-800 underline" onClick={p.onInterceptAtFinalBarrier}>Continuar a barrera final</button> : null}</Panel> : null}
      {p.step === "final-identity" ? <Panel title="Verificación antes de la entrega" subtitle="Vuelve a comprobar identidad del paciente virtual."><FakeDocument />{!p.finalIdentityChecked ? <PrimaryButton onClick={p.onVerifyFinalIdentity}>Comparar documento y usuario</PrimaryButton> : <PrimaryButton onClick={() => p.onVerifyFinalIdentity() || undefined}>Identidad verificada</PrimaryButton>}{p.finalIdentityChecked ? <PrimaryButton onClick={() => (window.location.hash = "guidance") || undefined}>Continuar a indicaciones</PrimaryButton> : null}{p.finalIdentityChecked ? <button className="sr-only" onClick={() => undefined}>continuar</button> : null}</Panel> : null}
      {p.step === "guidance" ? <Panel title="Indicaciones" subtitle="Selecciona la orientación ficticia definida por el escenario; no genera consejo clínico."><div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm text-slate-700">Orientación educativa autorizada para este caso ficticio.</div>{!p.guidanceDelivered ? <PrimaryButton onClick={p.onDeliverGuidance}>Entregar indicaciones</PrimaryButton> : <PrimaryButton onClick={p.onFinishCase}>Finalizar atención</PrimaryButton>}</Panel> : null}
      {p.step === "result" ? <Panel title="Resultado del caso" subtitle="Resumen de desempeño según los siete criterios."><ResultSummary criteria={p.criteria} />{p.isSaving ? <p className="mt-4 text-sm font-semibold text-slate-500">Guardando progreso…</p> : null}{p.saveResult ? <p className={cn("mt-4 rounded-xl p-3 text-sm font-bold", p.saveResult.status === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800")}>{p.saveResult.message}</p> : null}<PrimaryButton onClick={p.onRestart}>Repetir caso</PrimaryButton></Panel> : null}
    </div>
  );
}

function Panel({ children, subtitle, title }: { children: React.ReactNode; subtitle: string; title: string }) { return <div><p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-violet-600">Acción interactiva</p><h3 className="mt-1 text-lg font-black text-slate-950">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-600">{subtitle}</p><div className="mt-4">{children}</div></div>; }
function PrimaryButton({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick: () => void }) { return <button className={cn("mt-4 min-h-11 w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-black text-white shadow-md shadow-violet-200 transition hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500", className)} onClick={onClick} type="button">{children}</button>; }
function PatientLine() { return <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-full bg-emerald-100 font-black text-emerald-700">P</div><div><p className="font-black text-slate-900">Paciente virtual</p><p className="text-xs text-slate-500">Datos completamente ficticios</p></div></div>; }
function FakeDocument() { return <div className="mt-4 rounded-xl border border-violet-200 bg-white p-4 shadow-sm"><p className="text-[0.6rem] font-black uppercase tracking-wide text-violet-600">Documento ficticio</p><p className="mt-2 font-black text-slate-900">{fakePatient.name}</p><p className="text-sm text-slate-600">RUT {fakePatient.rut}</p></div>; }

function MedicationCard({ inspected, medication, onInspect }: { inspected: MedicationField[]; medication: (typeof tray)[number]; onInspect: (field: MedicationField) => void }) {
  const rows: { field: MedicationField; label: string; value: string }[] = [
    { field: "name", label: "Nombre", value: medication.name },
    { field: "strength", label: "Concentración", value: medication.strength },
    { field: "form", label: "Forma farmacéutica", value: medication.form },
    { field: "quantity", label: "Cantidad", value: medication.quantity },
  ];
  return <div className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between"><p className="font-black text-slate-900">Producto preparado</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[0.58rem] font-black text-slate-500">Toca para revisar</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{rows.map((row) => <button className={cn("rounded-lg border p-2.5 text-left transition", inspected.includes(row.field) ? "border-violet-300 bg-violet-50" : "border-slate-200 hover:border-violet-300")} key={row.field} onClick={() => onInspect(row.field)}><span className="block text-[0.58rem] font-black uppercase tracking-wide text-slate-400">{row.label}</span><span className="mt-1 block text-sm font-black text-slate-800">{row.value}</span></button>)}</div></div>;
}

function ActionDock({ activeWorkspace }: { activeWorkspace: string }) {
  const actions = [
    ["service", "▣", "Solicitar documento"], ["system", "▤", "Ir al computador"], ["system", "▱", "Abrir prescripciones"], ["preparation", "▥", "Revisar bandeja"], ["verification", "◈", "Verificar identidad final"], ["verification", "◌", "Entregar indicaciones"], ["verification", "+", "Solicitar apoyo QF"],
  ];
  return <div className="grid grid-cols-2 gap-2 border-t border-violet-100 bg-white p-3 sm:grid-cols-4 xl:grid-cols-7">{actions.map(([workspace, icon, label]) => { const active = workspace === activeWorkspace; return <div className={cn("flex min-h-20 items-center gap-3 rounded-2xl border px-3 py-3", active ? "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-200" : "border-violet-100 bg-white text-violet-700")} key={label}><span className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-lg font-black", active ? "bg-white/15" : "bg-violet-50")}>{icon}</span><span className="text-[0.68rem] font-black leading-4">{label}</span></div>; })}</div>;
}

function ObjectivesCard() { return <div className="rounded-2xl border border-violet-100 p-4 shadow-sm"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-black text-violet-700">◎</div><h3 className="font-black text-slate-900">Objetivos del caso</h3></div><ul className="mt-4 space-y-2 text-sm leading-5 text-slate-700"><li>• Validar identidad del paciente y datos ficticios.</li><li>• Revisar todas las prescripciones disponibles.</li><li>• Verificar nombre, concentración, forma y cantidad.</li><li>• Interceptar discrepancias antes del despacho.</li></ul></div>; }

function CriteriaCard({ criteria }: { criteria: Record<DispensingCriterionId, CriterionUiStatus> }) {
  const groups = ["Identificación", "Validación operativa", "Preparación", "Despacho"];
  return <div className="rounded-2xl border border-violet-100 p-4 shadow-sm"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-black text-violet-700">▤</div><div><h3 className="font-black text-slate-900">Criterios evaluados</h3><p className="text-[0.65rem] text-slate-400">{Object.values(criteria).filter((status) => status === "met" || status === "intercepted").length}/7 completados</p></div></div><div className="mt-4 space-y-3">{groups.map((group) => <section className="overflow-hidden rounded-xl border border-violet-100" key={group}><div className="bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">{group}</div><div className="divide-y divide-slate-100">{criterionMeta.filter((criterion) => criterion.group === group).map((criterion, index) => <div className="flex items-start justify-between gap-2 px-3 py-2.5" key={criterion.id}><p className="text-[0.67rem] font-semibold leading-4 text-slate-700">{criterionMeta.findIndex((item) => item.id === criterion.id) + 1}. {criterion.label}</p><StatusPill status={criteria[criterion.id]} /></div>)}</div></section>)}</div></div>;
}

function StatusPill({ status }: { status: CriterionUiStatus }) {
  const labels: Record<CriterionUiStatus, string> = { pending: "Pendiente", progress: "En progreso", met: "Cumple", reinforcement: "Refuerzo", intercepted: "Interceptado" };
  return <span className={cn("shrink-0 rounded-md px-2 py-1 text-[0.55rem] font-black", status === "met" ? "bg-emerald-50 text-emerald-700" : status === "intercepted" ? "bg-amber-50 text-amber-800" : status === "reinforcement" ? "bg-rose-50 text-rose-700" : status === "progress" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500")}>{labels[status]}</span>;
}
function SafetyAlert({ message }: { message: string }) { return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="font-black text-amber-900">⚠ Revisión de seguridad</p><p className="mt-2 text-sm leading-5 text-amber-800">{message}</p></div>; }
function SafetyOk() { return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-black text-emerald-900">● Sin alertas activas</p><p className="mt-2 text-xs text-emerald-800">Continúa con la acción correspondiente a la etapa.</p></div>; }
function ReminderCard() { return <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4"><p className="font-black text-slate-900">🔔 NO OLVIDAR</p><p className="mt-1 text-sm leading-5 text-slate-700">Verifica medicamento, concentración, forma farmacéutica y cantidad antes del despacho.</p></div>; }
function ResultSummary({ criteria }: { criteria: Record<DispensingCriterionId, CriterionUiStatus> }) { return <div className="space-y-2">{criterionMeta.map((criterion, index) => <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2" key={criterion.id}><p className="text-sm font-semibold text-slate-700">{index + 1}. {criterion.label}</p><StatusPill status={criteria[criterion.id]} /></div>)}</div>; }

function getWorkspace(step: StepId) {
  if (step === "identity" || step === "context") return "service";
  if (step === "system" || step === "prescriptions" || step === "emission") return "system";
  if (step === "preparation" || step === "tray") return "preparation";
  if (step === "final-identity" || step === "guidance" || step === "result") return "verification";
  return "service";
}
