import { case001AmbulatoryDispensing } from "@/data/training/cases/case-001-ambulatory-dispensing";
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
];

export function getTrainingCaseBySlug(slug: string) {
  return trainingCases.find((trainingCase) => trainingCase.id === slug);
}
