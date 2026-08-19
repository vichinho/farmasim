import { describe, expect, it } from "vitest";

import { presentSimulationAlert } from "./simulation-alert-presentation";

describe("simulation alert presentation", () => {
  it("shows a human label for a quantity discrepancy", () => {
    expect(presentSimulationAlert({
      category: "medication-discrepancy",
      kind: "quantity",
      metadata: null,
      originStage: "preparation-check",
      severity: "high",
    })).toEqual({
      title: "Cantidad incorrecta",
      originLabel: "Verificación de preparación",
      categoryLabel: "Discrepancia de medicamento",
      severityLabel: "Alta",
    });
  });

  it("uses the criterion metadata instead of exposing kind other", () => {
    expect(presentSimulationAlert({
      category: "process-deviation",
      kind: "other",
      metadata: { criterionId: "criterion-7-provide-corresponding-instructions" },
      originStage: "process-evaluation",
      severity: "low",
    }).title).toBe("Indicaciones al paciente incompletas");
  });

  it("describes an intercepted preparation generically when the exact discrepancy is unknown", () => {
    expect(presentSimulationAlert({
      category: "process-deviation",
      kind: "other",
      metadata: { criterionId: "criterion-5-compare-prepared-items" },
      originStage: "preparation-check",
      severity: "moderate",
    }).title).toBe("Desviación de preparación interceptada");
  });
});
