import { runPersistenceRegressionChecks } from "@/features/simulation-engine/fixtures/persistence-regression";
import { runMinimumScenarioRegressionChecks } from "@/features/simulation-engine/fixtures/regression-checks";

/**
 * Full engine regression suite.
 *
 * The persistence regression contains several assertions internally, but it is
 * represented as one architectural check here so the historical core counter
 * moves from 14 to 15 without changing the meaning of the previous checks.
 */
export function runSimulationEngineRegressionChecks() {
  const core = runMinimumScenarioRegressionChecks();
  const persistence = runPersistenceRegressionChecks();

  return {
    passed: true as const,
    checks: [
      ...core.checks,
      "Persistence: checkpoint restores clinical, material, inventory and sequencing state from Session + EventLog",
    ],
    details: {
      coreChecks: core.checks.length,
      persistenceChecks: persistence.checks.length,
    },
  };
}
