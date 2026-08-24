"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { FarmaVerseLogo } from "@/components/brand/farmaverse-logo";
import { dispensingCriteria } from "@/data/training/dispensing-criteria";
import {
  createSimulationSession,
  describeSimulationEvent,
  executeSimulationCommand,
  expectedPrescriptionDisposition,
  expectedPrescriptionLines,
  generateScenarioDefinition,
  getMissionSteps,
  getRecentLearnerActions,
  instructionEvidenceKey,
  instructionSectionLabels,
  recommendReinforcement,
  requiredInstructionEvidence,
  requiredInstructionSections,
  simulationAlertsFromSession,
  type InstructionSection,
  type MedicationPresentation,
  type PlayerRole,
  type ScenarioDefinition,
  type SimulationCommand,
  type SimulationMode,
  type SimulationSession,
} from "@/features/simulation-engine";
import { saveSimulationAttempt } from "@/features/progress/actions";
import { preparedItemForAdvancedLevel } from "@/features/training/advanced-level-preparation";
import { cn } from "@/lib/utils";
import type { AttemptCriterionResult, TrainingCase, TrainingMode } from "@/types/training-simulation";

type Props = {
  exitHref?: string;
  levelNumber: number;
  mode: TrainingMode;
  trainingCase: TrainingCase;
};
type Send = (type: SimulationCommand["type"], data?: SimulationCommand["data"], actorId?: string) => void;
type PersistenceState = { message: string; status: "idle" | "saving" | "saved" | "error" };
type Hotspot = { id: string; label: string; x: string; y: string; event: SimulationCommand["type"] };
type PressureInterruptionId = "clinical-system" | "product-selection" | "final-check";

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

const pressureInterruptions: Record<PressureInterruptionId, { eyebrow: string; title: string; description: string }> = {
  "clinical-system": {
    eyebrow: "Interrupción 1 · Consulta breve",
    title: "Te solicitan orientación en ventanilla",
    description: "La consulta ya fue derivada al equipo disponible. Retoma el caso desde el punto exacto en que estabas.",
  },
  "product-selection": {
    eyebrow: "Interrupción 2 · Reposición",
    title: "Llega un aviso desde almacenamiento",
    description: "El aviso no modifica este caso. Reconoce la interrupción y vuelve a verificar antes de continuar.",
  },
  "final-check": {
    eyebrow: "Interrupción 3 · Cambio de turno",
    title: "Recibes una actualización operativa",
    description: "La actualización quedó registrada. Recupera el hilo y completa la revisión final sin omitir barreras.",
  },
};

function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function pressureInterruptionFor(session: SimulationSession): PressureInterruptionId | null {
  const focus = session.focusedObjectId;
  if (focus === "computer") return "clinical-system";
  if (focus === "storage" || focus?.startsWith("drawer:") || focus?.startsWith("medication:")) return "product-selection";
  if (focus === "tray" && session.eventLog.some((event) => event.type === "tray.inspected")) return "final-check";
  return null;
}

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

function roleLabel(role: PlayerRole) {
  return role === "tens-1" ? "TENS 1 · Atención" : "TENS 2 · Preparación";
}

function storageConditionLabel(condition: ScenarioDefinition["drawers"][number]["physicalCondition"]) {
  if (condition === "damaged-label") return "Rótulo deteriorado";
  if (condition === "double-label") return "Doble rotulación";
  if (condition === "missing-strength") return "Concentración ausente";
  return "Condición normal";
}

function storageStockLabel(stock: ScenarioDefinition["drawers"][number]["stockState"]) {
  if (stock === "low") return "Stock bajo";
  if (stock === "out-of-stock") return "Sin stock";
  return "Stock disponible";
}

function discrepancyMessage(discrepancy: SimulationSession["discrepancies"][number]) {
  if (discrepancy.kind === "patient") return "La identidad cargada no coincide con la persona del caso.";
  if (discrepancy.kind === "final-patient") return "La reidentificación final no coincide.";
  if (discrepancy.kind === "prescription" || discrepancy.kind === "prescription-status") return "El estado de la prescripción requiere revisión antes de continuar.";
  if (discrepancy.kind === "omission") return "Falta un producto esperado en la bandeja.";
  if (discrepancy.kind === "additional-product") return "La bandeja contiene un producto no asociado a la solicitud.";
  const labels = {
    medication: "Medicamento",
    strength: "Concentración",
    "pharmaceutical-form": "Forma farmacéutica",
    quantity: "Cantidad",
  } as const;
  return `${labels[discrepancy.kind]}: esperado ${discrepancy.expected}; observado ${discrepancy.actual}.`;
}

function patientWorkflowState(scenario: ScenarioDefinition, session: SimulationSession) {
  const documentReviewed = session.eventLog.some((event) => event.type === "document.opened");
  const prescriptionsReviewed = session.loadedPatientId === scenario.patient.id
    && session.criteria["criterion-3-identify-all-prescriptions"] === "met"
    && ["met", "intercepted"].includes(session.criteria["criterion-4-confirm-prescription-issued"]);
  const relevantLines = scenario.prescriptions
    .filter((record) => scenario.prescriptionsRelevantToCurrentWithdrawal.includes(record.id))
    .flatMap((record) => record.lines);
  const preparationReviewed = session.eventLog.some((event) => event.type === "tray.inspected")
    && relevantLines.every((line) => session.comparedPrescriptionLineIds.includes(line.id));
  const handoffReady = documentReviewed && prescriptionsReviewed && preparationReviewed;
  const deliveryReady = handoffReady
    && Boolean(session.finalReidentifiedPatientId)
    && session.missingInstructionSections.length === 0;

  return { deliveryReady, documentReviewed, handoffReady, preparationReviewed, prescriptionsReviewed };
}

