export type Medication = {
  id: string;
  name: string;
  concentration: string;
  form: string;
  quantity: number;
  directions: string;
};

export type Prescription = {
  id: string;
  medication: Medication;
  issuedAt: string;
  valid: boolean;
};

export type PreparedMedication = Medication & {
  prescriptionId: string;
};

export type SimulationScenario = {
  id: string;
  title: string;
  patient: { fullName: string; rut: string };
  prescriptions: Prescription[];
  preparedMedications: PreparedMedication[];
  hiddenErrors: Array<{
    type: "wrong_concentration" | "wrong_quantity" | "wrong_medication" | "missing_medication" | "none";
    prescriptionId: string;
    expectedValue?: string | number;
    actualValue?: string | number;
  }>;
};

export type DispensingChecklist = {
  identificationRequested: boolean;
  patientVerifiedInSystem: boolean;
  allPrescriptionsReviewed: boolean;
  prescriptionsValidated: boolean;
  medicationPreparationChecked: boolean;
  finalPatientIdentityVerified: boolean;
  instructionsDelivered: boolean;
};

export type PrescriptionReview = Record<
  string,
  { opened: boolean; reviewedFields: Record<"medication" | "concentration" | "form" | "quantity" | "directions", boolean> }
>;

export type SimulationEvent = { action: string; at: string };
