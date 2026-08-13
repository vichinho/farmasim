import { case001AmbulatoryDispensing } from "@/data/training/cases/case-001-ambulatory-dispensing";

export const trainingCases = [case001AmbulatoryDispensing];

export function getTrainingCaseBySlug(slug: string) {
  return trainingCases.find((trainingCase) => trainingCase.id === slug);
}
