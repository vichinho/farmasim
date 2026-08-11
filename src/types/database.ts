export type ProfileRole = "learner" | "supervisor" | "admin";
export type ProgressStatus = "not_started" | "in_progress" | "completed";
export type ScenarioNodeType = "dialogue" | "choice" | "feedback" | "result";

export interface Database {
  public: {
    Tables: {
      achievements: {
        Row: { id: string; name: string; description: string; icon: string; xp_reward: number; created_at: string };
        Insert: { id?: string; name: string; description: string; icon: string; xp_reward?: number; created_at?: string };
        Update: { id?: string; name?: string; description?: string; icon?: string; xp_reward?: number; created_at?: string };
        Relationships: [];
      };
      lessons: {
        Row: { id: string; module_id: string; title: string; description: string; content: string; duration_minutes: number; xp_reward: number; sort_order: number; created_at: string };
        Insert: { id?: string; module_id: string; title: string; description?: string; content?: string; duration_minutes: number; xp_reward?: number; sort_order: number; created_at?: string };
        Update: { id?: string; module_id?: string; title?: string; description?: string; content?: string; duration_minutes?: number; xp_reward?: number; sort_order?: number; created_at?: string };
        Relationships: [];
      };
      modules: {
        Row: { id: string; title: string; description: string; sort_order: number; difficulty: number; xp_reward: number; is_active: boolean; created_at: string };
        Insert: { id?: string; title: string; description?: string; sort_order: number; difficulty: number; xp_reward?: number; is_active?: boolean; created_at?: string };
        Update: { id?: string; title?: string; description?: string; sort_order?: number; difficulty?: number; xp_reward?: number; is_active?: boolean; created_at?: string };
        Relationships: [];
      };
      profiles: {
        Row: { id: string; full_name: string; avatar_url: string | null; role: ProfileRole; xp: number; level: number; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string; avatar_url?: string | null; role?: ProfileRole; xp?: number; level?: number; created_at?: string; updated_at?: string };
        Update: { id?: string; full_name?: string; avatar_url?: string | null; role?: ProfileRole; xp?: number; level?: number; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      scenario_choices: {
        Row: { id: string; node_id: string; text: string; next_node_id: string | null; is_correct: boolean; feedback: string; xp_reward: number; sort_order: number; created_at: string };
        Insert: { id?: string; node_id: string; text: string; next_node_id?: string | null; is_correct?: boolean; feedback?: string; xp_reward?: number; sort_order: number; created_at?: string };
        Update: { id?: string; node_id?: string; text?: string; next_node_id?: string | null; is_correct?: boolean; feedback?: string; xp_reward?: number; sort_order?: number; created_at?: string };
        Relationships: [];
      };
      scenario_nodes: {
        Row: { id: string; scenario_id: string; type: ScenarioNodeType; character_name: string | null; text: string; image_url: string | null; sort_order: number; created_at: string };
        Insert: { id?: string; scenario_id: string; type: ScenarioNodeType; character_name?: string | null; text?: string; image_url?: string | null; sort_order: number; created_at?: string };
        Update: { id?: string; scenario_id?: string; type?: ScenarioNodeType; character_name?: string | null; text?: string; image_url?: string | null; sort_order?: number; created_at?: string };
        Relationships: [];
      };
      scenarios: {
        Row: { id: string; module_id: string; title: string; description: string; difficulty: number; xp_reward: number; initial_node_id: string | null; is_active: boolean; created_at: string };
        Insert: { id?: string; module_id: string; title: string; description?: string; difficulty: number; xp_reward?: number; initial_node_id?: string | null; is_active?: boolean; created_at?: string };
        Update: { id?: string; module_id?: string; title?: string; description?: string; difficulty?: number; xp_reward?: number; initial_node_id?: string | null; is_active?: boolean; created_at?: string };
        Relationships: [];
      };
      simulation_attempts: {
        Row: { id: string; user_id: string; scenario_id: string; score: number; correct_answers: number; incorrect_answers: number; xp_earned: number; started_at: string; completed_at: string | null };
        Insert: { id?: string; user_id: string; scenario_id: string; score?: number; correct_answers?: number; incorrect_answers?: number; xp_earned?: number; started_at?: string; completed_at?: string | null };
        Update: { id?: string; user_id?: string; scenario_id?: string; score?: number; correct_answers?: number; incorrect_answers?: number; xp_earned?: number; started_at?: string; completed_at?: string | null };
        Relationships: [];
      };
      user_achievements: {
        Row: { user_id: string; achievement_id: string; unlocked_at: string };
        Insert: { user_id: string; achievement_id: string; unlocked_at?: string };
        Update: { user_id?: string; achievement_id?: string; unlocked_at?: string };
        Relationships: [];
      };
      user_module_progress: {
        Row: { id: string; user_id: string; module_id: string; status: ProgressStatus; progress_percentage: number; completed_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; module_id: string; status?: ProgressStatus; progress_percentage?: number; completed_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; module_id?: string; status?: ProgressStatus; progress_percentage?: number; completed_at?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      profile_role: ProfileRole;
      progress_status: ProgressStatus;
      scenario_node_type: ScenarioNodeType;
    };
    CompositeTypes: Record<string, never>;
  };
}
