"use server";

import { revalidatePath } from "next/cache";

import { requireAdminContext } from "@/features/admin/access";
import { createExtendedClient } from "@/lib/supabase/server-untyped";

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function integer(formData: FormData, name: string, fallback = 0) {
  const parsed = Number.parseInt(text(formData, name), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

export async function updateAdminProfileAction(formData: FormData) {
  await requireAdminContext();
  const userId = text(formData, "userId");
  const role = text(formData, "role");
  if (!userId || !["learner", "supervisor", "admin"].includes(role)) return;
  const supabase = await createExtendedClient();
  const result = await supabase.rpc("admin_update_profile", {
    p_is_training_active: checked(formData, "isTrainingActive"),
    p_role: role,
    p_user_id: userId,
  });
  if (result.error) console.error("Unable to update admin profile", result.error.message);
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
}

export async function setPrimaryFacilityAction(formData: FormData) {
  await requireAdminContext();
  const userId = text(formData, "userId");
  const facilityId = text(formData, "facilityId");
  if (!userId || !facilityId) return;
  const supabase = await createExtendedClient();
  const result = await supabase.rpc("admin_set_primary_facility", {
    p_facility_id: facilityId,
    p_user_id: userId,
  });
  if (result.error) console.error("Unable to set primary facility", result.error.message);
  revalidatePath("/admin/usuarios");
}

export async function upsertEstablishmentAction(formData: FormData) {
  await requireAdminContext();
  const id = text(formData, "id").toLowerCase();
  const displayName = text(formData, "displayName");
  if (!id || !displayName) return;
  const supabase = await createExtendedClient();
  const result = await supabase.rpc("admin_upsert_establishment", {
    p_display_name: displayName,
    p_id: id,
    p_is_active: checked(formData, "isActive"),
  });
  if (result.error) console.error("Unable to upsert establishment", result.error.message);
  revalidatePath("/admin/establecimientos");
  revalidatePath("/admin");
}

export async function updateScenarioAction(formData: FormData) {
  await requireAdminContext();
  const scenarioId = text(formData, "scenarioId");
  if (!scenarioId) return;
  const supabase = await createExtendedClient();
  const result = await supabase.rpc("admin_update_scenario", {
    p_difficulty: integer(formData, "difficulty", 1),
    p_is_active: checked(formData, "isActive"),
    p_scenario_id: scenarioId,
    p_xp_reward: integer(formData, "xpReward", 0),
  });
  if (result.error) console.error("Unable to update scenario", result.error.message);
  revalidatePath("/admin/escenarios");
  revalidatePath("/admin");
}

export async function updateTrainingModuleAction(formData: FormData) {
  await requireAdminContext();
  const moduleId = text(formData, "moduleId");
  if (!moduleId) return;
  const supabase = await createExtendedClient();
  const result = await supabase.rpc("admin_update_training_module", {
    p_is_active: checked(formData, "isActive"),
    p_module_id: moduleId,
    p_xp_reward: integer(formData, "xpReward", 0),
  });
  if (result.error) console.error("Unable to update training module", result.error.message);
  revalidatePath("/admin/configuracion");
  revalidatePath("/admin");
}
