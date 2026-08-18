import { buildMinimumScenarioReport } from "@/features/simulation-engine/fixtures/report";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Simulation engine regression failed: ${message}`);
}

export type SimulationEngineRegressionResult = {
  passed: true;
  checks: string[];
};

export function runMinimumScenarioRegressionChecks(): SimulationEngineRegressionResult {
  const report = buildMinimumScenarioReport();
  const byId = new Map(report.map((item) => [item.id, item]));
  const checks: string[] = [];

  const a = byId.get("A");
  assert(a?.validation.valid, "A must be a valid session");
  assert(a.safety?.allowed === true, "A must allow delivery");
  assert(a.discrepancies.length === 0, "A must contain zero delivery discrepancies");
  assert(a.criteria.filter((item) => item.status === "missed").length === 0, "A must have zero missed criteria");
  checks.push("A: correct attention remains safe and discrepancy-free");

  const b = byId.get("B");
  assert(b?.validation.valid, "B must be a valid session");
  assert(b.safety?.allowed === false, "B must block delivery");
  assert(b.discrepancies.some((item) => item.type === "wrong_strength"), "B must create wrong_strength");
  assert(
    b.criteria.some(
      (item) =>
        item.criterionId === "criterion-5-compare-prepared-items" && item.status === "missed",
    ),
    "B must miss criterion 5",
  );
  assert(
    b.competencies.some((item) => item.competencyId === "verify_strength" && item.status === "missed"),
    "B must miss verify_strength",
  );
  assert(
    b.competencies.some(
      (item) => item.competencyId === "double_check_performed" && item.status === "met",
    ),
    "B must distinguish an executed double-check from an effective verification",
  );
  assert(b.discrepancyTransitions.length >= 1, "B discrepancy must be intercepted at final safety check");
  checks.push("B: wrong strength is missed by manual verification and intercepted by safety");

  const c = byId.get("C");
  assert(c?.validation.valid, "C must be a valid session");
  assert(c.safety?.allowed === true, "C must not invent a delivery discrepancy");
  assert(c.discrepancies.length === 0, "C must contain zero medication discrepancies");
  assert(
    c.criteria.some(
      (item) =>
        item.criterionId === "criterion-3-identify-all-prescriptions" && item.status === "missed",
    ),
    "C must miss criterion 3",
  );
  assert(
    c.competencies.some((item) => item.competencyId === "record_review" && item.status === "missed"),
    "C must miss record_review",
  );
  checks.push("C: incomplete review is a process deviation, not a fabricated medication error");

  const d = byId.get("D");
  assert(d?.validation.valid, "D must be a valid session");
  assert(d.safety?.allowed === false, "D must block delivery");
  assert(d.discrepancies.some((item) => item.type === "wrong_patient"), "D must create wrong_patient");
  checks.push("D: wrong patient context is blocked before delivery");

  const e = byId.get("E");
  assert(e?.validation.valid, "E must be a valid session");
  assert(e.safety?.allowed === true, "E must allow delivery when the prepared product is correct");
  assert(e.discrepancies.length === 0, "E must not fabricate a delivery discrepancy");
  assert(
    e.processDeviations.some((item) => item.type === "drawer_label_mismatch"),
    "E must detect the drawer label mismatch",
  );
  assert(
    e.processDeviations.some((item) => item.type === "drawer_mixed_contents"),
    "E must detect mixed drawer contents",
  );
  checks.push("E: storage anomalies remain separate from the final prepared product state");

  return { passed: true, checks };
}
