import { useState } from "react";
import type { AssessmentForm } from "../types/assessment";

export function useAssessment() {
  const [form, setForm] = useState<Partial<AssessmentForm>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (name: keyof AssessmentForm, value: number | null) => {
  const val = value ?? undefined;

  setForm((prev) => ({ ...prev, [name]: val }));

  // 🔥 real-time validation
  validateField(name, val);
};
  const validateField = (name: keyof AssessmentForm, value?: number) => {
  let error = "";

  if (name === "age" && (!value || value <= 0)) error = "Enter valid age";
  if (name === "weight" && (!value || value <= 0)) error = "Enter valid weight";
  if (name === "pushups" && (value === undefined || value < 0)) error = "Invalid pushups";
  if (name === "squats" && (value === undefined || value < 0)) error = "Invalid squats";
  if (name === "plank" && (!value || value <= 0)) error = "Invalid plank time";
  if (name === "jogTime" && (!value || value <= 0)) error = "Invalid jog time";

  setErrors((prev) => ({
    ...prev,
    [name]: error,
  }));
};

  return {
    form,
    errors,
    updateField
  };
}