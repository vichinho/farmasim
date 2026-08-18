import { describe, expect, it } from "vitest";

import { countCompletedTrainingLevels } from "@/data/training/levels";

describe("training level progress", () => {
  it("counts unique completed levels instead of attempts", () => {
    expect(countCompletedTrainingLevels([1, 1, 2, 3, 3, null])).toBe(3);
  });

  it("ignores invalid or legacy level numbers", () => {
    expect(countCompletedTrainingLevels([null, 0, 1, 8])).toBe(1);
  });
});
