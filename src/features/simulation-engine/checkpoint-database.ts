import type { Database as GeneratedDatabase, Json } from "@/types/database";

type SimulationCheckpointTable = {
  Row: {
    id: string;
    user_id: string;
    session_id: string;
    scenario_definition_id: string;
    scenario_definition_version: number;
    checkpoint_version: number;
    checkpoint: Json;
    saved_at: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    session_id: string;
    scenario_definition_id: string;
    scenario_definition_version: number;
    checkpoint_version: number;
    checkpoint: Json;
    saved_at: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    session_id?: string;
    scenario_definition_id?: string;
    scenario_definition_version?: number;
    checkpoint_version?: number;
    checkpoint?: Json;
    saved_at?: string;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};

/**
 * Temporary extension around the generated Supabase Database type.
 *
 * Once the checkpoint migration is applied and `supabase gen types` is run,
 * this file can be removed in favour of the regenerated canonical type.
 */
export type SimulationCheckpointDatabase = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Tables"> & {
    Tables: GeneratedDatabase["public"]["Tables"] & {
      simulation_checkpoints: SimulationCheckpointTable;
    };
  };
};
