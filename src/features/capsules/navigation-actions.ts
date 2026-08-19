"use server";

import { redirect } from "next/navigation";

import { createExtendedClient } from "@/lib/supabase/server-untyped";

export async function openCapsuleAndRedirectAction(formData: FormData) {
  const assignmentId = formData.get("assignmentId");
  if (typeof assignmentId !== "string" || !assignmentId) return;
  const supabase = await createExtendedClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) redirect("/login");
  const result = await supabase.rpc("open_capsule_assignment", { p_assignment_id: assignmentId });
  if (result.error || !result.data) return;
  redirect(`/capsulas/${assignmentId}`);
}
