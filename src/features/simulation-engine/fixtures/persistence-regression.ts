import { buildPersistenceReport } from "@/features/simulation-engine/fixtures/persistence-report";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Simulation persistence regression failed: ${message}`);
}

export function runPersistenceRegressionChecks() {
  const report = buildPersistenceReport();

  assert(report.checkpointVersion === 1, "checkpoint schema version must remain 1");
  assert(report.attention.replayEqual, "attention snapshot must be identical after restore");
  assert(
    report.attention.eventCountBefore === report.attention.eventCountAfterRestore,
    "attention restore must preserve EventLog length",
  );
  assert(
    report.attention.activePatientId === "patient-marta",
    "restored clinical state must preserve active patient",
  );
  assert(
    report.attention.openedRecordIds.includes("record-marta"),
    "restored clinical state must preserve opened records",
  );
  assert(
    report.attention.nextEventCount === report.attention.eventCountAfterRestore + 1,
    "restored runtime must continue EventLog sequencing",
  );

  assert(report.preparation.replayEqual, "preparation snapshot must be identical after restore");
  assert(
    report.preparation.eventCountBefore === report.preparation.eventCountAfterRestore,
    "preparation restore must preserve EventLog length",
  );
  assert(
    JSON.stringify(report.preparation.heldBefore) === JSON.stringify(report.preparation.heldAfter),
    "restored preparation must preserve held medication",
  );
  assert(
    JSON.stringify(report.preparation.stockBefore) === JSON.stringify(report.preparation.stockAfter),
    "restored preparation must reconstruct identical drawer stock",
  );
  assert(
    report.preparation.continuedHandoff.owner === "transit",
    "restored preparation must continue through confirmation and tray send",
  );
  assert(
    report.preparation.continuedTrayItems.length === 1,
    "continued restored preparation must preserve the built tray",
  );
  assert(
    report.guards.corruptedCheckpointRejected,
    "corrupted EventLog sequence must be rejected during checkpoint parsing",
  );

  return {
    passed: true as const,
    checks: [
      "Attention clinical state restores exactly and continues sequencing",
      "Preparation material/inventory state restores exactly and continues handoff",
      "Corrupted checkpoint event sequences are rejected",
    ],
    report,
  };
}
