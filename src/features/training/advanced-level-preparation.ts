import type { PrescriptionLine, ScenarioDefinition } from "@/features/simulation-engine";

export function preparedItemForAdvancedLevel(
  scenario: ScenarioDefinition,
  line: PrescriptionLine,
  index: number,
  levelNumber: number,
) {
  if (levelNumber < 6 || index > 0) {
    return { medicationPresentationId: line.medicationPresentationId, quantity: line.quantity };
  }

  const expected = scenario.arsenal.find((item) => item.id === line.medicationPresentationId);
  const alternate = scenario.arsenal.find((item) =>
    item.id !== line.medicationPresentationId
    && item.medicationId === expected?.medicationId
    && item.strength !== expected?.strength,
  ) ?? scenario.arsenal.find((item) => item.id !== line.medicationPresentationId);

  return {
    medicationPresentationId: alternate?.id ?? line.medicationPresentationId,
    quantity: line.quantity + 1,
  };
}
