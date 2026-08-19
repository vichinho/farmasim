import { ambulatoryArsenal } from "@/data/simulation/arsenal";
import { assertValidScenarioDefinition } from "@/features/simulation-engine/scenario-validator";
import type { ScenarioDefinition } from "@/features/simulation-engine/types";

const definition: ScenarioDefinition = {
  id: "case-001-2d-engine",
  version: "2.8.0",
  seed: 20260818,
  mode: "guided",
  patient: {
    id: "patient-marta-fuentes",
    firstName: "Marta",
    paternalSurname: "Fuentes",
    maternalSurname: "Soto",
    rut: "12.345.678-9",
    age: 71,
  },
  similarPatients: [
    {
      id: "patient-marta-fuentes-similar",
      firstName: "Marta",
      paternalSurname: "Fuentes",
      maternalSurname: "Solís",
      rut: "12.345.679-7",
      age: 69,
    },
  ],
  actors: [
    { id: "tens-1", role: "attention", controller: "participant", displayName: "TENS 1" },
    { id: "tens-2", role: "preparation", controller: "simulation", displayName: "TENS 2" },
    { id: "qf-support", role: "qf-support", controller: "simulation", displayName: "QF de apoyo" },
  ],
  activeDispensingFacilityId: "hospital-tome",
  prescriptions: [
    {
      id: "rx-tome-001",
      patientId: "patient-marta-fuentes",
      establishmentId: "hospital-tome",
      status: "accepted",
      dates: {
        issuedAt: "2026-08-02",
        enteredAt: "2026-08-02",
        lastPickupAt: "2026-07-02",
        nextPickupAt: "2026-09-02",
      },
      repetition: "yes",
      lines: [
        { id: "line-losartan", medicationPresentationId: "trakcare-004-0137", quantity: 30 },
      ],
    },
    {
      id: "rx-bellavista-002",
      patientId: "patient-marta-fuentes",
      establishmentId: "cesfam-bellavista",
      status: "sent",
      dates: { issuedAt: "2026-08-05", enteredAt: "2026-08-06" },
      repetition: "review",
      lines: [
        { id: "line-amlodipine", medicationPresentationId: "trakcare-004-0374", quantity: 30 },
      ],
    },
    {
      id: "rx-historical-003",
      patientId: "patient-marta-fuentes",
      establishmentId: "hospital-las-higueras",
      status: "historical",
      dates: { issuedAt: "2025-11-10", dispatchedAt: "2025-11-12" },
      repetition: "no",
      lines: [
        { id: "line-paracetamol-history", medicationPresentationId: "trakcare-004-0087", quantity: 20 },
      ],
    },
  ],
  visibleClinicalRecordIds: ["rx-tome-001", "rx-bellavista-002", "rx-historical-003"],
  availablePrescriptionIds: ["rx-tome-001", "rx-bellavista-002"],
  prescriptionsRelevantToCurrentWithdrawal: ["rx-tome-001"],
  arsenal: ambulatoryArsenal,
  drawers: [
    {
      id: "drawer-losartan",
      sectorId: "antihypertensives",
      expectedMedicationPresentationId: "trakcare-004-0137",
      expectedLabel: "LOSARTÁN 50 mg · Comprimidos",
      displayedLabel: "LOSARTÁN 50 mg · Comprimidos",
      physicalCondition: "normal",
      stockState: "available",
      contents: ["trakcare-004-0137"],
    },
    {
      id: "drawer-amlodipine",
      sectorId: "antihypertensives",
      expectedMedicationPresentationId: "trakcare-004-0374",
      expectedLabel: "AMLODIPINO 5 mg · Comprimidos",
      displayedLabel: "AMLODIPINO 5 mg · Comprimidos",
      physicalCondition: "normal",
      stockState: "available",
      contents: ["trakcare-004-0374"],
    },
  ],
  initialTray: {
    id: "tray-case-001",
    patientId: "patient-marta-fuentes",
    status: "empty",
    items: [],
  },
  initialClinicalSystemState: "clean_search",
  educationalSourceIds: ["dispensing-evaluation-rubric-7-criteria", "arsenal-2026"],
};

export const scenario001 = assertValidScenarioDefinition(definition);
