export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          xp_reward?: number
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: string
          created_at: string
          description: string
          duration_minutes: number
          id: string
          module_id: string
          sort_order: number
          title: string
          xp_reward: number
        }
        Insert: {
          content?: string
          created_at?: string
          description?: string
          duration_minutes: number
          id?: string
          module_id: string
          sort_order: number
          title: string
          xp_reward?: number
        }
        Update: {
          content?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          module_id?: string
          sort_order?: number
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          description: string
          difficulty: number
          id: string
          is_active: boolean
          sort_order: number
          title: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description?: string
          difficulty: number
          id?: string
          is_active?: boolean
          sort_order: number
          title: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: number
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          level: number
          role: Database["public"]["Enums"]["profile_role"]
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          level?: number
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          level?: number
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      scenario_choices: {
        Row: {
          created_at: string
          feedback: string
          id: string
          is_correct: boolean
          next_node_id: string | null
          node_id: string
          sort_order: number
          text: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          feedback?: string
          id?: string
          is_correct?: boolean
          next_node_id?: string | null
          node_id: string
          sort_order: number
          text: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          feedback?: string
          id?: string
          is_correct?: boolean
          next_node_id?: string | null
          node_id?: string
          sort_order?: number
          text?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "scenario_choices_next_node_id_fkey"
            columns: ["next_node_id"]
            isOneToOne: false
            referencedRelation: "scenario_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_choices_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "scenario_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_nodes: {
        Row: {
          character_name: string | null
          created_at: string
          id: string
          image_url: string | null
          scenario_id: string
          sort_order: number
          text: string
          type: Database["public"]["Enums"]["scenario_node_type"]
        }
        Insert: {
          character_name?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          scenario_id: string
          sort_order: number
          text?: string
          type: Database["public"]["Enums"]["scenario_node_type"]
        }
        Update: {
          character_name?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          scenario_id?: string
          sort_order?: number
          text?: string
          type?: Database["public"]["Enums"]["scenario_node_type"]
        }
        Relationships: [
          {
            foreignKeyName: "scenario_nodes_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          created_at: string
          description: string
          difficulty: number
          id: string
          initial_node_id: string | null
          is_active: boolean
          module_id: string
          title: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description?: string
          difficulty: number
          id?: string
          initial_node_id?: string | null
          is_active?: boolean
          module_id: string
          title: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: number
          id?: string
          initial_node_id?: string | null
          is_active?: boolean
          module_id?: string
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_initial_node_id_fkey"
            columns: ["initial_node_id"]
            isOneToOne: false
            referencedRelation: "scenario_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_attempts: {
        Row: {
          completed_at: string | null
          correct_answers: number
          id: string
          incorrect_answers: number
          scenario_id: string
          score: number
          started_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number
          id?: string
          incorrect_answers?: number
          scenario_id: string
          score?: number
          started_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number
          id?: string
          incorrect_answers?: number
          scenario_id?: string
          score?: number
          started_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulation_attempts_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          module_id: string
          progress_percentage: number
          status: Database["public"]["Enums"]["progress_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id: string
          progress_percentage?: number
          status?: Database["public"]["Enums"]["progress_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id?: string
          progress_percentage?: number
          status?: Database["public"]["Enums"]["progress_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      profile_role: "learner" | "supervisor" | "admin"
      progress_status: "not_started" | "in_progress" | "completed"
      scenario_node_type: "dialogue" | "choice" | "feedback" | "result"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      profile_role: ["learner", "supervisor", "admin"],
      progress_status: ["not_started", "in_progress", "completed"],
      scenario_node_type: ["dialogue", "choice", "feedback", "result"],
    },
  },
} as const
