import { describe, expect, it } from "vitest";

import { scenario001 } from "@/data/simulation/scenario-001";
import {
  assertValidScenarioDefinition,
  buildExpectedTray,
  createSimulationSession,
  executeSimulationCommand,
  expectedPrescriptionLines,
  type ScenarioDefinition,
  type SimulationCommand,
} from "@/features/simulation-engine";

const LOSARTAN_50 = "trakcare-004-0137";
const ATORVASTATIN_20 = "trakcare-004-0227";

function multiFacilityScenario(): ScenarioDefinition {
  const base = structuredClone(scenario001);
  const prescriptions: ScenarioDefinition["prescriptions"] = [
    {
      id: "h-tome-losartan-current",
      patientId: base.patient.id,
      establishmentId: "hospital-tome",
      status: "pending",
      dates: { issuedAt: "2026-08-18", pickupAt: "2026-08-19" },
      repetition: "yes",
      lines: [{ id: "h-line-losartan-current", medicationPresentationId: LOSARTAN_50, quantity: 30 }],
    },
    {
      id: "h-bellavista-losartan-prior",
      patientId: base.patient.id,
      establishmentId: "cesfam-bellavista",
      status: "dispensed",
      dates: { issuedAt: "2026-07-01", dispatchedAt: "2026-07-03", lastPickupAt: "2026-07-03" },
      repetition: "no",
      lines: [{ id: "h-line-losartan-bellavista", medicationPresentationId: LOSARTAN_50, quantity: 30 }],
    },
    {
      id: "h-tome-losartan-prior",
      patientId: base.patient.id,
      establishmentId: "hospital-tome",
      status: "dispensed",
      dates: { issuedAt: "2026-06-01", dispatchedAt: "2026-06-04", lastPickupAt: "2026-06-04" },
      repetition: "yes",
      lines: [{ id: "h-line-losartan-tome-prior", medicationPresentationId: LOSARTAN_50, quantity: 30 }],
    },
    {
      id: "h-tome-atorvastatin-current",
      patientId: base.patient.id,
      establishmentId: "hospital-tome",
      status: "pending",
      dates: { issuedAt: "2026-08-18", pickupAt: "2026-08-19" },
      repetition: "yes",
      lines: [{ id: "h-line-atorvastatin-current", medicationPresentationId: ATORVASTATIN_20, quantity: 30 }],
    },
  ];

  return assertValidScenarioDefinition({
    ...base,
    id: "test-h-multi-facility",
    version: "2.8.0-test",
    activeDispensingFacilityId: "hospital-tome",
    prescriptions,
    visibleClinicalRecordIds: prescriptions.map((record) => record.id),
    availablePrescriptionIds: [
      "h-tome-losartan-current",
      "h-tome-atorvastatin-current",
    ],
    prescriptionsRelevantToCurrentWithdrawal: [
      "h-tome-losartan-current",
      "h-tome-atorvastatin-current",
    ],
    drawers: [
      {
        ...base.drawers[0],
        id: "h-drawer-losartan",
        expectedMedicationPresentationId: LOSARTAN_50,
        expectedLabel: "LOSARTÁN 50 mg · COMPRIMIDO ORAL",
        displayedLabel: "LOSARTÁN 50 mg · COMPRIMIDO ORAL",
        contents: [LOSARTAN_50],
      },
      {
        ...base.drawers[1],
        id: "h-drawer-atorvastatin",
        expectedMedicationPresentationId: ATORVASTATIN_20,
        expectedLabel: "ATORVASTATINA 20 mg · COMPRIMIDO ORAL",
        displayedLabel: "ATORVASTATINA 20 mg · COMPRIMIDO ORAL",
        contents: [ATORVASTATIN_20],
      },
    ],
    initialTray: {
      id: "h-tray",
      patientId: base.patient.id,
      status: "empty",
      items: [],
    },
  });
}

function run(scenario: ScenarioDefinition, commands: SimulationCommand[]) {
  return commands.reduce(
    (session, command) => executeSimulationCommand(scenario, session, command),
    createSimulationSession(scenario),
  );
}

describe("H — registros multiestablecimiento y posible duplicación", () => {
  it("keeps four records inspectable while only Hospital de Tomé feeds preparation", () => {
    const scenario = multiFacilityScenario();
    const expectedLines = expectedPrescriptionLines(scenario);

    expect(scenario.visibleClinicalRecordIds).toHaveLength(4);
    expect(expectedLines.map((line) => line.id).sort()).toEqual([
      "h-line-atorvastatin-current",
      "h-line-losartan-current",
    ]);
    expect(expectedLines.some((line) => line.id === "h-line-losartan-bellavista")).toBe(false);
    expect(buildExpectedTray(scenario).items.map((item) => item.prescriptionLineId).sort()).toEqual([
      "h-line-atorvastatin-current",
      "h-line-losartan-current",
    ]);

    const commands: SimulationCommand[] = [
      { type: "role.selected", actorId: "tens-1", data: { selectedRole: "tens-1" } },
      ...scenario.visibleClinicalRecordIds.flatMap((prescriptionId) => [
        { type: "prescription.opened", actorId: "tens-1", data: { prescriptionId } } as SimulationCommand,
        { type: "record.scrolled", actorId: "tens-1", data: { recordId: prescriptionId } } as SimulationCommand,
      ]),
    ];
    const session = run(scenario, commands);
    expect(session.openedPrescriptionIds.sort()).toEqual([...scenario.visibleClinicalRecordIds].sort());
    expect(session.scrolledRecordIds.sort()).toEqual([...scenario.visibleClinicalRecordIds].sort());
  });

  it("exposes repeated Losartan as reviewable context without declaring a clinical conclusion", () => {
    const scenario = multiFacilityScenario();
    const losartanRecords = scenario.prescriptions.filter((record) =>
      record.lines.some((line) => line.medicationPresentationId === LOSARTAN_50),
    );

    expect(losartanRecords).toHaveLength(3);
    expect(new Set(losartanRecords.map((record) => record.establishmentId)).size).toBe(2);
    expect(losartanRecords.every((record) => record.apparentlyDuplicateOf === undefined)).toBe(true);

    const session = run(scenario, [
      { type: "role.selected", actorId: "tens-1", data: { selectedRole: "tens-1" } },
      {
        type: "prescription.status_verified",
        actorId: "tens-1",
        data: { prescriptionId: "h-tome-losartan-current", disposition: "hold-for-review" },
      },
      {
        type: "prescription.status_verified",
        actorId: "tens-1",
        data: { prescriptionId: "h-tome-atorvastatin-current", disposition: "hold-for-review" },
      },
      { type: "qf_support.requested", actorId: "tens-1" },
    ]);

    expect(session.deliveryStatus).toBe("safely-stopped");
    expect(session.eventLog.some((event) => event.type === "qf_support.requested")).toBe(true);
  });
});
