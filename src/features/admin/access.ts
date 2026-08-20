import { redirect } from "next/navigation";

import type { DatabaseProfileRole } from "@/features/auth/account-roles";
import { createExtendedClient } from "@/lib/supabase/server-untyped";

export type AdminContext = {
  userId: string;
  fullName: string;
  role: "admin";
};

type ProfileSnapshot = {
  full_name: string | null;
  role: DatabaseProfileRole;
};

export async function requireAdminContext(): Promise<AdminContext> {
  const supabase = await createExtendedClient();
  const { data: claimsResult } = await supabase.auth.getClaims();
  const userId = claimsResult?.claims.sub;

  if (!userId) redirect("/login");

  const profileResult = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .maybeSingle();
  const profile = profileResult.data as unknown as ProfileSnapshot | null;

  if (!profile) redirect("/dashboard");
  if (profile.role === "supervisor") redirect("/supervision");
  if (profile.role !== "admin") redirect("/dashboard");

  return {
    userId,
    fullName: profile.full_name?.trim() || "Administrador",
    role: "admin",
  };
}
