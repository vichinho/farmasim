"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trainingCompetencies } from "@/data/training";
import { VisualPharmacy } from "@/features/training/visual-pharmacy";
import { cn } from "@/lib/utils";
import {
  PROFESSIONAL_REVIEW_MARKER,
  type DecisionOption,
  type TrainingCase,
  type TrainingEffect,
  type TrainingStage,
} from "@/types/training-simulation";

type SessionState = {
  activatedBarrierIds: string[];
  correctedErrorIds: string[];
  currentStageId: string;
  detectedErrorIds: string[];
  recordedErrorIds: string[];
  selectedItemIds: string[];
  visitedStageIds: string[];
};

type FeedbackState = {
  message: string;
  nextStageId: string;
};

type TrainingSessionProps = {
  trainingCase: TrainingCase;
};

function addUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}

function createInitialState(trainingCase: TrainingCase): SessionState {
  return {
    activatedBarrierIds: [],
    correctedErrorIds: [],
    currentStageId: trainingCase.initialStageId,
    detectedErrorIds: [],
    recordedErrorIds: [],
    selectedItemIds: [],
    visitedStageIds: [trainingCase.initialStageId],
  };
}

function applyEffects(state: SessionState, effects: TrainingEffect[] = []) {
  return effects.reduce<SessionState>((nextState, effect) => {
    if (effect.type === "record-error") {
      return {
        ...nextState,
        recordedErrorIds: addUnique(nextState.recordedErrorIds, effect.errorId),
      };
    }

    if (effect.type === "detect-error") {
      if (!nextState.recordedErrorIds.includes(effect.errorId)) return nextState;
      return {
        ...nextState,
        detectedErrorIds: addUnique(nextState.detectedErrorIds, effect.errorId),
      };
    }

    if (effect.type === "correct-error") {
      if (!nextState.recordedErrorIds.includes(effect.errorId)) return nextState;
      return {
        ...nextState,
        correctedErrorIds: addUnique(nextState.correctedErrorIds, effect.errorId),
      };
    }

    if (effect.type === "activate-barrier") {
      return {
        ...nextState,
        activatedBarrierIds: addUnique(nextState.activatedBarrierIds, effect.barrierId),
      };
    }

    return {
      ...nextState,
      selectedItemIds: addUnique(nextState.selectedItemIds, effect.itemId),
    };
  }, state);
}

function moveToStage(state: SessionState, stageId: string) {
  return {
    ...state,
    currentStageId: stageId,
    visitedStageIds: addUnique(state.visitedStageIds, stageId),
  };
}

