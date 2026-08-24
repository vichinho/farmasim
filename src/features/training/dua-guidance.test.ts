import { describe, expect, it } from "vitest";

import { DUA_HINT_LIMIT, duaHintAvailabilityLabel, duaHintsForCase } from "@/features/training/dua-guidance";

describe("Dua guidance", () => {
  it("provides three progressive hints for every training case", () => {
    const caseIds = [
      "case-001-ambulatory-dispensing",
      "case-002-concentration-reinforcement",
      "case-003-concentration-reinforcement",
      "case-004-concentration-reinforcement",
      "case-005-storage-review",
      "case-006-multiple-errors",
      "case-007-expert-mode",
    ];

    const hints = caseIds.map(duaHintsForCase);
    expect(hints.every((caseHintSet) => caseHintSet.length === DUA_HINT_LIMIT)).toBe(true);
    expect(hints.flat().every((hint) => hint.length > 40)).toBe(true);
    expect(new Set(hints.flat())).toHaveLength(caseIds.length * DUA_HINT_LIMIT);
  });

  it("reports the remaining hint allowance", () => {
    expect(duaHintAvailabilityLabel(0)).toBe("3 pistas disponibles");
    expect(duaHintAvailabilityLabel(1)).toBe("2 pistas disponibles");
    expect(duaHintAvailabilityLabel(2)).toBe("1 pista disponible");
    expect(duaHintAvailabilityLabel(3)).toBe("3 pistas utilizadas");
  });
});
