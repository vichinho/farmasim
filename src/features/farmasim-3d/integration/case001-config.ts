import { arsenal2026SimulationCatalogs } from "@/features/simulation-engine/catalogs";
import type { ScenarioDefinition } from "@/features/simulation-engine/types";

export const CASE001_3D_DEFINITION: ScenarioDefinition = {
  id: "case-001-ambulatory-dispensing",
  version: 1,
  type: "correct_attention",
  difficulty: "initial",
  competencyTargets: [
    "identity_verification",
    "record_review",
    "verify_medication",
    "verify_strength",
    "verify_form",
    "verify_quantity",
    "double_check_performed",
    "instructions",
  ],
  allowedRoles: ["attention"],
  allowedModes: ["practice"],
  errorCountRange: { min: 0, max: 0 },
  protocolRules: {
    continuablePrescriptionStatuses: ["pending"],
  },
};

export const CASE001_3D_GENERATION = {
  playerRole: "attention" as const,
  mode: "practice" as const,
  maxAttempts: 50,
};

export const CASE001_3D_CATALOGS = arsenal2026SimulationCatalogs;

// Fixed only for the first integration vertical slice. Once interaction and
// completion are connected, a new-attempt seed will be supplied by the route.
export const CASE001_3D_INTEGRATION_SEED = "case001-3d-integration:seed:v1";
