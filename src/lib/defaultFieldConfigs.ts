import type { FieldConfig } from "../types/database";

/**
 * Synthetic FieldConfig objects that mirror the hardcoded SCORING / FIELD_GROUPS
 * constants used in Assessment.tsx and calculateScore.ts.
 *
 * These are used as fallback "Standard" fields when no global defaults
 * (admin_id IS NULL) exist in the field_configs table.  IDs are prefixed with
 * "__default_" so they can be recognised as synthetic and never confused with
 * real DB rows.
 */
export const DEFAULT_FIELD_CONFIGS: FieldConfig[] = [
  // ── Personal ────────────────────────────────────────────────────────────────
  {
    id: "__default_age",      admin_id: null, user_id: null,
    label: "Age",             field_key: "age",      section: "personal",
    field_type: "number",     placeholder: "e.g. 25",
    description: null,        unit: null,
    min_value: 1,             max_value: null,       step_value: 1,
    required: false,          lower_is_better: true, visible: true,
    is_deleted: false,        sort_order: 0,         created_at: "",
    scoring_tiers: [
      { threshold: 29,   points: 15 },
      { threshold: 49,   points: 10 },
      { threshold: 9999, points: 5  },
    ],
    max_points: 15,
  },
  {
    id: "__default_weight",   admin_id: null, user_id: null,
    label: "Weight",          field_key: "weight",   section: "personal",
    field_type: "number",     placeholder: "e.g. 70",
    description: "Used to adjust strength scores for body weight",
    unit: "kg",
    min_value: 1,             max_value: null,       step_value: 0.1,
    required: false,          lower_is_better: false, visible: true,
    is_deleted: false,        sort_order: 1,         created_at: "",
    scoring_tiers: [{ threshold: 0, points: 0 }],
    max_points: 0,
  },
  {
    id: "__default_height",   admin_id: null, user_id: null,
    label: "Height",          field_key: "height",   section: "personal",
    field_type: "number",     placeholder: "e.g. 175",
    description: null,        unit: "cm",
    min_value: 50,            max_value: null,       step_value: 0.1,
    required: false,          lower_is_better: false, visible: true,
    is_deleted: false,        sort_order: 2,         created_at: "",
    scoring_tiers: [{ threshold: 0, points: 0 }],
    max_points: 0,
  },

  // ── Strength ─────────────────────────────────────────────────────────────────
  {
    id: "__default_pushups",  admin_id: null, user_id: null,
    label: "Push-ups",        field_key: "pushups",  section: "strength",
    field_type: "number",     placeholder: "e.g. 20",
    description: null,        unit: "reps",
    min_value: 0,             max_value: null,       step_value: 1,
    required: false,          lower_is_better: false, visible: true,
    is_deleted: false,        sort_order: 0,         created_at: "",
    scoring_tiers: [
      { threshold: 40, points: 20 },
      { threshold: 20, points: 14 },
      { threshold: 0,  points: 7  },
    ],
    max_points: 20,
  },
  {
    id: "__default_pullups",  admin_id: null, user_id: null,
    label: "Pull-ups",        field_key: "pullups",  section: "strength",
    field_type: "number",     placeholder: "e.g. 8",
    description: null,        unit: "reps",
    min_value: 0,             max_value: null,       step_value: 1,
    required: false,          lower_is_better: false, visible: true,
    is_deleted: false,        sort_order: 1,         created_at: "",
    scoring_tiers: [
      { threshold: 15, points: 20 },
      { threshold: 8,  points: 14 },
      { threshold: 0,  points: 7  },
    ],
    max_points: 20,
  },
  {
    id: "__default_squats",   admin_id: null, user_id: null,
    label: "Squats",          field_key: "squats",   section: "strength",
    field_type: "number",     placeholder: "e.g. 30",
    description: null,        unit: "reps",
    min_value: 0,             max_value: null,       step_value: 1,
    required: false,          lower_is_better: false, visible: true,
    is_deleted: false,        sort_order: 2,         created_at: "",
    scoring_tiers: [
      { threshold: 50, points: 15 },
      { threshold: 30, points: 10 },
      { threshold: 0,  points: 5  },
    ],
    max_points: 15,
  },

  // ── Endurance ─────────────────────────────────────────────────────────────────
  {
    id: "__default_plank",    admin_id: null, user_id: null,
    label: "Plank",           field_key: "plank",    section: "endurance",
    field_type: "number",     placeholder: "e.g. 60",
    description: null,        unit: "seconds",
    min_value: 1,             max_value: null,       step_value: 1,
    required: false,          lower_is_better: false, visible: true,
    is_deleted: false,        sort_order: 0,         created_at: "",
    scoring_tiers: [
      { threshold: 120, points: 20 },
      { threshold: 60,  points: 14 },
      { threshold: 0,   points: 7  },
    ],
    max_points: 20,
  },
  {
    id: "__default_situps",   admin_id: null, user_id: null,
    label: "Sit-ups (1 min)", field_key: "situps",   section: "endurance",
    field_type: "number",     placeholder: "e.g. 30",
    description: null,        unit: "reps",
    min_value: 0,             max_value: null,       step_value: 1,
    required: false,          lower_is_better: false, visible: true,
    is_deleted: false,        sort_order: 1,         created_at: "",
    scoring_tiers: [
      { threshold: 40, points: 15 },
      { threshold: 25, points: 10 },
      { threshold: 0,  points: 5  },
    ],
    max_points: 15,
  },
  {
    id: "__default_jogTime",  admin_id: null, user_id: null,
    label: "1 km Jog Time",   field_key: "jogTime",  section: "endurance",
    field_type: "number",     placeholder: "e.g. 6",
    description: null,        unit: "minutes",
    min_value: 0.1,           max_value: null,       step_value: 0.1,
    required: false,          lower_is_better: true, visible: true,
    is_deleted: false,        sort_order: 2,         created_at: "",
    scoring_tiers: [
      { threshold: 5,    points: 25 },
      { threshold: 7,    points: 17 },
      { threshold: 9999, points: 8  },
    ],
    max_points: 25,
  },
  {
    id: "__default_flexibility", admin_id: null, user_id: null,
    label: "Sit-and-Reach",   field_key: "flexibility", section: "endurance",
    field_type: "number",     placeholder: "e.g. 10",
    description: null,        unit: "cm",
    min_value: -50,           max_value: null,       step_value: 0.5,
    required: false,          lower_is_better: false, visible: true,
    is_deleted: false,        sort_order: 3,         created_at: "",
    scoring_tiers: [
      { threshold: 15, points: 15 },
      { threshold: 5,  points: 10 },
      { threshold: 0,  points: 5  },
    ],
    max_points: 15,
  },
  {
    id: "__default_restingHR", admin_id: null, user_id: null,
    label: "Resting Heart Rate", field_key: "restingHR", section: "endurance",
    field_type: "number",     placeholder: "e.g. 65",
    description: null,        unit: "bpm",
    min_value: 20,            max_value: 220,        step_value: 1,
    required: false,          lower_is_better: true, visible: true,
    is_deleted: false,        sort_order: 4,         created_at: "",
    scoring_tiers: [
      { threshold: 60,   points: 15 },
      { threshold: 72,   points: 10 },
      { threshold: 9999, points: 5  },
    ],
    max_points: 15,
  },
];
