import { describe, expect, it } from "vitest";

import { duaHintAvailabilityLabel, duaHintForCase } from "@/features/training/dua-guidance";

describe("Dua guidance", () => {
  it("provides one stable hint for every training case", () => {
    const caseIds = [
      "case-001-ambulatory-dispensing",
      "case-002-concentration-reinforcement",
      "case-003-concentration-reinforcement",
      "case-004-concentration-reinforcement",
      "case-005-storage-review",
      "case-006-multiple-errors",
      "case-007-expert-mode",
    ];

    expect(new Set(caseIds.map(duaHintForCase))).toHaveLength(caseIds.length);
    expect(caseIds.map(duaHintForCase).every((hint) => hint.length > 40)).toBe(true);
  });

  it("reports whether the single hint was consumed", () => {
    expect(duaHintAvailabilityLabel(false)).toBe("1 pista disponible");
    expect(duaHintAvailabilityLabel(true)).toBe("Pista utilizada");
  });
});
