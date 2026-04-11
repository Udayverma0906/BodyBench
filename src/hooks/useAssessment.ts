import { useState } from "react";
import type { AssessmentForm } from "../types/assessment";

type Validator = (v?: number) => string;

// Single source of truth for validation rules.
// To change a rule, edit here — validateField and validateAll both use this.
const VALIDATORS: Record<keyof AssessmentForm, Validator> = {
  age:     (v) => (!v || v <= 0             ? "Enter a valid age"      : ""),
  weight:  (v) => (!v || v <= 0             ? "Enter a valid weight"   : ""),
  pushups: (v) => (v === undefined || v < 0 ? "Enter push-up count"   : ""),
  squats:  (v) => (v === undefined || v < 0 ? "Enter squat count"     : ""),
  plank:   (v) => (!v || v <= 0             ? "Enter plank duration"   : ""),
  jogTime: (v) => (!v || v <= 0             ? "Enter jog time"         : ""),
};

export function useAssessment() {
  const [form, setForm]     = useState<Partial<AssessmentForm>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (name: keyof AssessmentForm, value: number | null) => {
    const val = value ?? undefined;
    setForm((prev) => ({ ...prev, [name]: val }));
    setErrors((prev) => ({ ...prev, [name]: VALIDATORS[name](val) }));
  };

  const validateAll = (): boolean => {
    const newErrors = Object.fromEntries(
      (Object.keys(VALIDATORS) as (keyof AssessmentForm)[]).map((name) => [
        name,
        VALIDATORS[name](form[name]),
      ])
    );
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === "");
  };

  return { form, errors, updateField, validateAll };
}
