export type DatabaseProfileRole = "learner" | "supervisor" | "admin";
export type UserRole = "TENS" | "SUPERVISOR_QF" | "ADMIN";

export function userRoleFromProfileRole(role: DatabaseProfileRole): UserRole {
  if (role === "supervisor") return "SUPERVISOR_QF";
  if (role === "admin") return "ADMIN";
  return "TENS";
}

export function isSupervisorAccount(role: DatabaseProfileRole) {
  return role === "supervisor" || role === "admin";
}
