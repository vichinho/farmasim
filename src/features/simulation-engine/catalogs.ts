import { arsenal2026OpenCarePresentations } from "@/features/simulation-engine/arsenal/arsenal-2026-adapter";
import {
  healthcareFacilityCatalog,
  syntheticPatientCatalog,
} from "@/features/simulation-engine/synthetic-catalogs";
import type {
  HealthcareFacility,
  MedicationPresentation,
  SyntheticPatient,
} from "@/features/simulation-engine/types";

export type SimulationCatalogs = {
  patients: readonly SyntheticPatient[];
  facilities: readonly HealthcareFacility[];
  presentations: readonly MedicationPresentation[];
};

/**
 * Small development-only medication catalog retained for regression fixtures.
 * Patients and facilities still come from the same synthetic/network catalogs
 * used by the real generator, so no valid-looking personal identifiers live here.
 */
export const technicalSimulationCatalogs: SimulationCatalogs = {
  patients: syntheticPatientCatalog.slice(0, 6),
  facilities: healthcareFacilityCatalog,
  presentations: [
    {
      id: "losartan-50",
      medicationId: "losartan",
      genericName: "Losartán",
      strength: "50 mg",
      pharmaceuticalForm: "Comprimido",
      packageQuantity: 30,
      source: { catalog: "technical" },
    },
    {
      id: "losartan-100",
      medicationId: "losartan",
      genericName: "Losartán",
      strength: "100 mg",
      pharmaceuticalForm: "Comprimido",
      packageQuantity: 30,
      source: { catalog: "technical" },
    },
    {
      id: "amlodipino-5",
      medicationId: "amlodipino",
      genericName: "Amlodipino",
      strength: "5 mg",
      pharmaceuticalForm: "Comprimido",
      packageQuantity: 30,
      source: { catalog: "technical" },
    },
    {
      id: "paracetamol-500",
      medicationId: "paracetamol",
      genericName: "Paracetamol",
      strength: "500 mg",
      pharmaceuticalForm: "Comprimido",
      packageQuantity: 20,
      source: { catalog: "technical" },
    },
  ],
};

/**
 * Scenario-ready catalog backed by ARSENAL 2026.xlsx / Atención Abierta plus
 * fully synthetic training patients. Medication source metadata is preserved
 * on each presentation for traceability.
 */
export const arsenal2026SimulationCatalogs: SimulationCatalogs = {
  patients: syntheticPatientCatalog,
  facilities: healthcareFacilityCatalog,
  presentations: arsenal2026OpenCarePresentations,
};
