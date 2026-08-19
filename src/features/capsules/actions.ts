"use server";

import { revalidatePath } from "next/cache";

import { requireSupervisorContext } from "@/features/supervision/access";
import { createExtendedClient } from "@/lib/supabase/server-untyped";

const capsuleStatuses = new Set(["draft", "reviewed", "published", "archived"]);
const contentTypes = new Set(["text", "image", "pdf", "link"]);

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "archivo";
}

export async function createCapsuleAction(formData: FormData) {
  const context = await requireSupervisorContext();
  const facilityId = text(formData, "facilityId");
  const title = text(formData, "title");
  const summary = text(formData, "summary");
  const category = text(formData, "category") || "general";
  const contentType = text(formData, "contentType");
  const content = text(formData, "content");
  const linkUrl = text(formData, "linkUrl");
  const relatedCompetencyIds = formData.getAll("relatedCompetencyIds").filter((value): value is string => typeof value === "string");
  const relatedMedicationIds = text(formData, "relatedMedicationIds").split(",").map((value) => value.trim()).filter(Boolean);
  const file = formData.get("file");

  if (!title || !facilityId || !contentTypes.has(contentType)) return;
  if (context.role !== "admin" && !context.facilityIds.includes(facilityId)) return;

  const supabase = await createExtendedClient();
  let imagePath: string | null = null;
  let pdfPath: string | null = null;

  if (file instanceof File && file.size > 0) {
    const objectPath = `${facilityId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const upload = await supabase.storage.from("educational-capsules").upload(objectPath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (upload.error) {
      console.error("Unable to upload capsule file", upload.error.message);
      return;
    }
    if (contentType === "image") imagePath = objectPath;
    if (contentType === "pdf") pdfPath = objectPath;
  }

  if (
    (contentType === "text" && !content)
    || (contentType === "link" && !linkUrl)
    || (contentType === "image" && !imagePath)
    || (contentType === "pdf" && !pdfPath)
  ) return;

  const result = await supabase.from("educational_capsules").insert({
    author_id: context.userId,
    category,
    content: content || null,
    content_type: contentType,
    facility_id: facilityId,
    image_path: imagePath,
    link_url: linkUrl || null,
    pdf_path: pdfPath,
    related_competency_ids: relatedCompetencyIds,
    related_medication_ids: relatedMedicationIds,
    status: "draft",
    summary: summary || null,
    title,
  });
  if (result.error) console.error("Unable to create educational capsule", result.error.message);
  revalidatePath("/supervision/capsulas");
}

export async function setCapsuleStatusAction(formData: FormData) {
  const context = await requireSupervisorContext();
  const capsuleId = text(formData, "capsuleId");
  const status = text(formData, "status");
  if (!capsuleId || !capsuleStatuses.has(status)) return;
  const supabase = await createExtendedClient();
  const patch = status === "reviewed"
    ? { status, reviewer_id: context.userId }
    : { status };
  const result = await supabase.from("educational_capsules").update(patch).eq("id", capsuleId);
  if (result.error) console.error("Unable to update capsule status", result.error.message);
  revalidatePath("/supervision/capsulas");
  revalidatePath("/capsulas");
}

export async function assignCapsuleAction(formData: FormData) {
  const context = await requireSupervisorContext();
  const capsuleId = text(formData, "capsuleId");
  const userId = text(formData, "userId");
  if (!capsuleId || !userId) return;
  const supabase = await createExtendedClient();
  const result = await supabase.from("capsule_assignments").upsert({
    assigned_by: context.userId,
    capsule_id: capsuleId,
    status: "assigned",
    user_id: userId,
  }, { onConflict: "capsule_id,user_id", ignoreDuplicates: true });
  if (result.error) console.error("Unable to assign capsule", result.error.message);
  revalidatePath("/supervision/capsulas");
  revalidatePath(`/supervision/tens/${userId}`);
}

async function currentUserId() {
  const supabase = await createExtendedClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims.sub ?? null };
}

export async function openCapsuleAction(formData: FormData) {
  const assignmentId = text(formData, "assignmentId");
  if (!assignmentId) return;
  const { supabase, userId } = await currentUserId();
  if (!userId) return;
  const result = await supabase.rpc("open_capsule_assignment", { p_assignment_id: assignmentId });
  if (result.error) console.error("Unable to open capsule assignment", result.error.message);
  revalidatePath("/capsulas");
  revalidatePath(`/capsulas/${assignmentId}`);
}

export async function completeCapsuleAction(formData: FormData) {
  const assignmentId = text(formData, "assignmentId");
  if (!assignmentId) return;
  const { supabase, userId } = await currentUserId();
  if (!userId) return;
  const result = await supabase.rpc("complete_capsule_assignment", { p_assignment_id: assignmentId });
  if (result.error) console.error("Unable to complete capsule assignment", result.error.message);
  revalidatePath("/capsulas");
  revalidatePath(`/capsulas/${assignmentId}`);
}
