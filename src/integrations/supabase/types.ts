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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      cardio_logs: {
        Row: {
          day: string
          details: Json
          id: string
          user_id: string
        }
        Insert: {
          day: string
          details?: Json
          id?: string
          user_id: string
        }
        Update: {
          day?: string
          details?: Json
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cardio_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_nutrition: {
        Row: {
          day: string
          details: Json
          food_id: string | null
          id: string
          meal: string
          user_id: string
        }
        Insert: {
          day: string
          details?: Json
          food_id?: string | null
          id?: string
          meal: string
          user_id: string
        }
        Update: {
          day?: string
          details?: Json
          food_id?: string | null
          id?: string
          meal?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_nutrition_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_nutrition_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          description: string
          equipment: string
          id: string
          muscle: string
          name: string
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          description?: string
          equipment: string
          id?: string
          muscle: string
          name: string
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          description?: string
          equipment?: string
          id?: string
          muscle?: string
          name?: string
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fatigue_logs: {
        Row: {
          day: string
          details: Json
          id: string
          user_id: string
        }
        Insert: {
          day: string
          details?: Json
          id?: string
          user_id: string
        }
        Update: {
          day?: string
          details?: Json
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fatigue_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          carbs: number
          fat: number
          fiber: number
          id: string
          kcal: number
          name: string
          portion: string
          protein: number
          user_id: string | null
          verified: boolean
        }
        Insert: {
          carbs: number
          fat: number
          fiber?: number
          id?: string
          kcal: number
          name: string
          portion?: string
          protein: number
          user_id?: string | null
          verified?: boolean
        }
        Update: {
          carbs?: number
          fat?: number
          fiber?: number
          id?: string
          kcal?: number
          name?: string
          portion?: string
          protein?: number
          user_id?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "foods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_completions: {
        Row: {
          day: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          day: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          day?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_user_id_fkey"
            columns: ["habit_id", "user_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "habit_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          details: Json
          id: string
          user_id: string
        }
        Insert: {
          details?: Json
          id?: string
          user_id: string
        }
        Update: {
          details?: Json
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_blocks: {
        Row: {
          details: Json
          id: string
          page_id: string
          user_id: string
        }
        Insert: {
          details?: Json
          id?: string
          page_id: string
          user_id: string
        }
        Update: {
          details?: Json
          id?: string
          page_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_blocks_page_id_user_id_fkey"
            columns: ["page_id", "user_id"]
            isOneToOne: false
            referencedRelation: "notes_pages"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "notes_blocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_pages: {
        Row: {
          details: Json
          id: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          details?: Json
          id?: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          details?: Json
          id?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_pages_parent_id_user_id_fkey"
            columns: ["parent_id", "user_id"]
            isOneToOne: false
            referencedRelation: "notes_pages"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "notes_pages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity: number | null
          age: number | null
          body_fat: number | null
          calorie_target: number | null
          carb_target: number | null
          fat_target: number | null
          goal: string | null
          height: number | null
          id: string
          name: string
          onboarded: boolean
          phone: string
          protein_target: number | null
          sex: string | null
          weight: number | null
        }
        Insert: {
          activity?: number | null
          age?: number | null
          body_fat?: number | null
          calorie_target?: number | null
          carb_target?: number | null
          fat_target?: number | null
          goal?: string | null
          height?: number | null
          id: string
          name?: string
          onboarded?: boolean
          phone?: string
          protein_target?: number | null
          sex?: string | null
          weight?: number | null
        }
        Update: {
          activity?: number | null
          age?: number | null
          body_fat?: number | null
          calorie_target?: number | null
          carb_target?: number | null
          fat_target?: number | null
          goal?: string | null
          height?: number | null
          id?: string
          name?: string
          onboarded?: boolean
          phone?: string
          protein_target?: number | null
          sex?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          details: Json
          exercise_id: string | null
          id: string
          user_id: string
          workout_id: string
        }
        Insert: {
          details?: Json
          exercise_id?: string | null
          id?: string
          user_id: string
          workout_id: string
        }
        Update: {
          details?: Json
          exercise_id?: string | null
          id?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_workout_id_user_id_fkey"
            columns: ["workout_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      workouts: {
        Row: {
          day: string
          details: Json
          id: string
          user_id: string
        }
        Insert: {
          day: string
          details?: Json
          id?: string
          user_id: string
        }
        Update: {
          day?: string
          details?: Json
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          day: string
          id: string
          points: number
          source: string
          user_id: string
        }
        Insert: {
          day: string
          id?: string
          points: number
          source: string
          user_id: string
        }
        Update: {
          day?: string
          id?: string
          points?: number
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
