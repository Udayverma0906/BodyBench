import type { ScoreBreakdown } from "../utils/calculateScore";
import type { AssessmentForm } from "./assessment";

// ── Row shapes (mirror the SQL schema exactly) ────────────────────────────────

export interface Assessment {
  id: string;
  user_id: string;
  score: number;
  category: string;
  breakdown: ScoreBreakdown[];
  form_data: AssessmentForm;
  taken_at: string;
  is_active: boolean;
}

export interface FieldConfig {
  id: string;
  user_id: string | null; // null = global default visible to everyone
  label: string;
  field_key: string;      // stable identifier — never rename after creation
  section: "personal" | "strength" | "endurance";
  placeholder: string | null;
  unit: string | null;
  min_value: number | null;
  max_value: number | null;
  step_value: number;
  visible: boolean;
  sort_order: number;
  created_at: string;
}

// ── Supabase Database generic (passed to createClient<Database>) ──────────────

export interface Database {
  public: {
    Tables: {
      assessments: {
        Row: Assessment;
        Insert: Omit<Assessment, "id" | "taken_at">;
        Update: Partial<Omit<Assessment, "id" | "user_id" | "taken_at">> & { is_active?: boolean };
      };
      field_configs: {
        Row: FieldConfig;
        Insert: Omit<FieldConfig, "id" | "created_at">;
        Update: Partial<Omit<FieldConfig, "id" | "user_id" | "field_key" | "created_at">>;
      };
    };
  };
}
