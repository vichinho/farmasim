import type {
  InstructionSection,
  ScenarioDefinition,
  SimulationEvent,
} from "./types";

export const requiredInstructionSections: InstructionSection[] = [
  "purpose",
  "schedule-administration",
  "precautions",
  "qf-escalation",
];

export const instructionSectionLabels: Record<InstructionSection, string> = {
  purpose: "Propósito del medicamento",
  "schedule-administration": "Horario y forma de administración",
  precautions: "Precauciones relevantes",
  "qf-escalation": "Cuándo consultar al QF",
};

export type InstructionRequirement = {
  prescriptionLineId: string;
  medicationPresentationId: string;
  section: InstructionSection;
};

export function instructionEvidenceKey(
  prescriptionLineId: string,
  section: InstructionSection,
) {
  return `${prescriptionLineId}:${section}`;
}

export function requiredInstructionEvidence(
  scenario: ScenarioDefinition,
): InstructionRequirement[] {
  const relevant = new Set(scenario.prescriptionsRelevantToCurrentWithdrawal);
  return scenario.prescriptions
    .filter((record) => relevant.has(record.id))
    .flatMap((record) => record.lines)
    .flatMap((line) => requiredInstructionSections.map((section) => ({
      prescriptionLineId: line.id,
      medicationPresentationId: line.medicationPresentationId,
      section,
    })));
}

export function instructionEvidenceFromEvents(events: SimulationEvent[]) {
  return new Set(
    events
      .filter((event) => event.type === "instruction.section_given")
      .flatMap((event) => {
        const lineId = event.data.prescriptionLineId;
        const section = event.data.section;
        if (typeof lineId !== "string" || typeof section !== "string") return [];
        if (!requiredInstructionSections.includes(section as InstructionSection)) return [];
        return [instructionEvidenceKey(lineId, section as InstructionSection)];
      }),
  );
}

export function missingInstructionEvidence(
  scenario: ScenarioDefinition,
  events: SimulationEvent[],
) {
  const given = instructionEvidenceFromEvents(events);
  return requiredInstructionEvidence(scenario).filter(
    (requirement) => !given.has(instructionEvidenceKey(requirement.prescriptionLineId, requirement.section)),
  );
}

export function missingInstructionSections(
  scenario: ScenarioDefinition,
  events: SimulationEvent[],
): InstructionSection[] {
  return Array.from(new Set(missingInstructionEvidence(scenario, events).map((item) => item.section)));
}

export function instructionsComplete(
  scenario: ScenarioDefinition,
  events: SimulationEvent[],
) {
  const requirements = requiredInstructionEvidence(scenario);
  return requirements.length > 0 && missingInstructionEvidence(scenario, events).length === 0;
}
