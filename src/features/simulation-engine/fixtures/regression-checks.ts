import { buildArsenal2026AdapterReport } from "@/features/simulation-engine/arsenal/arsenal-2026-adapter";
import { getDifficultyProfile } from "@/features/simulation-engine/difficulty-engine";
import { buildDifficultyReport } from "@/features/simulation-engine/fixtures/difficulty-report";
import { buildGenerationReport } from "@/features/simulation-engine/fixtures/generation-report";
import { buildMinimumScenarioReport } from "@/features/simulation-engine/fixtures/report";
import {
  buildBlockedDeliveryRecoveryReport,
  buildPreparationWorkflowReport,
  buildRoleHandoffReport,
  buildRuntimeReport,
  buildRuntimeStockReport,
  runtimeRejectsInvalidAction,
} from "@/features/simulation-engine/fixtures/runtime-report";

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

  const arsenalReport = buildArsenal2026AdapterReport();
  assert(arsenalReport.sourceRows === 304, "2026 open-care arsenal must contain the 304 imported source rows");
  assert(
    arsenalReport.presentations === arsenalReport.sourceRows,
    "each imported open-care row must create one traceable medication presentation",
  );
  assert(arsenalReport.primaryStrengthParsed === 291, "291 strengths must remain parsed from the primary arsenal sheet");
  assert(arsenalReport.supplementalStrengthParsed === 2, "two previously unresolved strengths must be recovered from the supplemental sheet");
  assert(arsenalReport.requiresReview === 11, "eleven rows must remain explicitly flagged for source review");
  assert(arsenalReport.noStrengthInSource === 9, "nine review rows must have no usable strength in the available source text");
  assert(arsenalReport.sourceConflicts === 2, "two review rows must be flagged as conflicting supplemental source descriptions");
  assert(
    arsenalReport.alternateStrengthGroups > 0,
    "real arsenal must expose at least one same-medication/same-form alternate-strength group",
  );
  checks.push("Arsenal 2026: unresolved strengths are classified without inventing source data");

  const generationReport = buildGenerationReport();
  assert(generationReport.length === 5, "dynamic generation must cover the five minimum definitions");
  for (const generated of generationReport) {
    assert(
      generated.deterministicReplay,
      `${generated.id} must reproduce the same semantic session with the same seed`,
    );
    assert(generated.attempts >= 1, `${generated.id} must report at least one generation attempt`);
    assert(
      generated.generated.relevantPrescriptions.every(
        (item) => item.source?.catalog === "arsenal-2026",
      ),
      `${generated.id} must generate prescriptions from the 2026 arsenal adapter`,
    );
  }
  checks.push("Generator: all five definitions reproduce deterministically from the real 2026 arsenal");

  const difficultyReport = buildDifficultyReport();
  assert(difficultyReport.length === 4, "difficulty diagnostics must cover initial, medium, high and expert");
  for (const item of difficultyReport) {
    const profile = getDifficultyProfile(item.difficulty);
    assert(
      item.recordCount >= profile.recordCount.min && item.recordCount <= profile.recordCount.max,
      `${item.difficulty} record count must stay inside its configured range`,
    );
    assert(
      item.relevantPrescriptionCount >= profile.relevantPrescriptionCount.min &&
        item.relevantPrescriptionCount <= profile.relevantPrescriptionCount.max,
      `${item.difficulty} relevant prescription count must stay inside its configured range`,
    );
    assert(
      item.facilityCount >= profile.facilityCount.min && item.facilityCount <= profile.facilityCount.max,
      `${item.difficulty} facility diversity must stay inside its configured range`,
    );
  }
  checks.push("Difficulty: all four levels obey deterministic complexity profiles");

  const runtimeReport = buildRuntimeReport();
  assert(runtimeReport.length === 5, "runtime replay must cover all five minimum scenarios");
  for (const runtime of runtimeReport) {
    assert(
      runtime.status === runtime.expectedStatus,
      `${runtime.id} runtime status must be ${runtime.expectedStatus}, received ${runtime.status}`,
    );
    const expectsSystemDecision = runtime.id !== "E";
    assert(
      runtime.generatedEvents === (expectsSystemDecision ? 1 : 0),
      `${runtime.id} must generate the expected number of system delivery decision events`,
    );
  }
  assert(runtimeRejectsInvalidAction(), "runtime must reject actions from actors outside the session");
  checks.push("Runtime: player actions are replayed incrementally and delivery decisions remain engine-owned");

  const recovery = buildBlockedDeliveryRecoveryReport();
  assert(recovery.blockedStatus === "delivery-blocked", "recovery flow must begin from a blocked delivery");
  assert(recovery.blockedEvent === "delivery.blocked", "first delivery decision must remain blocked");
  assert(recovery.blockedDiscrepancies === 1, "wrong-strength delivery must begin with one blocking discrepancy");
  assert(recovery.completedStatus === "completed", "corrected preparation must complete on retry");
  assert(recovery.completedEvent === "delivery.completed", "retry must generate delivery.completed");
  assert(recovery.finalBlockingDiscrepancies === 0, "corrected preparation must have zero blocking discrepancies");
  assert(recovery.deliveryBlockedEvents === 1, "blocked delivery history must remain in the append-only log");
  assert(recovery.deliveryCompletedEvents === 1, "successful retry must be recorded once");
  assert(recovery.handoff.owner === "attention" && recovery.handoff.received, "corrected tray must return to attention before retry delivery");
  assert(recovery.preparationWorkflow.traySent, "TENS 2 must re-confirm and resend the corrected tray");
  assert(
    recovery.trayItems.length === 1 &&
      recovery.trayItems[0]?.presentationId === "losartan-50" &&
      recovery.trayItems[0]?.quantity === 1,
    "corrected tray must contain exactly the requested Losartan 50 presentation",
  );
  assert(recovery.heldItems.length === 0, "no medication may remain held after the correction flow");
  checks.push("Runtime material state: TENS 1 can request correction, TENS 2 rebuilds the tray, and delivery retries without resetting history");

  const stock = buildRuntimeStockReport();
  assert(stock.overdrawRejected, "runtime must reject taking more medication than drawer stock");
  assert(stock.initial?.totalQuantity === 6 && stock.initial.stockState === "available", "stock flow must start available with six units");
  assert(stock.low?.totalQuantity === 1 && stock.low.stockState === "low", "stock must become low when only one unit remains");
  assert(stock.empty?.totalQuantity === 0 && stock.empty.stockState === "out-of-stock", "stock must become out-of-stock at zero");
  assert(stock.restored?.totalQuantity === 1 && stock.restored.stockState === "low", "returning medication must restore drawer stock");
  assert(stock.eventCount === 4, "rejected overdraw must not be appended to the event log; drawer.opened plus three accepted stock events remain");
  checks.push("Runtime inventory: drawer stock is event-derived, bounded, and transitions through available/low/out-of-stock");

  const preparation = buildPreparationWorkflowReport();
  assert(preparation.correct.workflow.confirmed, "preparation flow must record preparation.confirmed");
  assert(preparation.correct.workflow.traySent, "confirmed preparation must be sendable");
  assert(preparation.correct.heldItems.length === 0, "sent preparation cannot leave medication held");
  assert(
    preparation.correct.trayItems.length === 1 &&
      preparation.correct.trayItems[0]?.presentationId === "losartan-50" &&
      preparation.correct.trayItems[0]?.quantity === 1,
    "correct preparation flow must place the requested presentation on the tray",
  );
  assert(preparation.correct.blockingDiscrepancies === 0, "correct preparation must have zero delivery discrepancies");
  assert(preparation.guards.sendBeforeConfirmRejected, "tray.sent must be rejected before preparation.confirmed");
  assert(preparation.guards.sendBeforeConfirmEventCount === 0, "rejected premature send must not enter the event log");
  assert(preparation.guards.confirmWhileHoldingRejected, "preparation.confirmed must be rejected while medication remains held");
  assert(preparation.wrongHandoff.workflow.traySent, "an incorrect preparation may still be sent downstream for manual interception");
  assert(preparation.wrongHandoff.handoff.owner === "transit", "a sent TENS 2 tray must remain in transit until TENS 1 receives it");
  assert(preparation.wrongHandoff.blockingDiscrepancies === 1, "wrong-strength handoff must retain one material discrepancy");
  assert(preparation.wrongHandoff.systemDeliveryEvents === 0, "preparation handoff must not trigger final delivery Safety decisions");
  checks.push("Preparation workflow: operational guards are enforced without auto-correcting clinically wrong TENS 2 handoffs");

  const handoff = buildRoleHandoffReport();
  assert(handoff.firstSend.owner === "transit" && handoff.firstSend.sent && !handoff.firstSend.received, "first TENS 2 send must place the tray in transit");
  assert(handoff.afterCorrectionRequest.owner === "preparation" && handoff.afterCorrectionRequest.cycle === 2, "TENS 1 correction must return ownership to preparation and start cycle 2");
  assert(handoff.secondSend.owner === "transit" && handoff.secondSend.cycle === 2, "corrected tray must be re-sent through the same handoff contract");
  assert(handoff.finalHandoff.owner === "attention" && handoff.finalHandoff.received, "TENS 1 must receive the corrected tray before final delivery");
  assert(handoff.finalStatus === "completed" && handoff.finalEvent === "delivery.completed", "corrected two-role flow must end in completed delivery");
  assert(handoff.finalBlockingDiscrepancies === 0, "corrected handoff must finish with zero blocking discrepancies");
  assert(handoff.correctionRequestedEvents === 1, "two-role correction flow must retain exactly one correction request");
  assert(handoff.deliveryCompletedEvents === 1, "two-role handoff must complete delivery once");
  assert(handoff.guards.receiveBeforeSendRejected, "TENS 1 cannot receive before TENS 2 sends the tray");
  assert(handoff.guards.receiveBeforeSendEventCount === 0, "rejected early receipt must not enter the EventLog");
  assert(handoff.guards.correctionBeforeReceiveRejected, "TENS 1 cannot request tray correction before receiving the current handoff");
  assert(handoff.guards.correctionBeforeReceiveEventCount === 9, "rejected pre-receipt correction must not append an extra event");
  checks.push("Role handoff: TENS 2 → TENS 1 → correction → TENS 2 → TENS 1 remains ordered, role-owned, and auditable");

  return { passed: true, checks };
}
