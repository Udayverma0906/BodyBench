import { useState } from "react";
import type { AssessmentForm } from "../types/assessment";

type Validator = (v?: number) => string;

// Only validate range when a value is actually provided — no field is required.
const VALIDATORS: Record<keyof AssessmentForm, Validator> = {
  age:         (v) => (v !== undefined && v <= 0          ? "Age must be positive"          : ""),
  height:      (v) => (v !== undefined && v <= 0          ? "Height must be positive"        : ""),
  weight:      (v) => (v !== undefined && v <= 0          ? "Weight must be positive"        : ""),
  pushups:     (v) => (v !== undefined && v < 0           ? "Can't be negative"              : ""),
  pullups:     (v) => (v !== undefined && v < 0           ? "Can't be negative"              : ""),
  squats:      (v) => (v !== undefined && v < 0           ? "Can't be negative"              : ""),
  plank:       (v) => (v !== undefined && v <= 0          ? "Plank must be positive"         : ""),
  situps:      (v) => (v !== undefined && v < 0           ? "Can't be negative"              : ""),
  jogTime:     (v) => (v !== undefined && v <= 0          ? "Jog time must be positive"      : ""),
  flexibility: (v) => (v !== undefined && v < -50         ? "Enter a valid reach distance"   : ""),
  restingHR:   (v) => (v !== undefined && (v <= 0 || v > 220) ? "Enter a valid heart rate"  : ""),
};

// The exercise keys that contribute to the score (weight & height are just helpers).
const EXERCISE_KEYS: (keyof AssessmentForm)[] = [
  "pushups", "pullups", "squats", "plank", "situps", "jogTime", "flexibility", "restingHR",
];

export function useAssessment() {
  const [form, setForm]     = useState<Partial<AssessmentForm>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (name: keyof AssessmentForm, value: number | null) => {
    const val = value ?? undefined;
    setForm((prev) => ({ ...prev, [name]: val }));
    setErrors((prev) => ({ ...prev, [name]: VALIDATORS[name](val) }));
  };

  const validateAll = (): boolean => {
    // Re-run range checks on all filled fields.
    const newErrors = Object.fromEntries(
      (Object.keys(VALIDATORS) as (keyof AssessmentForm)[]).map((name) => [
        name,
        VALIDATORS[name](form[name]),
      ])
    );

    // Require at least one exercise field to have a value.
    const hasAnyExercise = EXERCISE_KEYS.some((k) => form[k] !== undefined);
    if (!hasAnyExercise) {
      newErrors["_form"] = "Fill in at least one exercise field to calculate your score.";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === "");
  };

  return { form, errors, updateField, validateAll };
}
