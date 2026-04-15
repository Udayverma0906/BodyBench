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

export interface Profile {
  id: string;
  role: "superadmin" | "admin" | "user";
  admin_id: string | null;   // which admin manages this user; null = no admin
  join_code: string | null;  // admins only — short code clients enter to link themselves
  created_at: string;
}

export interface ScoringTier {
  threshold: number;
  points: number;
}

export interface FieldConfig {
  id: string;
  admin_id: string | null;      // null = global system default; otherwise the owning admin's user id
  user_id: string | null;       // legacy column — kept for backwards compat, use admin_id instead
  label: string;
  field_key: string;            // stable identifier — NEVER rename after creation (breaks form_data JSONB)
  section: "personal" | "strength" | "endurance";
  field_type: "number";         // reserved for future: 'select' | 'text'
  placeholder: string | null;
  description: string | null;   // help text shown below the input
  unit: string | null;
  min_value: number | null;
  max_value: number | null;
  step_value: number;
  required: boolean;
  lower_is_better: boolean;     // true for metrics like jog time or resting HR
  scoring_tiers: ScoringTier[]; // evaluated top-to-bottom, first match wins; must have ≥ 1 tier
  max_points: number;           // max score contribution (= max of all tier points)
  visible: boolean;
  is_deleted: boolean;          // soft delete — row is never hard-deleted to preserve historical scoring
  sort_order: number;
  created_at: string;
}

export interface TrainerRequest {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
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
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Pick<Profile, "admin_id" | "join_code">>;  // role changes via Supabase dashboard only
      };
      field_configs: {
        Row: FieldConfig;
        Insert: Omit<FieldConfig, "id" | "created_at" | "user_id">;
        Update: Partial<Omit<FieldConfig, "id" | "admin_id" | "user_id" | "field_key" | "created_at">>;
      };
    };
  };
}
