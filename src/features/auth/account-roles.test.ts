import { describe, expect, it } from "vitest";

import { isSupervisorAccount, userRoleFromProfileRole } from "./account-roles";

describe("account roles", () => {
  it("maps persisted roles to platform roles without using TENS 1/TENS 2 operational roles", () => {
    expect(userRoleFromProfileRole("learner")).toBe("TENS");
    expect(userRoleFromProfileRole("supervisor")).toBe("SUPERVISOR_QF");
    expect(userRoleFromProfileRole("admin")).toBe("ADMIN");
  });

  it("allows supervisor/admin accounts through supervision guards but not learners", () => {
    expect(isSupervisorAccount("learner")).toBe(false);
    expect(isSupervisorAccount("supervisor")).toBe(true);
    expect(isSupervisorAccount("admin")).toBe(true);
  });
});
