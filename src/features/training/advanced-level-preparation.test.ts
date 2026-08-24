import { describe, expect, it } from "vitest";

import { expectedPrescriptionLines, generateScenarioDefinition } from "@/features/simulation-engine";
import { preparedItemForAdvancedLevel } from "@/features/training/advanced-level-preparation";

describe("advanced level preparation", () => {
  const scenario = generateScenarioDefinition({
    id: "case-006-multiple-errors",
    mode: "practice",
  });
  const [firstLine, secondLine] = expectedPrescriptionLines(scenario);

  it("plants presentation and quantity differences in the first advanced item", () => {
    const prepared = preparedItemForAdvancedLevel(scenario, firstLine, 0, 6);

    expect(prepared.medicationPresentationId).not.toBe(firstLine.medicationPresentationId);
    expect(prepared.quantity).toBe(firstLine.quantity + 1);
  });

  it("keeps later items and earlier levels unchanged", () => {
    expect(preparedItemForAdvancedLevel(scenario, firstLine, 0, 5)).toEqual({
      medicationPresentationId: firstLine.medicationPresentationId,
      quantity: firstLine.quantity,
    });
    expect(preparedItemForAdvancedLevel(scenario, secondLine, 1, 7)).toEqual({
      medicationPresentationId: secondLine.medicationPresentationId,
      quantity: secondLine.quantity,
    });
  });
});
