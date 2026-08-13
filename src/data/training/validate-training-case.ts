import type {
  CompetencyId,
  TrainingCase,
  TrainingCompetency,
} from "@/types/training-simulation";

function findDuplicates(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

export function validateTrainingCase(
  trainingCase: TrainingCase,
  competencies: TrainingCompetency[],
) {
  const issues: string[] = [];
  const competencyIds = new Set<CompetencyId>(competencies.map((competency) => competency.id));
  const stageIds = new Set(trainingCase.stages.map((stage) => stage.id));
  const errorIds = new Set(trainingCase.errors.map((error) => error.id));
  const barrierIds = new Set(trainingCase.barriers.map((barrier) => barrier.id));

  for (const duplicate of findDuplicates(trainingCase.stages.map((stage) => stage.id))) {
    issues.push(`Duplicate stage id: ${duplicate}`);
  }

  for (const duplicate of findDuplicates(trainingCase.errors.map((error) => error.id))) {
    issues.push(`Duplicate error id: ${duplicate}`);
  }

  for (const duplicate of findDuplicates(trainingCase.barriers.map((barrier) => barrier.id))) {
    issues.push(`Duplicate barrier id: ${duplicate}`);
  }

  if (!stageIds.has(trainingCase.initialStageId)) {
    issues.push(`Initial stage does not exist: ${trainingCase.initialStageId}`);
  }

  if (
    trainingCase.contentValidation === "pending-professional-review" &&
    !trainingCase.professionalReviewMarker
  ) {
    issues.push("Pending professional content must include the professional review marker");
  }

  for (const competencyId of trainingCase.competencies) {
    if (!competencyIds.has(competencyId)) {
      issues.push(`Unknown case competency: ${competencyId}`);
    }
  }

  for (const stage of trainingCase.stages) {
    for (const competencyId of stage.competencyIds) {
      if (!trainingCase.competencies.includes(competencyId)) {
        issues.push(`Stage ${stage.id} uses a competency outside the case: ${competencyId}`);
      }
    }

    const interaction = stage.interaction;
    if (interaction.type === "continue" && !stageIds.has(interaction.nextStageId)) {
      issues.push(`Stage ${stage.id} points to an unknown stage: ${interaction.nextStageId}`);
    }

    if (interaction.type === "decision" || interaction.type === "item-selection") {
      for (const duplicate of findDuplicates(interaction.options.map((option) => option.id))) {
        issues.push(`Stage ${stage.id} has a duplicate option id: ${duplicate}`);
      }

      for (const option of interaction.options) {
        if (!stageIds.has(option.nextStageId)) {
          issues.push(`Option ${option.id} points to an unknown stage: ${option.nextStageId}`);
        }

        for (const effect of option.effects ?? []) {
          if (
            (effect.type === "record-error" ||
              effect.type === "detect-error" ||
              effect.type === "correct-error") &&
            !errorIds.has(effect.errorId)
          ) {
            issues.push(`Option ${option.id} uses an unknown error: ${effect.errorId}`);
          }

          if (effect.type === "activate-barrier" && !barrierIds.has(effect.barrierId)) {
            issues.push(`Option ${option.id} uses an unknown barrier: ${effect.barrierId}`);
          }
        }
      }
    }
  }

  for (const error of trainingCase.errors) {
    if (!trainingCase.competencies.includes(error.competencyId)) {
      issues.push(`Error ${error.id} uses a competency outside the case: ${error.competencyId}`);
    }
  }

  for (const barrier of trainingCase.barriers) {
    if (!trainingCase.competencies.includes(barrier.competencyId)) {
      issues.push(`Barrier ${barrier.id} uses a competency outside the case: ${barrier.competencyId}`);
    }
  }

  for (const trap of trainingCase.traps) {
    const triggerStage = trainingCase.stages.find((stage) => stage.id === trap.triggerStageId);
    const triggerOptions =
      triggerStage?.interaction.type === "decision" ||
      triggerStage?.interaction.type === "item-selection"
        ? triggerStage.interaction.options
        : [];

    if (!triggerStage) {
      issues.push(`Trap ${trap.id} uses an unknown trigger stage: ${trap.triggerStageId}`);
    } else if (!triggerOptions.some((option) => option.id === trap.triggerOptionId)) {
      issues.push(`Trap ${trap.id} uses an unknown trigger option: ${trap.triggerOptionId}`);
    }

    if (!errorIds.has(trap.errorId)) {
      issues.push(`Trap ${trap.id} uses an unknown error: ${trap.errorId}`);
    }

    for (const stageId of [...trap.revealStageIds, ...trap.recoveryStageIds]) {
      if (!stageIds.has(stageId)) {
        issues.push(`Trap ${trap.id} uses an unknown stage: ${stageId}`);
      }
    }
  }

  return issues;
}

export function assertValidTrainingCase(
  trainingCase: TrainingCase,
  competencies: TrainingCompetency[],
) {
  const issues = validateTrainingCase(trainingCase, competencies);

  if (issues.length > 0) {
    throw new Error(`Invalid training case ${trainingCase.id}:\n${issues.join("\n")}`);
  }

  return trainingCase;
}
