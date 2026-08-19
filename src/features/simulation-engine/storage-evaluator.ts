import type {
  MedicationPresentation,
  ScenarioDefinition,
  StorageDeviation,
} from "./types";

function presentationById(scenario: ScenarioDefinition, id: string) {
  return scenario.arsenal.find((presentation) => presentation.id === id);
}

function normalized(value: string) {
  return value.trim().toLocaleLowerCase("es-CL").replace(/\s+/g, " ");
}

function labelContainsPresentation(label: string, presentation: MedicationPresentation) {
  const candidate = normalized(label);
  return (
    candidate.includes(normalized(presentation.medicationName)) &&
    candidate.includes(normalized(presentation.strength)) &&
    candidate.includes(normalized(presentation.pharmaceuticalForm).replace(/s$/, ""))
  );
}

export function evaluateStorage(scenario: ScenarioDefinition): StorageDeviation[] {
  const deviations: StorageDeviation[] = [];

  for (const drawer of scenario.drawers) {
    const expected = presentationById(scenario, drawer.expectedMedicationPresentationId);
    if (!expected) continue;

    if (drawer.stockState === "out-of-stock" || drawer.contents.length === 0) {
      deviations.push({
        id: `storage:${drawer.id}:out-of-stock`,
        drawerId: drawer.id,
        kind: "out-of-stock",
        expected: "stock available",
        actual: "out-of-stock",
      });
    }

    if (drawer.physicalCondition === "double-label") {
      deviations.push({
        id: `storage:${drawer.id}:double-label`,
        drawerId: drawer.id,
        kind: "double-label",
        expected: drawer.expectedLabel,
        actual: drawer.displayedLabel,
      });
    }

    if (drawer.physicalCondition === "damaged-label") {
      deviations.push({
        id: `storage:${drawer.id}:deterioration`,
        drawerId: drawer.id,
        kind: "deterioration",
        expected: "label in readable condition",
        actual: drawer.displayedLabel,
      });
    }

    if (normalized(drawer.displayedLabel) !== normalized(drawer.expectedLabel)) {
      deviations.push({
        id: `storage:${drawer.id}:label`,
        drawerId: drawer.id,
        kind: labelContainsPresentation(drawer.displayedLabel, expected)
          ? "incorrect-label"
          : "incomplete-label",
        expected: drawer.expectedLabel,
        actual: drawer.displayedLabel,
      });
    }

    for (const presentationId of drawer.contents) {
      const actual = presentationById(scenario, presentationId);
      if (!actual || actual.id === expected.id) continue;

      if (actual.medicationId !== expected.medicationId) {
        deviations.push({
          id: `storage:${drawer.id}:product:${actual.id}`,
          drawerId: drawer.id,
          kind: "mixed-product",
          expected: expected.medicationName,
          actual: actual.medicationName,
          medicationPresentationId: actual.id,
        });
        continue;
      }

      if (actual.strength !== expected.strength) {
        deviations.push({
          id: `storage:${drawer.id}:strength:${actual.id}`,
          drawerId: drawer.id,
          kind: "mixed-strength",
          expected: expected.strength,
          actual: actual.strength,
          medicationPresentationId: actual.id,
        });
      }

      if (actual.pharmaceuticalForm !== expected.pharmaceuticalForm) {
        deviations.push({
          id: `storage:${drawer.id}:form:${actual.id}`,
          drawerId: drawer.id,
          kind: "mixed-form",
          expected: expected.pharmaceuticalForm,
          actual: actual.pharmaceuticalForm,
          medicationPresentationId: actual.id,
        });
      }
    }
  }

  return deviations;
}