export function Simulation2DExperience({ exitHref = "/simulaciones", levelNumber, mode, trainingCase }: Props) {
  const resolvedSimulationMode = simulationMode(mode);
  const baseScenario = useMemo(() => {
    const generated = generateScenarioDefinition({ id: trainingCase.id, mode: resolvedSimulationMode });
    return levelNumber >= 6 ? { ...generated, requiredPlayerRole: "tens-1" as const } : generated;
  }, [levelNumber, resolvedSimulationMode, trainingCase.id]);
  const [scenario, setScenario] = useState(baseScenario);
  const [session, setSession] = useState<SimulationSession>(() => createSimulationSession(baseScenario));
  const [persistence, setPersistence] = useState<PersistenceState>({ message: "", status: "idle" });
  const [resetConfirmationVisible, setResetConfirmationVisible] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeInterruption, setActiveInterruption] = useState<PressureInterruptionId | null>(null);
  const [seenInterruptions, setSeenInterruptions] = useState<PressureInterruptionId[]>([]);
  const [, startPersistenceTransition] = useTransition();

  useEffect(() => {
    setScenario(baseScenario);
    setSession(createSimulationSession(baseScenario));
    setPersistence({ message: "", status: "idle" });
    setResetConfirmationVisible(false);
    setElapsedSeconds(0);
    setActiveInterruption(null);
    setSeenInterruptions([]);
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

  const drawer = session.focusedObjectId?.startsWith("drawer:")
    ? scenario.drawers.find((item) => item.id === session.focusedObjectId?.slice(7))
    : undefined;
  const medication = session.focusedObjectId?.startsWith("medication:")
    ? getPresentation(scenario, session.focusedObjectId.slice(11))
    : undefined;
  const terminal = session.deliveryStatus === "completed" || session.deliveryStatus === "safely-stopped";
  const missionSteps = getMissionSteps(scenario, session);
  const completedStepCount = missionSteps.filter((step) => step.status === "completed").length;
  const activeStep = missionSteps.find((step) => step.status === "current" || step.status === "attention");
  const pressureTargetSeconds = mode.pressureTargetSeconds ?? 180;
  const pressureTargetExceeded = elapsedSeconds > pressureTargetSeconds;
  const currentPressureInterruption = pressureInterruptionFor(session);

  useEffect(() => {
    if (levelNumber !== 3 || !session.selectedPlayerRole || terminal) return;
    const intervalId = window.setInterval(() => setElapsedSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(intervalId);
  }, [levelNumber, session.selectedPlayerRole, terminal]);

  useEffect(() => {
    if (
      levelNumber !== 3
      || activeInterruption
      || !currentPressureInterruption
      || !mode.interruptionStageIds.includes(currentPressureInterruption)
      || seenInterruptions.includes(currentPressureInterruption)
    ) return;
    setActiveInterruption(currentPressureInterruption);
    setSeenInterruptions((current) => [...current, currentPressureInterruption]);
  }, [activeInterruption, currentPressureInterruption, levelNumber, mode.interruptionStageIds, seenInterruptions]);

  const persistAttempt = useCallback(async () => {
    if (session.deliveryStatus !== "completed" && session.deliveryStatus !== "safely-stopped") return;
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
        simulationAlerts: simulationAlertsFromSession(scenario, session),
        startedAt: session.startedAt,
      });
      setPersistence({
        message: result.status === "error" ? result.message : "Progreso guardado en tu cuenta.",
        status: result.status === "error" ? "error" : "saved",
      });
    } catch {
      setPersistence({ message: "No pudimos guardar el progreso. Revisa tu conexión y vuelve a intentarlo.", status: "error" });
    }
  }, [levelNumber, scenario, session, trainingCase.id]);

  useEffect(() => {
    if (terminal && persistence.status === "idle") {
      startPersistenceTransition(() => void persistAttempt());
    }
  }, [persistAttempt, persistence.status, startPersistenceTransition, terminal]);

  function selectRole(role: PlayerRole) {
    if (session.selectedPlayerRole) return;
    if (scenario.requiredPlayerRole && scenario.requiredPlayerRole !== role) return;

    const commands: SimulationCommand[] = [
      { type: "role.selected", actorId: role, data: { selectedRole: role } },
    ];

    if (role === "tens-1") {
      for (const [index, line] of expectedPrescriptionLines(scenario).entries()) {
        const prepared = preparedItemForAdvancedLevel(scenario, line, index, levelNumber);
        commands.push(
          { type: "medication.taken", actorId: "tens-2", data: { medicationPresentationId: prepared.medicationPresentationId } },
          {
            type: "medication.added_to_tray",
            actorId: "tens-2",
            data: {
              trayItemId: `simulation:${line.id}`,
              prescriptionLineId: line.id,
              medicationPresentationId: prepared.medicationPresentationId,
              quantity: prepared.quantity,
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
      for (const prescriptionId of scenario.availablePrescriptionIds) {
        commands.push({ type: "prescription.opened", actorId: "tens-1", data: { prescriptionId } });
        if (scenario.prescriptionsRelevantToCurrentWithdrawal.includes(prescriptionId)) {
          const prescription = scenario.prescriptions.find((item) => item.id === prescriptionId);
          if (prescription) {
            commands.push({
              type: "prescription.status_verified",
              actorId: "tens-1",
              data: {
                prescriptionId,
                disposition: expectedPrescriptionDisposition(prescription),
              },
            });
          }
        }
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
      commands.push({ type: "identity.rechecked", actorId: "tens-1", data: { patientId: scenario.patient.id } });
      for (const requirement of requiredInstructionEvidence(scenario)) {
        commands.push({
          type: "instruction.section_given",
          actorId: "tens-1",
          data: {
            prescriptionLineId: requirement.prescriptionLineId,
            section: requirement.section,
          },
        });
      }
      commands.push({ type: "delivery.attempted", actorId: "tens-1" });
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
    setResetConfirmationVisible(false);
    setElapsedSeconds(0);
    setActiveInterruption(null);
    setSeenInterruptions([]);
  }

  function resetSimulation() {
    setScenario(baseScenario);
    setSession(createSimulationSession(baseScenario));
    setPersistence({ message: "", status: "idle" });
    setResetConfirmationVisible(false);
    setElapsedSeconds(0);
    setActiveInterruption(null);
    setSeenInterruptions([]);
  }

  return (
    <div className="simulation-frame overflow-hidden rounded-[1.6rem] border border-violet-100 bg-white shadow-[0_22px_70px_rgba(76,48,130,.13)]">
      <nav aria-label="Controles de la simulación" className="simulation-toolbar flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-emerald-100 bg-white px-3 py-2 sm:px-5">
        <Link className="inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-semibold text-[var(--brand-strong)] hover:bg-emerald-50" href={exitHref}>
          <span aria-hidden="true" className="mr-1.5">←</span>
          Salir<span className="hidden sm:inline"> del caso</span>
        </Link>
        <div className="min-w-0 flex-1 text-center" aria-live={levelNumber === 3 ? undefined : "polite"}>
          <p className="truncate text-[.68rem] font-semibold uppercase tracking-[.08em] text-slate-500">
            {!session.selectedPlayerRole
              ? "Selecciona un rol para comenzar"
              : terminal
                ? "Caso finalizado"
                : levelNumber === 3
                  ? "Turno con presión · cronómetro informativo"
                  : levelNumber === 4
                    ? "Consolidación autónoma"
                    : levelNumber === 6
                      ? "Control de discrepancias múltiples"
                      : levelNumber === 7
                        ? "Cierre experto"
                        : `Paso ${Math.min(completedStepCount + 1, missionSteps.length)} de ${missionSteps.length}`}
          </p>
          {session.selectedPlayerRole && levelNumber === 3 ? (
            <p className={cn("truncate text-xs font-semibold tabular-nums", pressureTargetExceeded ? "text-amber-700" : "text-slate-800")}>{formatElapsedTime(elapsedSeconds)} / {formatElapsedTime(pressureTargetSeconds)}</p>
          ) : session.selectedPlayerRole && levelNumber === 4 ? (
            <p className="truncate text-xs font-semibold text-slate-800">Sin pistas de secuencia</p>
          ) : session.selectedPlayerRole && levelNumber === 7 ? (
            <p className="truncate text-xs font-semibold text-slate-800">Sin ayudas ni retroalimentación anticipada</p>
          ) : session.selectedPlayerRole && activeStep ? (
            <p className="truncate text-xs font-semibold text-slate-800">{activeStep.label}</p>
          ) : null}
        </div>
        {resetConfirmationVisible ? (
          <div className="flex items-center gap-1">
            <button className="min-h-9 rounded-lg px-2 text-xs font-semibold text-slate-500 hover:bg-slate-100" onClick={() => setResetConfirmationVisible(false)} type="button">Cancelar</button>
            <button className="min-h-9 rounded-lg bg-rose-700 px-3 text-xs font-semibold text-white hover:bg-rose-800" onClick={resetSimulation} type="button">Confirmar</button>
          </div>
        ) : (
          <button className="inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100" onClick={() => setResetConfirmationVisible(true)} type="button">
            Reiniciar
          </button>
        )}
      </nav>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <FarmaVerseLogo className="w-28 shrink-0 sm:w-32" />
          <div className="min-w-0 border-l border-emerald-200 pl-3">
            <p className="text-sm font-bold text-[var(--foreground)]">Simulación clínica</p>
            <p className="truncate text-xs font-medium text-slate-500">{trainingCase.title}</p>
          </div>
        </div>
        <div className="flex gap-2" aria-label="Seleccionar rol">
          {(["tens-1", "tens-2"] as const).map((role) => {
            const lockedOut = Boolean(
              session.selectedPlayerRole
              || (scenario.requiredPlayerRole && scenario.requiredPlayerRole !== role),
            );
            return (
              <button
                aria-pressed={session.selectedPlayerRole === role}
                className={cn(
                  "min-h-10 rounded-xl border px-4 text-xs font-black transition",
                  session.selectedPlayerRole === role
                    ? "border-violet-700 bg-violet-700 text-white"
                    : "border-violet-200 text-violet-700 hover:bg-violet-50",
                  lockedOut && session.selectedPlayerRole !== role && "cursor-not-allowed opacity-40",
                )}
                disabled={lockedOut}
                key={role}
                onClick={() => selectRole(role)}
                type="button"
              >
                {roleLabel(role)}
              </button>
            );
          })}
        </div>
        <span className="rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">
          {levelNumber === 3 ? "Presión" : levelNumber === 4 ? "Autónomo" : levelNumber === 6 ? "Múltiple" : levelNumber === 7 ? "Experto" : scenario.mode === "guided" ? "Guiado" : scenario.mode === "practice" ? "Práctica" : "Evaluación"}
        </span>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_27rem]">
        <section aria-label="Escena interactiva de la farmacia" className="relative min-h-[28rem] overflow-hidden bg-slate-200 sm:min-h-[36rem] xl:min-h-[720px]" data-mode={scenario.mode}>
          <div className={cn("absolute inset-0 transition-transform duration-700", session.focusedObjectId && "scale-110")} style={{ transformOrigin: focusOrigin(session.focusedObjectId) }}>
            <Image alt="Farmacia ambulatoria 2D interactiva" className="object-cover" fill priority sizes="(min-width: 1280px) 70vw, 100vw" src="/images/farmasim/case001-scene.jpg" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-white/5" />
          </div>

          {session.selectedPlayerRole && levelNumber === 3 ? (
            <div className="absolute left-4 top-4 z-30 max-w-44 rounded-2xl border border-white/25 bg-slate-950/75 p-3 text-white shadow-xl backdrop-blur sm:left-5 sm:top-5 sm:max-w-none sm:px-4">
              <p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-emerald-300">Turno con presión</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                <p className="text-xl font-bold tabular-nums">{formatElapsedTime(elapsedSeconds)}</p>
                <span aria-label={`${seenInterruptions.length} de ${mode.interruptionStageIds.length} interrupciones`} className={cn("rounded-full px-2 py-1 text-[.62rem] font-bold", pressureTargetExceeded ? "bg-amber-300 text-amber-950" : "bg-white/15 text-white")}>{seenInterruptions.length}/{mode.interruptionStageIds.length}<span className="hidden sm:inline"> interrupciones</span></span>
              </div>
              <p className="mt-1 hidden text-[.68rem] text-white/70 sm:block">El tiempo no bloquea ni penaliza el caso.</p>
            </div>
          ) : session.selectedPlayerRole && levelNumber === 4 ? (
            <div className="absolute left-4 top-4 z-30 max-w-44 rounded-2xl border border-white/25 bg-slate-950/75 p-3 text-white shadow-xl backdrop-blur sm:left-5 sm:top-5 sm:max-w-none sm:px-4">
              <p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-emerald-300">Consolidación</p>
              <p className="mt-1 text-sm font-bold">Decisión autónoma</p>
              <p className="mt-1 hidden text-[.68rem] text-white/70 sm:block">Sin cronómetro ni pistas de secuencia.</p>
            </div>
          ) : session.selectedPlayerRole && levelNumber === 6 ? (
            <div className="absolute left-4 top-4 z-30 max-w-44 rounded-2xl border border-white/25 bg-slate-950/75 p-3 text-white shadow-xl backdrop-blur sm:left-5 sm:top-5 sm:max-w-none sm:px-4">
              <p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-emerald-300">Control múltiple</p>
              <p className="mt-1 text-sm font-bold">Verificación cruzada</p>
              <p className="mt-1 hidden max-w-56 text-[.68rem] leading-5 text-white/70 sm:block">Los hallazgos se revelan sólo al activar la barrera correspondiente.</p>
            </div>
          ) : session.selectedPlayerRole && levelNumber === 7 ? (
            <div className="absolute left-4 top-4 z-30 max-w-44 rounded-2xl border border-white/25 bg-slate-950/80 p-3 text-white shadow-xl backdrop-blur sm:left-5 sm:top-5 sm:max-w-none sm:px-4">
              <p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-emerald-300">Cierre experto</p>
              <p className="mt-1 text-sm font-bold">Autonomía total</p>
              <p className="mt-1 hidden max-w-56 text-[.68rem] leading-5 text-white/70 sm:block">Las decisiones se auditan al finalizar.</p>
            </div>
          ) : null}

          {!session.selectedPlayerRole ? (
            <div className="absolute inset-0 z-30 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-[2px] sm:p-6">
              <div aria-describedby="simulation-role-gate-description" aria-labelledby="simulation-role-gate-title" aria-modal="true" className="simulation-role-gate w-full max-w-md rounded-3xl border border-white/30 bg-white/95 p-5 text-center shadow-2xl sm:p-6" role="dialog">
                <p className="text-xs font-black uppercase tracking-[.18em] text-violet-600">
                  {scenario.requiredPlayerRole && levelNumber >= 6 ? "Caso avanzado" : scenario.requiredPlayerRole ? "Refuerzo dirigido" : "Antes de comenzar"}
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950" id="simulation-role-gate-title">
                  {scenario.requiredPlayerRole && levelNumber >= 6 ? "Realiza la revisión final" : scenario.requiredPlayerRole ? `Continúa como ${roleLabel(scenario.requiredPlayerRole)}` : "Elige tu rol"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600" id="simulation-role-gate-description">
                  {scenario.requiredPlayerRole && levelNumber >= 6
                    ? "Participarás como TENS 1. La preparación viene desde TENS 2 y debes verificarla antes de cualquier entrega."
                    : scenario.requiredPlayerRole
                    ? "Este refuerzo entrena una competencia asociada a ese rol. El otro rol queda a cargo de la simulación."
                    : "Selecciona el rol con el que quieres realizar este caso."}
                </p>
                <div className="simulation-role-actions mt-5 grid grid-cols-2 gap-2.5 text-left">
                  {(["tens-1", "tens-2"] as const).map((role) => {
                    const unavailable = Boolean(scenario.requiredPlayerRole && scenario.requiredPlayerRole !== role);
                    return (
                      <button
                        className="min-h-14 rounded-xl border border-violet-200 bg-white px-3 py-2 text-violet-700 shadow-[0_7px_20px_rgb(19_33_60/.10)] transition hover:-translate-y-0.5 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={unavailable}
                        key={role}
                        onClick={() => selectRole(role)}
                        type="button"
                      >
                        <span className="block text-xs font-bold">{roleLabel(role)}</span>
                        <span className="mt-0.5 block text-[.65rem] font-medium text-slate-500">{role === "tens-1" ? "Atención y entrega" : "Preparación"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {session.selectedPlayerRole && !terminal ? hotspots.map((hotspot) => (
            <button
              aria-label={`Interactuar con ${hotspot.label}`}
              className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
              key={hotspot.id}
              onClick={() => send(hotspot.event)}
              style={{ left: hotspot.x, top: hotspot.y }}
              type="button"
            >
              <span className={cn("mx-auto block size-4 rounded-full border-[3px] border-white bg-violet-600 shadow-lg transition group-hover:scale-125", scenario.mode === "assessment" && "opacity-45 group-hover:opacity-100")} />
              <span className={cn("mt-2 block rounded-xl bg-white/95 px-3 py-1.5 text-xs font-black text-violet-800 shadow transition", scenario.mode === "guided" ? "opacity-100" : "opacity-100 lg:translate-y-1 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-visible:translate-y-0 lg:group-focus-visible:opacity-100")}>{hotspot.label}</span>
            </button>
          )) : null}

          {activeInterruption ? (
            <div className="absolute inset-0 z-40 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-[3px]" role="dialog" aria-modal="true" aria-labelledby="pressure-interruption-title">
              <div className="w-full max-w-sm rounded-3xl border border-white/25 bg-white p-5 shadow-2xl sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-amber-100 text-lg text-amber-800" aria-hidden="true">!</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[.65rem] font-bold text-slate-600">Pausa informativa</span>
                </div>
                <p className="mt-5 text-[.68rem] font-bold uppercase tracking-[.14em] text-amber-700">{pressureInterruptions[activeInterruption].eyebrow}</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950" id="pressure-interruption-title">{pressureInterruptions[activeInterruption].title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{pressureInterruptions[activeInterruption].description}</p>
                <button className="mt-5 min-h-12 w-full rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white hover:bg-[var(--brand-strong)]" onClick={() => setActiveInterruption(null)} type="button">Retomar desde donde estaba</button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4 bg-[#fcfcfe] p-4 sm:p-5 xl:max-h-[720px] xl:overflow-y-auto xl:pb-6">
          <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-[0_12px_35px_rgba(76,48,130,.08)] sm:p-5" aria-live="polite">
            {terminal ? (
              <Results levelNumber={levelNumber} onReinforcement={startReinforcement} onRetry={persistAttempt} persistence={persistence} session={session} />
            ) : session.deliveryStatus === "blocked" && scenario.mode !== "assessment" ? (
              <SafetyStop session={session} send={send} />
            ) : session.deliveryStatus === "blocked" ? (
              <AssessmentBlocked send={send} />
            ) : medication ? (
              <MedicationView key={medication.id} medication={medication} scenario={scenario} send={send} session={session} />
            ) : drawer ? (
              <DrawerView drawer={drawer} scenario={scenario} send={send} />
            ) : (
              <FocusView
                finishPreparationAsTens2={finishPreparationAsTens2}
                scenario={scenario}
                searchPatient={searchPatient}
                send={send}
                session={session}
              />
            )}
          </section>
          <LearnerSidebar levelNumber={levelNumber} mode={mode} scenario={scenario} session={session} />
          {process.env.NEXT_PUBLIC_SIMULATION_AUDIT === "true" ? <TechnicalAudit session={session} /> : null}
        </aside>
      </div>
    </div>
  );
}

function FocusView({ finishPreparationAsTens2, scenario, searchPatient, send, session }: {
  finishPreparationAsTens2: () => void;
  scenario: ScenarioDefinition;
  searchPatient: () => void;
  send: Send;
  session: SimulationSession;
}) {
  const focus = session.focusedObjectId;
  if (!focus) return <Panel eyebrow="ESCENA GENERAL" title="Explora la farmacia"><p className="text-sm leading-6 text-slate-600">Selecciona un objeto de la escena para continuar.</p></Panel>;
  if (focus === "patient") {
    const workflow = patientWorkflowState(scenario, session);
    return (
      <Panel eyebrow="ATENCIÓN" title="Paciente">
        <p className="rounded-xl bg-violet-50 p-3 text-sm">“Buenos días, vengo a retirar mis medicamentos.”</p>

        {!workflow.documentReviewed ? (
          <Action onClick={() => { send("document.requested"); send("document.opened"); }}>Solicitar y revisar documento</Action>
        ) : null}

        {workflow.documentReviewed && !workflow.prescriptionsReviewed ? (
          <NextStepPrompt
            actionLabel="Ir al computador"
            description="La identidad inicial está registrada. Busca al paciente y revisa las prescripciones disponibles."
            onAction={() => send("computer.focused")}
            title="Continúa con la revisión clínica"
          />
        ) : null}

        {workflow.prescriptionsReviewed && !workflow.preparationReviewed ? (
          <NextStepPrompt
            actionLabel={session.selectedPlayerRole === "tens-2" ? "Volver a preparación" : "Revisar la bandeja"}
            description={session.selectedPlayerRole === "tens-2"
              ? "Completa la preparación y envía la bandeja al puesto de atención."
              : "La revisión clínica está completa. Inspecciona cada producto antes de la entrega."}
            onAction={() => send(session.selectedPlayerRole === "tens-2" ? "preparation.focused" : "tray.inspected")}
            title="Verifica la preparación"
          />
        ) : null}

        {workflow.handoffReady ? (
          <div className="mt-4 border-t border-emerald-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--brand-strong)]">Cierre de la atención</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">La identidad, las prescripciones y la preparación ya fueron revisadas. Completa la entrega con el paciente.</p>
            <FinalIdentityCheck scenario={scenario} send={send} session={session} />
            <PatientCounseling scenario={scenario} send={send} session={session} />
          </div>
        ) : null}

        {workflow.deliveryReady ? (
          <button className="mt-4 min-h-12 w-full rounded-xl bg-violet-700 px-4 font-bold text-white transition-colors hover:bg-violet-800" onClick={() => send("delivery.attempted")} type="button">Confirmar entrega</button>
        ) : workflow.handoffReady ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">Completa la reidentificación y todas las indicaciones para habilitar la entrega.</p>
        ) : null}
        <Back send={send} />
      </Panel>
    );
  }
  if (focus === "document") return <Panel eyebrow="DOCUMENTO FICTICIO" title="Identificación"><div className="rounded-xl bg-violet-50 p-4"><p className="font-black">{fullName(scenario)}</p><p className="text-sm">RUT {scenario.patient.rut}</p><p className="text-sm">Edad {scenario.patient.age} años</p></div><Back send={send} /></Panel>;
  if (focus === "computer") return <Computer scenario={scenario} searchPatient={searchPatient} send={send} session={session} />;
  if (focus === "storage") return <Storage scenario={scenario} send={send} />;
  if (focus === "preparation") return <Panel eyebrow="ROL" title="TENS 2 · Preparación"><p className="text-sm text-slate-600">Control actual: <strong>{session.actorControllers["tens-2"] === "participant" ? "participante" : "simulación"}</strong>.</p><Action onClick={() => send("storage.focused")}>Ir al almacenamiento</Action>{session.selectedPlayerRole === "tens-2" ? <Action onClick={finishPreparationAsTens2}>Enviar bandeja a TENS 1</Action> : null}<Back send={send} /></Panel>;
  if (focus === "tray") return <TrayView scenario={scenario} send={send} session={session} />;
  return <Panel eyebrow="ESCENA" title="Interacción"><Back send={send} /></Panel>;
}

function FinalIdentityCheck({ scenario, send, session }: { scenario: ScenarioDefinition; send: Send; session: SimulationSession }) {
  const [rut, setRut] = useState("");
  const candidates = [scenario.patient, ...scenario.similarPatients];
  const confirmed = session.finalReidentifiedPatientId;
  const correct = confirmed === scenario.patient.id;

  function confirm() {
    const normalized = normalizeRut(rut);
    const match = candidates.find((patient) => normalizeRut(patient.rut) === normalized);
    send("identity.rechecked", { patientId: match?.id ?? `unknown:${normalized || "empty"}` });
  }

  return (
    <div className="mt-4 rounded-2xl border border-violet-100 bg-white p-3">
      <p className="text-xs font-black uppercase tracking-wider text-violet-700">Reidentificación antes de la entrega</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Vuelve a ingresar el RUT del paciente que recibirá la preparación.</p>
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <input
          aria-label="RUT para reidentificación final"
          className="min-h-10 rounded-lg border border-violet-200 px-3 text-sm"
          onChange={(event) => setRut(event.target.value)}
          placeholder="RUT del paciente"
          value={rut}
        />
        <button className="rounded-lg bg-violet-700 px-3 text-xs font-black text-white" onClick={confirm} type="button">Confirmar</button>
      </div>
      {confirmed ? (
        scenario.mode === "assessment"
          ? <p className="mt-2 text-xs font-bold text-slate-500">Reidentificación registrada.</p>
          : <p className={cn("mt-2 text-xs font-black", correct ? "text-emerald-700" : "text-amber-700")}>{correct ? "Identidad final coincidente." : "La identidad final no coincide. Revisa nuevamente al paciente."}</p>
      ) : null}
    </div>
  );
}

function instructionContent(presentation: MedicationPresentation | undefined, section: InstructionSection) {
  const education = presentation?.education;
  if (!education) return [];
  if (section === "purpose") return [education.purpose].filter(Boolean);
  if (section === "schedule-administration") return [education.relevantSchedule, education.foodRelationship, education.administerWith].filter((item): item is string => Boolean(item));
  if (section === "precautions") return [...(education.avoid ?? []), education.practicalRecommendation].filter((item): item is string => Boolean(item));
  return education.consultQfWhen ?? [];
}

function PatientCounseling({ scenario, send, session }: { scenario: ScenarioDefinition; send: Send; session: SimulationSession }) {
  const requirements = requiredInstructionEvidence(scenario);
  const lineIds = Array.from(new Set(requirements.map((item) => item.prescriptionLineId)));
  return (
    <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-3">
      <p className="text-xs font-black uppercase tracking-wider text-violet-700">Indicaciones al paciente</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Registra cada parte que realmente comunicas. El simulador no inventa contenido clínico: solo muestra texto específico cuando la presentación tiene una fuente educativa cargada.</p>
      {scenario.mode === "guided" && scenario.reinforcementInstructionFocusSection ? (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-900">Foco del refuerzo: {instructionSectionLabels[scenario.reinforcementInstructionFocusSection]}.</p>
      ) : null}
      <div className="mt-3 space-y-3">
        {lineIds.map((lineId) => {
          const line = scenario.prescriptions.flatMap((record) => record.lines).find((item) => item.id === lineId);
          const presentation = line ? getPresentation(scenario, line.medicationPresentationId) : undefined;
          return (
            <div className="rounded-xl border border-violet-100 bg-white p-3" key={lineId}>
              <p className="text-sm font-black">{presentation?.medicationName ?? "Medicamento"} · {presentation?.strength}</p>
              <div className="mt-2 space-y-2">
                {requiredInstructionSections.map((section) => {
                  const key = instructionEvidenceKey(lineId, section);
                  const completed = session.instructionEvidenceKeys.includes(key);
                  const content = instructionContent(presentation, section);
                  return (
                    <div className="rounded-lg border border-slate-100 p-2" key={section}>
                      <button
                        className={cn("w-full rounded-lg px-3 py-2 text-left text-xs font-black", completed ? "bg-emerald-100 text-emerald-800" : "bg-violet-700 text-white")}
                        onClick={() => send("instruction.section_given", { prescriptionLineId: lineId, section })}
                        type="button"
                      >
                        {completed ? "✓ " : ""}{instructionSectionLabels[section]}
                      </button>
                      {scenario.mode === "guided" && content.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600">{content.map((item) => <li key={item}>{item}</li>)}</ul> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Computer({ scenario, searchPatient, send, session }: { scenario: ScenarioDefinition; searchPatient: () => void; send: Send; session: SimulationSession }) {
  const loaded = [scenario.patient, ...scenario.similarPatients].find((patient) => patient.id === session.loadedPatientId);
  const records = scenario.prescriptions.filter((record) => record.patientId === session.loadedPatientId && scenario.visibleClinicalRecordIds.includes(record.id));
  const hasHeldCurrentPrescription = scenario.prescriptionsRelevantToCurrentWithdrawal.some(
    (prescriptionId) => session.prescriptionDispositionById[prescriptionId] === "hold-for-review",
  );
  const activeFacilityName = establishmentNames[scenario.activeDispensingFacilityId] ?? scenario.activeDispensingFacilityId;

  return (
    <Panel eyebrow="COMPUTADOR" title="Sistema clínico simulado">
      <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 p-3">
        <p className="text-[.65rem] font-black uppercase tracking-wider text-violet-700">Establecimiento de retiro activo</p>
        <p className="mt-1 text-sm font-black text-slate-900">{activeFacilityName}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Los registros de otros establecimientos siguen visibles como antecedentes, pero no alimentan la preparación de esta atención.</p>
      </div>
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
          const disposition = session.prescriptionDispositionById[record.id];
          const current = scenario.prescriptionsRelevantToCurrentWithdrawal.includes(record.id);
          const available = scenario.availablePrescriptionIds.includes(record.id);
          const otherFacility = record.establishmentId !== scenario.activeDispensingFacilityId;
          const contextLabel = current
            ? "RETIRO ACTUAL"
            : otherFacility
              ? "ANTECEDENTE · OTRO ESTABLECIMIENTO"
              : available
                ? "DISPONIBLE · ESTABLECIMIENTO ACTIVO"
                : "REGISTRO HISTÓRICO";
          return (
            <div className="rounded-xl border p-3" key={record.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black">{establishmentNames[record.establishmentId] ?? record.establishmentId}</p>
                  <p className="text-xs text-slate-500">Estado: {record.status} · Emisión: {record.dates.issuedAt}</p>
                  <p className="mt-1 text-[.7rem] font-bold text-violet-700">{contextLabel}</p>
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
                  </div>
                  {current ? (
                    <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3">
                      <p className="font-black text-slate-800">Decisión sobre el estado</p>
                      <p className="mt-1 leading-5 text-slate-500">Después de revisar el estado y las fechas, decide si el retiro puede continuar o debe detenerse para revisión.</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <button
                          className={cn("rounded-lg px-3 py-2 font-black", disposition === "proceed" ? "bg-emerald-100 text-emerald-800" : "border border-violet-200 bg-white text-violet-700")}
                          onClick={() => send("prescription.status_verified", { prescriptionId: record.id, disposition: "proceed" })}
                          type="button"
                        >
                          {disposition === "proceed" ? "✓ " : ""}Continuar retiro
                        </button>
                        <button
                          className={cn("rounded-lg px-3 py-2 font-black", disposition === "hold-for-review" ? "bg-amber-100 text-amber-900" : "border border-amber-200 bg-white text-amber-800")}
                          onClick={() => send("prescription.status_verified", { prescriptionId: record.id, disposition: "hold-for-review" })}
                          type="button"
                        >
                          {disposition === "hold-for-review" ? "✓ " : ""}Detener para revisión
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <Action onClick={() => send("qf_support.requested")}>{hasHeldCurrentPrescription ? "Solicitar apoyo QF y detener la entrega" : "Solicitar apoyo QF"}</Action>
      <p className="mt-2 text-[.7rem] leading-5 text-slate-500">La solicitud de apoyo permite escalar una situación que requiere interpretación; FarmaVerse no concluye automáticamente duplicidad terapéutica.</p>
      <button className="mt-4 w-full text-sm font-black text-slate-500" onClick={() => send("computer.exited")} type="button">← Volver a farmacia</button>
    </Panel>
  );
}

function Storage({ scenario, send }: { scenario: ScenarioDefinition; send: Send }) {
  return <Panel eyebrow="ALMACENAMIENTO" title="Selecciona una gaveta"><div className="space-y-2">{scenario.drawers.map((drawer) => <div className="rounded-xl border border-slate-200 p-3" key={drawer.id}><p className="font-black">{drawer.displayedLabel}</p><p className="text-xs text-slate-500">{storageConditionLabel(drawer.physicalCondition)} · {storageStockLabel(drawer.stockState)}</p><div className="mt-2 flex flex-wrap gap-2"><button className="min-h-10 rounded-lg px-3 text-xs font-black text-violet-700 hover:bg-violet-50" onClick={() => send("drawer.label_inspected", { drawerId: drawer.id })} type="button">Leer rótulo</button><button className="min-h-10 rounded-lg px-3 text-xs font-black text-violet-700 hover:bg-violet-50" onClick={() => { send("drawer.opened", { drawerId: drawer.id }); send("drawer.contents_inspected", { drawerId: drawer.id }); }} type="button">Abrir gaveta</button></div></div>)}</div><Back send={send} /></Panel>;
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
  const suggestedQuantity = matchingLine
    ? scenario.suggestedPreparationQuantityByLineId?.[matchingLine.id]
    : undefined;
  const [lineId, setLineId] = useState(matchingLine?.id ?? "");
  const [quantity, setQuantity] = useState(suggestedQuantity ?? matchingLine?.quantity ?? 1);

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
        <div><dt className="font-bold text-slate-500">Unidad</dt><dd className="font-black">{medication.dispensingUnit ?? "No informada"}</dd></div>
        {medication.sourceCode ? <div><dt className="font-bold text-slate-500">Código</dt><dd className="font-black">{medication.sourceCode}</dd></div> : null}
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
  const participantIsTens2 = session.actorControllers["tens-2"] === "participant";

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
      {participantIsTens2 ? (
        <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3">
          <p className="text-xs font-bold leading-5 text-slate-600">Como TENS 2 debes corregir la preparación manualmente: retira lo incorrecto y vuelve a seleccionar el producto o cantidad desde almacenamiento.</p>
          <Action onClick={() => send("storage.focused")}>Ir al almacenamiento para corregir</Action>
        </div>
      ) : session.tray.status === "correction-requested" ? (
        <Action onClick={() => send("tray.corrected", {}, preparationActor?.id)}>Aplicar corrección de TENS 2 simulado</Action>
      ) : (
        <Action onClick={() => send("correction.requested")}>Solicitar corrección a TENS 2</Action>
      )}
      <Back send={send} />
    </Panel>
  );
}

function SafetyStop({ send, session }: { send: Send; session: SimulationSession }) {
  const kinds = new Set(session.discrepancies.map((item) => item.kind));
  const recovery = kinds.has("final-patient")
    ? { label: "Volver al paciente y reidentificar", type: "patient.focused" as const }
    : kinds.has("prescription") || kinds.has("prescription-status")
      ? { label: "Volver al computador", type: "computer.focused" as const }
      : { label: "Volver a revisar la bandeja", type: "tray.inspected" as const };

  return <Panel eyebrow="DETENTE · NO ENTREGAR" title="Barrera de seguridad activada"><div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3">{session.discrepancies.map((item) => <p className="text-sm leading-6" key={item.id}>{discrepancyMessage(item)}</p>)}</div><Action onClick={() => send(recovery.type)}>{recovery.label}</Action></Panel>;
}

function AssessmentBlocked({ send }: { send: Send }) {
  return <Panel eyebrow="EVALUACIÓN" title="Continúa revisando el caso"><p className="text-sm leading-6 text-slate-600">La simulación registró tu intento. No se mostrarán pistas sobre la causa durante la evaluación.</p><Action onClick={() => send("scene.returned")}>Continuar revisando</Action></Panel>;
}

function Results({ levelNumber, onReinforcement, onRetry, persistence, session }: { levelNumber: number; onReinforcement: () => void; onRetry: () => void; persistence: PersistenceState; session: SimulationSession }) {
  const failed = Object.entries(session.criteria).filter(([, status]) => status !== "met" && status !== "intercepted");
  const instructionReminder = session.missingInstructionSections.length
    ? `NO OLVIDAR: faltó comunicar ${session.missingInstructionSections.map((section) => instructionSectionLabels[section].toLowerCase()).join(", ")}.`
    : "NO OLVIDAR: entrega todas las indicaciones correspondientes antes de finalizar.";
  const reminder = failed.some(([id]) => id.includes("identity"))
    ? "NO OLVIDAR: confirma la identidad en el sistema y nuevamente antes de entregar."
    : failed.some(([id]) => id.includes("prescription"))
      ? "NO OLVIDAR: abrir una receta no equivale a decidir correctamente qué hacer con su estado."
      : failed.some(([id]) => id.includes("compare"))
        ? "NO OLVIDAR: compara activamente cada producto de la bandeja con su prescripción."
        : failed.some(([id]) => id.includes("instructions"))
          ? instructionReminder
          : null;
  return (
    <Panel eyebrow={levelNumber === 6 ? "RESULTADO · CONTROL MÚLTIPLE" : levelNumber === 7 ? "RESULTADO · CIERRE EXPERTO" : "RESULTADO"} title={session.deliveryStatus === "safely-stopped" ? "Caso detenido de forma segura" : "Entrega completada"}>
      {levelNumber >= 6 ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">{levelNumber === 7 ? "La auditoría final ya puede mostrar el desempeño completo del caso experto." : "La evaluación cruzó identidad, prescripciones, presentación y cantidad antes del cierre."}</p> : null}
      {session.deliveryStatus === "safely-stopped" ? <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">La dispensación se detuvo antes de la entrega y se solicitó revisión al QF.</p> : null}
      <div className="space-y-2">{Object.entries(session.criteria).map(([id, status], index) => <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5" key={id}><span className="text-xs font-semibold leading-5">{dispensingCriteria.find((criterion) => criterion.id === id)?.title ?? `Criterio ${index + 1}`}</span><span className={cn("shrink-0 rounded-md px-2 py-1 text-xs font-black", status === "met" ? "bg-emerald-100 text-emerald-700" : status === "intercepted" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700")}>{status === "met" ? "Cumplido" : status === "intercepted" ? "Interceptado" : "Reforzar"}</span></div>)}</div>
      {reminder ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-900">{reminder}</div> : null}
      {failed.length ? <Link className="mt-3 block rounded-xl border border-violet-200 px-4 py-3 text-sm font-black text-violet-700 hover:bg-violet-50" href="/capsulas">Revisar cápsulas educativas asignadas</Link> : null}
      {failed.length ? <Action onClick={onReinforcement}>Iniciar refuerzo con un escenario diferente</Action> : null}
      <div className={cn("mt-4 rounded-xl border p-3 text-sm font-bold", persistence.status === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : persistence.status === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-violet-200 bg-violet-50 text-violet-800")} role="status"><p>{persistence.message || "Preparando el guardado del progreso…"}</p>{persistence.status === "error" ? <button className="mt-3 min-h-10 rounded-lg bg-rose-700 px-4 text-xs font-black text-white" onClick={onRetry} type="button">Reintentar guardado</button> : null}</div>
    </Panel>
  );
}

function LearnerSidebar({ levelNumber, mode, scenario, session }: { levelNumber: number; mode: TrainingMode; scenario: ScenarioDefinition; session: SimulationSession }) {
  if (scenario.mode === "assessment" && levelNumber === 3) return (
    <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-[0_12px_35px_rgb(19_33_60/.06)]">
      <p className="text-xs font-black uppercase tracking-wider text-amber-700">Turno con presión</p>
      <h2 className="mt-2 font-black text-slate-900">Retoma, verifica y continúa</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Recibirás {mode.interruptionStageIds.length} interrupciones operativas. Ninguna cambia los datos del caso ni revela si una decisión fue correcta.</p>
      <div className="mt-4 rounded-xl bg-amber-50 p-3">
        <p className="text-xs font-bold text-amber-900">Regla del ejercicio</p>
        <p className="mt-1 text-xs leading-5 text-amber-900">Después de cada pausa, recupera el contexto y vuelve a comprobar antes de avanzar.</p>
      </div>
    </div>
  );

  if (levelNumber === 6) return (
    <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-[0_12px_35px_rgb(19_33_60/.06)]">
      <p className="text-xs font-black uppercase tracking-wider text-amber-700">Control de discrepancias múltiples</p>
      <h2 className="mt-2 font-black text-slate-900">Cruza todas las variables</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Más de una variable puede diferir. El caso no confirma cuántos hallazgos existen antes de que realices la comparación.</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {["Producto", "Presentación", "Cantidad"].map((label) => <div className="rounded-xl bg-amber-50 px-2 py-3" key={label}><span className="mx-auto block size-2 rounded-full bg-amber-500" /><p className="mt-2 text-[.68rem] font-bold text-amber-950">{label}</p></div>)}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">Si detectas una diferencia, activa la barrera y solicita la corrección antes del cierre.</p>
    </div>
  );

  if (scenario.mode === "assessment" && levelNumber === 7) return (
    <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_12px_35px_rgb(19_33_60/.12)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-300">Evaluación final</p>
        <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[.62rem] font-bold text-white/80">{scenario.visibleClinicalRecordIds.length} registros</span>
      </div>
      <h2 className="mt-3 font-black">Cierre experto sin asistencia</h2>
      <p className="mt-2 text-sm leading-6 text-white/70">No se muestran secuencias, pistas ni causas de bloqueo. La retroalimentación completa aparece únicamente al finalizar.</p>
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-xs font-bold text-white">Decisiones auditadas</p>
        <p className="mt-1 text-xs leading-5 text-white/60">Identidad, estado de prescripciones, preparación, reidentificación e indicaciones.</p>
      </div>
    </div>
  );

  if (scenario.mode === "assessment") return (
    <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_12px_35px_rgb(19_33_60/.06)]">
      <p className="text-xs font-black uppercase tracking-wider text-violet-600">Consolidación autónoma</p>
      <h2 className="mt-2 font-black text-slate-900">Resuelve el caso completo</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">No se muestran secuencias, pistas, causas de error ni presión de tiempo durante el recorrido.</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {["Identifica", "Compara", "Decide"].map((label, index) => <div className="rounded-xl bg-violet-50 px-2 py-3" key={label}><span className="mx-auto grid size-7 place-items-center rounded-full bg-white text-xs font-black text-violet-700">{index + 1}</span><p className="mt-2 text-[.68rem] font-bold text-slate-700">{label}</p></div>)}
      </div>
    </div>
  );

  const steps = getMissionSteps(scenario, session);
  if (scenario.mode === "practice") return <div className="rounded-2xl border border-violet-100 bg-white p-5"><p className="text-xs font-black uppercase tracking-wider text-violet-600">Objetivo</p><h2 className="mt-2 font-black text-slate-900">{steps[0]?.label}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{steps[0]?.description}</p></div>;

  const recentActions = getRecentLearnerActions(session.eventLog, 3);
  return <div className="grid gap-4"><section className="rounded-2xl border border-violet-100 bg-white p-5"><p className="text-xs font-black uppercase tracking-wider text-violet-600">Tu misión</p><ol className="mt-4 space-y-3">{steps.map((step, index) => <li className="grid grid-cols-[2rem_1fr] gap-3" key={step.id}><span className={cn("grid size-8 place-items-center rounded-full border text-xs font-black", step.status === "completed" && "border-emerald-600 bg-emerald-600 text-white", step.status === "current" && "border-violet-600 bg-violet-50 text-violet-700", step.status === "attention" && "border-amber-500 bg-amber-50 text-amber-700", step.status === "pending" && "border-slate-200 bg-slate-50 text-slate-400")}>{step.status === "completed" ? "✓" : step.status === "attention" ? "!" : index + 1}</span><div><p className="text-sm font-black">{step.label}</p>{step.status !== "pending" ? <p className="mt-0.5 text-xs leading-5 text-slate-500">{step.description}</p> : null}</div></li>)}</ol></section><section className="rounded-2xl border border-violet-100 bg-white p-5"><h2 className="font-black text-slate-900">Últimas acciones</h2>{recentActions.length ? <ol className="mt-3 space-y-2">{recentActions.map((action) => <li className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold" key={action.id}>{action.label}</li>)}</ol> : <p className="mt-2 text-sm text-slate-500">Aún no hay acciones registradas.</p>}</section></div>;
}

function TechnicalAudit({ session }: { session: SimulationSession }) {
  const recent = session.eventLog.slice(-12).reverse();
  return <details className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-slate-600"><summary className="cursor-pointer text-xs font-black uppercase tracking-wider">Auditoría técnica</summary><p className="mt-2 text-xs">Desviaciones de almacenamiento: {session.storageDeviations.length}</p><p className="mt-1 text-xs">Reidentificación final: {session.finalReidentifiedPatientId ?? "pendiente"}</p><p className="mt-1 text-xs">Secciones de indicaciones pendientes: {session.missingInstructionSections.length ? session.missingInstructionSections.join(", ") : "ninguna"}</p>{session.storageDeviations.map((item) => <p className="mt-1 text-xs" key={item.id}>{item.drawerId} · {item.kind}</p>)}{recent.length ? <ol className="mt-3 space-y-2">{recent.map((event) => <li className="rounded-lg bg-slate-50 px-3 py-2 text-xs" key={event.id}><p className="font-bold">{event.sequence}. {describeSimulationEvent(event)}</p><code className="text-[.65rem] text-slate-400">{event.type} · {event.actorId}</code></li>)}</ol> : null}</details>;
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) { return <div><p className="text-[.7rem] font-bold uppercase tracking-[.14em] text-violet-600">{eyebrow}</p><h2 className="mt-1 text-xl font-bold">{title}</h2><div className="mt-4">{children}</div></div>; }
function NextStepPrompt({ actionLabel, description, onAction, title }: { actionLabel: string; description: string; onAction: () => void; title: string }) { return <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3"><p className="text-sm font-bold text-slate-900">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{description}</p><button className="mt-3 min-h-10 rounded-lg bg-[var(--brand)] px-3 text-xs font-semibold text-white hover:bg-[var(--brand-strong)]" onClick={onAction} type="button">{actionLabel} →</button></div>; }
function Action({ children, onClick }: { children: React.ReactNode; onClick: () => void }) { return <button className="mt-3 min-h-11 w-full rounded-xl border border-violet-200 px-4 text-left text-sm font-black text-violet-700 hover:bg-violet-50" onClick={onClick} type="button">{children}</button>; }
function Back({ send }: { send: Send }) { return <button className="mt-4 w-full py-2 text-sm font-black text-slate-500" onClick={() => send("scene.returned")} type="button">← Volver a la escena</button>; }
