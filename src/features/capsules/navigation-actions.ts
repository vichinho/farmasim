"use server";

import { redirect } from "next/navigation";

import { createExtendedClient } from "@/lib/supabase/server-untyped";

export async function openCapsuleAndRedirectAction(formData: FormData) {
  const assignmentId = formData.get("assignmentId");
  if (typeof assignmentId !== "string" || !assignmentId) return;
  const supabase = await createExtendedClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/login");

  const ownership = await supabase
    .from("capsule_assignments")
    .select("id, status")
    .eq("id", assignmentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!ownership.data) return;

  const assignment = ownership.data as unknown as { status: string };
  if (assignment.status !== "completed") {
    const result = await supabase.rpc("open_capsule_assignment", { p_assignment_id: assignmentId });
    if (result.error) return;
  }
  redirect(`/capsulas/${assignmentId}`);
}