export function TrainingSession({ trainingCase }: TrainingSessionProps) {
  const [session, setSession] = useState(() => createInitialState(trainingCase));
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const currentStage =
    trainingCase.stages.find((stage) => stage.id === session.currentStageId) ??
    trainingCase.stages[0];
  const currentStageIndex = trainingCase.stages.findIndex(
    (stage) => stage.id === currentStage.id,
  );
  const progress = Math.round(((currentStageIndex + 1) / trainingCase.stages.length) * 100);
  const statusLabel = `Etapa ${currentStageIndex + 1} de ${trainingCase.stages.length}`;

  const outcome = useMemo(() => {
    const wrongConcentrationRecorded = session.recordedErrorIds.includes("wrong-concentration");
    const wrongConcentrationCorrected = session.correctedErrorIds.includes("wrong-concentration");

    return {
      barrierEffective:
        wrongConcentrationCorrected && session.activatedBarrierIds.length > 0,
      errorReachedPatient: wrongConcentrationRecorded && !wrongConcentrationCorrected,
    };
  }, [session]);

  function advance(stageId: string) {
    setSession((current) => moveToStage(current, stageId));
  }

  function chooseOption(option: DecisionOption) {
    setSession((current) => applyEffects(current, option.effects));

    if (option.feedbackTiming === "immediate" && option.feedback) {
      setFeedback({ message: option.feedback, nextStageId: option.nextStageId });
      return;
    }

    advance(option.nextStageId);
  }

  function continueAfterFeedback() {
    if (!feedback) return;
    advance(feedback.nextStageId);
    setFeedback(null);
  }

  function restart() {
    setSession(createInitialState(trainingCase));
    setFeedback(null);
    setIsComplete(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-semibold">Progreso del caso</span>
          <span className="font-bold text-[var(--brand-strong)]">{progress}%</span>
        </div>
        <div
          aria-label={`Progreso: ${progress}%`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progress}
          className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-[var(--brand)] transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <VisualPharmacy
        activeArea={currentStage.area}
        context={trainingCase.context}
        panel={
          <StagePanel
            feedback={feedback}
            isComplete={isComplete}
            onChooseOption={chooseOption}
            onComplete={() => setIsComplete(true)}
            onContinue={advance}
            onContinueAfterFeedback={continueAfterFeedback}
            onRestart={restart}
            outcome={outcome}
            session={session}
            stage={currentStage}
            trainingCase={trainingCase}
          />
        }
        professionalReviewMarker={trainingCase.professionalReviewMarker}
        statusLabel={statusLabel}
      />
    </div>
  );
}

type StagePanelProps = {
  feedback: FeedbackState | null;
  isComplete: boolean;
  onChooseOption: (option: DecisionOption) => void;
  onComplete: () => void;
  onContinue: (stageId: string) => void;
  onContinueAfterFeedback: () => void;
  onRestart: () => void;
  outcome: { barrierEffective: boolean; errorReachedPatient: boolean };
  session: SessionState;
  stage: TrainingStage;
  trainingCase: TrainingCase;
};

function StagePanel({
  feedback,
  isComplete,
  onChooseOption,
  onComplete,
  onContinue,
  onContinueAfterFeedback,
  onRestart,
  outcome,
  session,
  stage,
  trainingCase,
}: StagePanelProps) {
  if (isComplete) {
    return <CompletionPanel onRestart={onRestart} />;
  }

  if (feedback) {
    return (
      <div aria-live="polite" className="flex h-full flex-col">
        <Badge className="self-start" tone="brand">
          Retroalimentación
        </Badge>
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <span aria-hidden="true" className="text-3xl">
            ✓
          </span>
          <p className="mt-3 text-base font-semibold leading-7 text-emerald-950">
            {feedback.message}
          </p>
        </div>
        <Button className="mt-6" fullWidth onClick={onContinueAfterFeedback} size="lg">
          Continuar
        </Button>
      </div>
    );
  }

  if (stage.type === "result") {
    return (
      <ResultPanel
        onContinue={() => {
          if (stage.interaction.type === "continue") onContinue(stage.interaction.nextStageId);
        }}
        outcome={outcome}
        session={session}
        trainingCase={trainingCase}
      />
    );
  }

  const content = stage.content.replace(PROFESSIONAL_REVIEW_MARKER, "").trim();
  const isLearningCard = stage.type === "learning-card";
  const isReinforcement = stage.type === "reinforcement";
  const continueStageId =
    stage.interaction.type === "continue" ? stage.interaction.nextStageId : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={isLearningCard ? "warning" : "brand"}>{stageLabel(stage)}</Badge>
        {stage.competencyIds.length > 0 ? (
          <Badge tone="neutral">{stage.competencyIds.length} competencia(s)</Badge>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-4 rounded-2xl border p-4",
          isLearningCard
            ? "border-amber-300 bg-amber-50"
            : isReinforcement
              ? "border-sky-200 bg-sky-50"
              : "border-[var(--border)] bg-white",
        )}
      >
        <h3 className="text-2xl font-black tracking-tight">{stage.title}</h3>
        <p className="mt-3 text-base leading-7 text-[var(--muted)]">{content}</p>
      </div>

      {stage.interaction.type === "decision" || stage.interaction.type === "item-selection" ? (
        <div className="mt-5">
          <p className="text-sm font-bold leading-6">{stage.interaction.prompt}</p>
          <div className="mt-3 grid gap-3">
            {stage.interaction.options.map((option, index) => {
              const item =
                stage.interaction.type === "item-selection"
                  ? stage.interaction.items[index]
                  : undefined;

              return (
                <button
                  className="min-h-14 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-left text-sm font-semibold leading-5 transition hover:border-emerald-400 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
                  key={option.id}
                  onClick={() => onChooseOption(option)}
                  type="button"
                >
                  <span className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-600"
                    >
                      {index + 1}
                    </span>
                    <span>
                      {option.label}
                      {item?.description ? (
                        <span className="mt-1 block font-normal text-[var(--muted)]">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {stage.interaction.type === "continue" && continueStageId ? (
        <Button
          className="mt-6"
          fullWidth
          onClick={() => onContinue(continueStageId)}
          size="lg"
        >
          {stage.interaction.label}
        </Button>
      ) : null}

      {stage.interaction.type === "complete" ? (
        <Button className="mt-6" fullWidth onClick={onComplete} size="lg">
          {stage.interaction.label}
        </Button>
      ) : null}

      <p className="mt-auto pt-6 text-xs leading-5 text-[var(--muted)]">
        {trainingCase.professionalReviewMarker ?? PROFESSIONAL_REVIEW_MARKER} Actividad ficticia;
        no reemplaza protocolos ni supervisión profesional.
      </p>
    </div>
  );
}

function ResultPanel({
  onContinue,
  outcome,
  session,
  trainingCase,
}: {
  onContinue: () => void;
  outcome: { barrierEffective: boolean; errorReachedPatient: boolean };
  session: SessionState;
  trainingCase: TrainingCase;
}) {
  return (
    <div className="flex h-full flex-col" aria-live="polite">
      <Badge className="self-start" tone="brand">
        Caso completado
      </Badge>
      <h3 className="mt-4 text-2xl font-black">Resultado por etapas</h3>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ResultMetric label="Errores registrados" value={session.recordedErrorIds.length} />
        <ResultMetric label="Errores corregidos" value={session.correctedErrorIds.length} />
        <ResultMetric label="Barreras usadas" value={session.activatedBarrierIds.length} />
        <ResultMetric label="Impacto virtual" value={outcome.errorReachedPatient ? "Sí" : "No"} />
      </div>

      <div className="mt-5 space-y-2">
        {trainingCase.errors.map((error) => {
          const wasRecorded = session.recordedErrorIds.includes(error.id);
          const wasCorrected = session.correctedErrorIds.includes(error.id);
          const status = wasCorrected ? "Corregido" : wasRecorded ? "Registrado" : "Evitado";

          return (
            <div
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-white p-3"
              key={error.id}
            >
              <span className="text-sm font-semibold">
                {trainingCompetencies.find((item) => item.id === error.competencyId)?.name ??
                  error.competencyId}
              </span>
              <Badge tone={wasRecorded && !wasCorrected ? "warning" : "brand"}>{status}</Badge>
            </div>
          );
        })}
      </div>

      {outcome.barrierEffective ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
          La barrera de seguridad permitió recuperar la discrepancia antes del cierre.
        </p>
      ) : null}

      <Button className="mt-6" fullWidth onClick={onContinue} size="lg">
        Ver “NO OLVIDAR”
      </Button>
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-2xl font-black text-[var(--brand-strong)]">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-4 text-[var(--muted)]">{label}</p>
    </div>
  );
}

function CompletionPanel({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center" aria-live="polite">
      <span
        aria-hidden="true"
        className="grid size-16 place-items-center rounded-full bg-emerald-100 text-3xl"
      >
        ✓
      </span>
      <h3 className="mt-4 text-2xl font-black">Entrenamiento finalizado</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        Completaste el recorrido demostrativo del Caso 001.
      </p>
      <div className="mt-6 grid w-full gap-3">
        <Button fullWidth onClick={onRestart} size="lg">
          Repetir caso
        </Button>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-5 text-base font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
          href="/simulaciones"
        >
          Volver a niveles
        </Link>
      </div>
    </div>
  );
}

function stageLabel(stage: TrainingStage) {
  const labels: Partial<Record<TrainingStage["type"], string>> = {
    "area-transition": "Cambio de área",
    "clinical-system": "Sistema ficticio",
    context: "Contexto",
    dispatch: "Cierre",
    identification: "Decisión",
    "learning-card": "Tarjeta educativa",
    "patient-dialogue": "Paciente virtual",
    preparation: "Preparación",
    prescription: "Solicitud ficticia",
    reinforcement: "Próximo entrenamiento",
    "safety-barrier": "Barrera de seguridad",
    "storage-selection": "Selección visual",
    "final-verification": "Verificación",
  };

  return labels[stage.type] ?? "Etapa del caso";
}
