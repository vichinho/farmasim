import "server-only";

import { resolveTrainingLevels } from "@/data/training";
import { createClient } from "@/lib/supabase/server";

export async function loadTrainingLevels() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("simulation_attempts")
    .select("level_number")
    .not("completed_at", "is", null)
    .not("level_number", "is", null);

  if (error) {
    console.error("Unable to load training level progress", error.code);
    return resolveTrainingLevels([]);
  }

  return resolveTrainingLevels(
    data.flatMap((attempt) =>
      typeof attempt.level_number === "number" ? [attempt.level_number] : [],
    ),
  );
}
