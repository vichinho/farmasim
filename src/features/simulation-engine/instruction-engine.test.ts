import { describe, expect, it } from "vitest";

import { scenario001 } from "@/data/simulation/scenario-001";
import {
  createSimulationSession,
  evaluateCriteria,
  executeSimulationCommand,
  instructionEvidenceKey,
  missingInstructionSections,
  recommendReinforcement,
  requiredInstructionEvidence,
  type SimulationEvent,
} from "@/features/simulation-engine";

const now = "2026-08-18T12:00:00.000Z";

function event(
  type: SimulationEvent["type"],
  sequence: number,
  data: SimulationEvent["data"] = {},
): SimulationEvent {
  return {
    id: `event-${sequence}`,
    sequence,
    occurredAt: now,
    actorId: "tens-1",
    type,
    data,
  };
}

describe("granular patient instructions", () => {
  it("does not let the legacy instructions.given event satisfy criterion 7", () => {
    const criteria = evaluateCriteria(scenario001, [
      event("instructions.given", 1, { patientId: scenario001.patient.id }),
      event("delivery.completed", 2),
    ]);

    expect(criteria["criterion-7-provide-corresponding-instructions"]).toBe("reinforcement");
  });

  it("meets criterion 7 only after every required section is recorded for every relevant line", () => {
    const events = requiredInstructionEvidence(scenario001).map((requirement, index) =>
      event("instruction.section_given", index + 1, {
        prescriptionLineId: requirement.prescriptionLineId,
        section: requirement.section,
      }),
    );

    const criteria = evaluateCriteria(scenario001, events);
    expect(criteria["criterion-7-provide-corresponding-instructions"]).toBe("met");
    expect(missingInstructionSections(scenario001, events)).toEqual([]);
  });

  it("identifies the exact counseling section that is still missing", () => {
    const events = requiredInstructionEvidence(scenario001)
      .filter((requirement) => requirement.section !== "qf-escalation")
      .map((requirement, index) => event("instruction.section_given", index + 1, {
        prescriptionLineId: requirement.prescriptionLineId,
        section: requirement.section,
      }));

    expect(missingInstructionSections(scenario001, events)).toEqual(["qf-escalation"]);
  });

  it("stores granular evidence in the simulation session", () => {
    const requirement = requiredInstructionEvidence(scenario001)[0];
    let session = createSimulationSession(scenario001, { sessionId: "instruction-session", startedAt: now });
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "role.selected", actorId: "tens-1", data: { selectedRole: "tens-1" } },
      now,
    );
    session = executeSimulationCommand(
      scenario001,
      session,
      {
        type: "instruction.section_given",
        actorId: "tens-1",
        data: {
          prescriptionLineId: requirement.prescriptionLineId,
          section: requirement.section,
        },
      },
      now,
    );

    expect(session.instructionEvidenceKeys).toContain(
      instructionEvidenceKey(requirement.prescriptionLineId, requirement.section),
    );
  });

  it("targets the missing instruction section in the next reinforcement", () => {
    const session = createSimulationSession(scenario001, { sessionId: "instruction-reinforcement", startedAt: now });
    const recommendation = recommendReinforcement({
      ...session,
      missingInstructionSections: ["qf-escalation"],
      criteria: {
        ...session.criteria,
        "criterion-7-provide-corresponding-instructions": "reinforcement",
      },
    });

    expect(recommendation?.competency).toBe("instructions");
    expect(recommendation?.targetInstructionSection).toBe("qf-escalation");
    expect(recommendation?.variant.challengeKey).toBe("instructions-qf-escalation");
  });
});
