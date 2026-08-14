import { case001AmbulatoryDispensing } from "@/data/training/cases/case-001-ambulatory-dispensing";
import { case005StorageReview } from "@/data/training/cases/case-005-storage-review";
import { case006MultipleErrors } from "@/data/training/cases/case-006-multiple-errors";
import { case007ExpertMode } from "@/data/training/cases/case-007-expert-mode";
import {
  case002ConcentrationReinforcement,
  case003ConcentrationReinforcement,
  case004ConcentrationReinforcement,
} from "@/data/training/cases/reinforcement-cases";

export const trainingCases = [
  case001AmbulatoryDispensing,
  case002ConcentrationReinforcement,
  case003ConcentrationReinforcement,
  case004ConcentrationReinforcement,
  case005StorageReview,
  case006MultipleErrors,
  case007ExpertMode,
];

export function getTrainingCaseBySlug(slug: string) {
  return trainingCases.find((trainingCase) => trainingCase.id === slug);
}
