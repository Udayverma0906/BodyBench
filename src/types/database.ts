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
  full_name: string | null;
  role: "superadmin" | "admin" | "user";
  admin_id: string | null;   // which admin manages this user; null = no admin
  join_code: string | null;  // admins only — short code clients enter to link themselves
  gym_name: string | null;
  gym_lat: number | null;
  gym_lng: number | null;
  trainer_joined_at: string | null;
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
  gym_name: string | null;
  gym_lat: number | null;
  gym_lng: number | null;
  created_at: string;
}

// ── Gym / My Gym feature ───────────────────────────────────────────────────────

/** Returned by get_gym_clients() RPC */
export interface GymClient {
  user_id: string;
  email: string;
  full_name: string | null;
  trainer_joined_at: string | null;
  latest_score: number | null;
  latest_category: string | null;
  latest_taken_at: string | null;
  total_assessments: number;
  latest_bmi: number | null;
}

/** Returned by get_trainer_gym() RPC — called by clients */
export interface TrainerGym {
  trainer_id: string;
  trainer_name: string | null;
  trainer_email: string | null;
  gym_name: string | null;
  gym_lat: number | null;
  gym_lng: number | null;
  trainer_joined_at: string | null;
}

/** Returned by get_all_gyms() RPC — superadmin */
export interface GymInfo {
  trainer_id: string;
  trainer_name: string | null;
  email: string;
  gym_name: string | null;
  gym_lat: number | null;
  gym_lng: number | null;
  client_count: number;
}

/** Returned by get_all_users_admin() RPC — superadmin */
export interface AdminUser {
  user_id: string;
  email: string;
  full_name: string | null;
  user_role: "user" | "admin";
  trainer_id: string | null;
  trainer_name: string | null;
  trainer_joined_at: string | null;
  latest_score: number | null;
  latest_category: string | null;
  latest_taken_at: string | null;
  total_assessments: number;
  latest_bmi: number | null;
  score_history: number[] | null;
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
        Update: Partial<Omit<Profile, "id" | "role" | "created_at">>;  // role changes via Supabase dashboard only
      };
      field_configs: {
        Row: FieldConfig;
        Insert: Omit<FieldConfig, "id" | "created_at" | "user_id">;
        Update: Partial<Omit<FieldConfig, "id" | "admin_id" | "user_id" | "field_key" | "created_at">>;
      };
    };
  };
}
