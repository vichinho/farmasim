import { scenario001 } from "@/data/simulation/scenario-001";
import type { ScenarioDefinition, SimulationMode, TrayItem } from "./types";
import { assertValidScenarioDefinition } from "./scenario-validator";

function hashSeed(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function seededIndex(seed: number, length: number) {
  let state = seed || 1;
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return (state >>> 0) % length;
}

export type ScenarioGenerationOptions = {
  id: string;
  mode: SimulationMode;
  seed?: number;
};

export function generateScenarioDefinition({
  id,
  mode,
  seed = hashSeed(id),
}: ScenarioGenerationOptions): ScenarioDefinition {
  const base = structuredClone(scenario001);
  const patients = [
    base.patient,
    {
      ...base.patient,
      id: "patient-carolina-soto",
      firstName: "Carolina",
      paternalSurname: "Soto",
      maternalSurname: "Vera",
      rut: "16.542.781-3",
      age: 58,
    },
    {
      ...base.patient,
      id: "patient-diego-morales",
      firstName: "Diego",
      paternalSurname: "Morales",
      maternalSurname: "Rojas",
      rut: "19.331.245-K",
      age: 36,
    },
  ];
  const patient = patients[seededIndex(seed, patients.length)];
  const corePrescriptions = base.prescriptions.map((record) => ({
    ...record,
    patientId: patient.id,
  }));
  const recordTarget = mode === "guided" ? 3 : mode === "practice" ? 5 : 12;
  const establishments: ScenarioDefinition["prescriptions"][number]["establishmentId"][] = [
    "hospital-tome",
    "hospital-las-higueras",
    "cesfam-bellavista",
    "cesfam-alberto-reyes",
    "cosam",
    "san-rafael",
    "penco",
    "lirquen",
  ];
  const statuses: ScenarioDefinition["prescriptions"][number]["status"][] = [
    "pending",
    "accepted",
    "sent",
    "dispensed",
    "completed",
    "rejected",
    "historical",
  ];
  const prescriptions = Array.from({ length: recordTarget }, (_, index) => {
    if (index < corePrescriptions.length) return corePrescriptions[index];
    const template = corePrescriptions[index % corePrescriptions.length];
    const recordId = `generated-record-${index + 1}`;
    return {
      ...template,
      id: recordId,
      establishmentId: establishments[(seededIndex(seed + index, establishments.length))],
      status: statuses[(seededIndex(seed + index * 7, statuses.length))],
      dates: {
        ...template.dates,
        issuedAt: `202${4 + (index % 3)}-${String((index % 12) + 1).padStart(2, "0")}-10`,
      },
      apparentlyDuplicateOf: index % 4 === 0 ? corePrescriptions[0].id : undefined,
      lines: template.lines.map((line) => ({ ...line, id: `${recordId}:${line.id}` })),
    };
  });
  const expectedItems: TrayItem[] = prescriptions
    .filter((record) => base.expectedPrescriptionIds.includes(record.id))
    .flatMap((record) => record.lines)
    .map((line) => ({
      id: `tray:${line.id}`,
      prescriptionLineId: line.id,
      medicationPresentationId: line.medicationPresentationId,
      quantity: line.quantity,
    }));

  let items = expectedItems;
  if (id.includes("001") || id.includes("002") || id.includes("003")) {
    items = expectedItems.map((item) =>
      item.prescriptionLineId === "line-losartan"
        ? { ...item, medicationPresentationId: "losartan-100-tablet-30" }
        : item,
    );
  } else if (id.includes("006")) {
    items = expectedItems.map((item) =>
      item.prescriptionLineId === "line-losartan"
        ? { ...item, medicationPresentationId: "losartan-100-tablet-30", quantity: 60 }
        : item,
    );
  } else if (id.includes("007")) {
    items = expectedItems
      .filter((item) => item.prescriptionLineId !== "line-amlodipine")
      .concat({
        id: "tray:additional-paracetamol",
        medicationPresentationId: "paracetamol-500-tablet-20",
        quantity: 20,
      });
  }

  return assertValidScenarioDefinition({
    ...base,
    id,
    version: "2.0.0-generated",
    seed,
    mode,
    patient,
    prescriptions,
    initialTray: {
      ...base.initialTray,
      id: `tray:${id}`,
      patientId: patient.id,
      items,
    },
  });
}
