import { describe, expect, it } from "vitest";

import { scenario001 } from "@/data/simulation/scenario-001";
import { createSimulationSession, executeSimulationCommand } from "@/features/simulation-engine";

const now = "2026-08-19T19:20:00.000Z";

function blockedSession() {
  const initial = createSimulationSession(scenario001, {
    sessionId: "blocked-recovery",
    startedAt: now,
  });
  const selected = executeSimulationCommand(
    scenario001,
    initial,
    { type: "role.selected", actorId: "tens-1", data: { selectedRole: "tens-1" } },
    now,
  );
  return {
    ...selected,
    deliveryStatus: "blocked" as const,
  };
}

describe("blocked simulation recovery", () => {
  it("reopens a blocked flow when the participant returns to the patient", () => {
    const recovered = executeSimulationCommand(
      scenario001,
      blockedSession(),
      { type: "patient.focused", actorId: "tens-1" },
      now,
    );

    expect(recovered.deliveryStatus).toBe("not-attempted");
    expect(recovered.focusedObjectId).toBe("patient");
  });

  it("reopens a blocked flow when the participant returns to the computer", () => {
    const recovered = executeSimulationCommand(
      scenario001,
      blockedSession(),
      { type: "computer.focused", actorId: "tens-1" },
      now,
    );

    expect(recovered.deliveryStatus).toBe("not-attempted");
    expect(recovered.focusedObjectId).toBe("computer");
  });
});
