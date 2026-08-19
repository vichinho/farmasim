import { describe, expect, it } from "vitest";

import { scenario001 } from "@/data/simulation/scenario-001";
import {
  createSimulationSession,
  describeSimulationEvent,
  executeSimulationCommand,
  getMissionSteps,
  getRecentLearnerActions,
} from "@/features/simulation-engine";

const actorId = "tens-1";
const now = "2026-08-18T12:00:00.000Z";

describe("simulation event presentation", () => {
  it("translates technical events into learner-facing Spanish", () => {
    let session = createSimulationSession(scenario001, { startedAt: now });
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "role.selected", actorId, data: { selectedRole: "tens-1" } },
      now,
    );
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "computer.focused", actorId },
      now,
    );

    const computerEvent = session.eventLog.find((event) => event.type === "computer.focused");
    expect(computerEvent).toBeDefined();
    expect(describeSimulationEvent(computerEvent!)).toBe(
      "Consultaste el computador clínico",
    );
    expect(getRecentLearnerActions(session.eventLog)).toEqual([
      { id: computerEvent!.id, label: "Consultaste el computador clínico" },
    ]);
  });

  it("marks only the next incomplete mission step as current", () => {
    const session = createSimulationSession(scenario001, { startedAt: now });
    const steps = getMissionSteps(scenario001, session);

    expect(steps.map((step) => step.status)).toEqual([
      "current",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("turns a blocked delivery into an actionable learner message", () => {
    const session = {
      ...createSimulationSession(scenario001, { startedAt: now }),
      deliveryStatus: "blocked" as const,
    };
    const delivery = getMissionSteps(scenario001, session).at(-1);

    expect(delivery?.status).toBe("attention");
    expect(delivery?.description).toContain("revisa la causa detectada");
  });
});
