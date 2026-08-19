import { describe, expect, it } from "vitest";

import { competencyTrainingStatus, summarizeCompetencies } from "./competency-analytics";

const successfulIdentity = [
  { criterionId: "criterion-1-request-identity-document", status: "met" },
  { criterionId: "criterion-2-system-identity-match", status: "met" },
] as const;

describe("supervisor competency analytics", () => {
  it("keeps a competency in progress after a single satisfactory evidence", () => {
    expect(competencyTrainingStatus([
      { completedAt: "2026-08-19T10:00:00Z", criterionResults: [...successfulIdentity] },
    ], "patient-identification")).toBe("in-progress");
  });

  it("marks a competency dominated only after two consecutive satisfactory evidences", () => {
    expect(competencyTrainingStatus([
      { completedAt: "2026-08-19T10:00:00Z", criterionResults: [...successfulIdentity] },
      { completedAt: "2026-08-18T10:00:00Z", criterionResults: [...successfulIdentity] },
    ], "patient-identification")).toBe("dominated");
  });

  it("prioritizes reinforcement when the latest evidence asks for it", () => {
    expect(competencyTrainingStatus([
      {
        completedAt: "2026-08-19T10:00:00Z",
        criterionResults: [
          { criterionId: "criterion-1-request-identity-document", status: "met" },
          { criterionId: "criterion-2-system-identity-match", status: "reinforcement" },
        ],
      },
      { completedAt: "2026-08-18T10:00:00Z", criterionResults: [...successfulIdentity] },
    ], "patient-identification")).toBe("reinforcement");
  });

  it("returns all five competencies without punitive ranking", () => {
    const summary = summarizeCompetencies([]);
    expect(summary).toHaveLength(5);
    expect(summary.every((item) => item.status === "not-started")).toBe(true);
  });
});
