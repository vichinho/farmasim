import { redirect } from "next/navigation";

import { isSupervisorAccount, type DatabaseProfileRole } from "@/features/auth/account-roles";
import { createExtendedClient } from "@/lib/supabase/server-untyped";

export type SupervisorContext = {
  userId: string;
  fullName: string;
  role: DatabaseProfileRole;
  facilityIds: string[];
};

type ProfileSnapshot = {
  full_name: string | null;
  role: DatabaseProfileRole;
};

type FacilityMembershipSnapshot = {
  facility_id: string;
};

export async function requireSupervisorContext(): Promise<SupervisorContext> {
  const supabase = await createExtendedClient();
  const { data: claimsResult } = await supabase.auth.getClaims();
  const userId = claimsResult?.claims.sub;
  if (!userId) redirect("/login");

  const [profileResult, membershipsResult] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", userId).maybeSingle(),
    supabase.from("profile_facility_memberships").select("facility_id").eq("user_id", userId),
  ]);
  const profile = profileResult.data as unknown as ProfileSnapshot | null;
  const memberships = (membershipsResult.data ?? []) as unknown as FacilityMembershipSnapshot[];

  if (!profile || !isSupervisorAccount(profile.role)) redirect("/dashboard");

  return {
    userId,
    fullName: profile.full_name?.trim() || "Supervisor/QF",
    role: profile.role,
    facilityIds: memberships.map((membership) => membership.facility_id),
  };
}

export async function currentAccountRole() {
  const supabase = await createExtendedClient();
  const { data: claimsResult } = await supabase.auth.getClaims();
  const userId = claimsResult?.claims.sub;
  if (!userId) return null;
  const profileResult = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const profile = profileResult.data as unknown as { role: DatabaseProfileRole } | null;
  return profile?.role ?? null;
}
