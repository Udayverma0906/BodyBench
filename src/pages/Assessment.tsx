import { useState } from "react";
import InputField from "../components/forms/InputField";
import Button from "../components/ui/Button";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";
import { useFieldConfigs } from "../hooks/useFieldConfigs";
import type { AssessmentForm } from "../types/assessment";
import type { FieldConfig } from "../types/database";

interface Props {
  onSubmit: (data: AssessmentForm, configs: FieldConfig[]) => void;
  onBack: () => void;
}

// ─── Section metadata for dynamic form ───────────────────────────────────────
const SECTION_META: Record<FieldConfig["section"], { heading: string; note?: string }> = {
  personal:  { heading: "Body Stats", note: "Used to adjust strength scores for body weight." },
  strength:  { heading: "Strength" },
  endurance: { heading: "Core & Endurance" },
};

// ─── Hardcoded fallback (used when no field configs are configured in the DB) ──
const FIELD_GROUPS = [
  {
    heading: "Body Stats",
    note: "Used to adjust strength scores for body weight.",
    fields: [
      { key: "weight", label: "Weight (kg)",   step: 0.1, min: 1,   placeholder: "e.g. 70"  },
      { key: "height", label: "Height (cm)",   step: 0.1, min: 50,  placeholder: "e.g. 175" },
    ],
  },
  {
    heading: "Strength",
    fields: [
      { key: "pushups", label: "Push-ups", step: 1, min: 0, placeholder: "e.g. 20" },
      { key: "pullups", label: "Pull-ups", step: 1, min: 0, placeholder: "e.g. 8"  },
      { key: "squats",  label: "Squats",   step: 1, min: 0, placeholder: "e.g. 30" },
    ],
  },
  {
    heading: "Core & Endurance",
    fields: [
      { key: "plank",   label: "Plank (seconds)",         step: 1,   min: 1,   placeholder: "e.g. 60" },
      { key: "situps",  label: "Sit-ups (1 min)",         step: 1,   min: 0,   placeholder: "e.g. 30" },
      { key: "jogTime", label: "1 km Jog Time (minutes)", step: 0.1, min: 0.1, placeholder: "e.g. 6"  },
    ],
  },
  {
    heading: "Flexibility & Recovery",
    fields: [
      { key: "flexibility", label: "Sit-and-Reach (cm)",       step: 0.5, min: -50, placeholder: "e.g. 10" },
      { key: "restingHR",   label: "Resting Heart Rate (bpm)", step: 1,   min: 20,  placeholder: "e.g. 65" },
    ],
  },
];

const HARDCODED_VALIDATORS: Record<string, (v?: number) => string> = {
  height:      (v) => (v !== undefined && v <= 0              ? "Height must be positive"       : ""),
  weight:      (v) => (v !== undefined && v <= 0              ? "Weight must be positive"       : ""),
  pushups:     (v) => (v !== undefined && v < 0               ? "Can't be negative"             : ""),
  pullups:     (v) => (v !== undefined && v < 0               ? "Can't be negative"             : ""),
  squats:      (v) => (v !== undefined && v < 0               ? "Can't be negative"             : ""),
  plank:       (v) => (v !== undefined && v <= 0              ? "Plank must be positive"        : ""),
  situps:      (v) => (v !== undefined && v < 0               ? "Can't be negative"             : ""),
  jogTime:     (v) => (v !== undefined && v <= 0              ? "Jog time must be positive"     : ""),
  flexibility: (v) => (v !== undefined && v < -50             ? "Enter a valid reach distance"  : ""),
  restingHR:   (v) => (v !== undefined && (v <= 0 || v > 220) ? "Enter a valid heart rate"     : ""),
};

const HARDCODED_EXERCISE_KEYS = [
  "pushups", "pullups", "squats", "plank", "situps", "jogTime", "flexibility", "restingHR",
];

// ─── Validate a single dynamic field against its config ───────────────────────
function validateDynamic(cfg: FieldConfig, val?: number): string {
  if (cfg.required && val === undefined) return `${cfg.label} is required`;
  if (val !== undefined && cfg.min_value !== null && val < cfg.min_value)
    return `Minimum is ${cfg.min_value}`;
  if (val !== undefined && cfg.max_value !== null && val > cfg.max_value)
    return `Maximum is ${cfg.max_value}`;
  return "";
}

// ─── Loading skeleton card ────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm p-6 animate-pulse border-l-4 border-l-indigo-500/30">
      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
      <div className="grid sm:grid-cols-2 gap-5">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-12 bg-gray-100 dark:bg-gray-900 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Assessment({ onSubmit, onBack }: Props) {
  const { profile, user, isAdmin } = useAuth();
  // Admins see their own configured fields (admin_id = user.id).
  // Regular users see their assigned admin's fields via profile.admin_id.
  const adminId = isAdmin ? user?.id : profile?.admin_id;
  const { configs, loading: configsLoading } = useFieldConfigs(adminId);

  const [form, setForm]           = useState<AssessmentForm>({});
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // True once loading is done and there is at least one configured field.
  const useDynamic = !configsLoading && configs.length > 0;

  const updateField = (key: string, value: number | null) => {
    const val = value ?? undefined;
    setForm((prev) => ({ ...prev, [key]: val }));

    let err = "";
    if (useDynamic) {
      const cfg = configs.find((c) => c.field_key === key);
      if (cfg) err = validateDynamic(cfg, val);
    } else {
      err = HARDCODED_VALIDATORS[key]?.(val) ?? "";
    }
    setErrors((prev) => ({ ...prev, [key]: err }));
  };

  const validateAll = (): boolean => {
    let newErrors: Record<string, string> = {};

    if (useDynamic) {
      for (const cfg of configs) {
        newErrors[cfg.field_key] = validateDynamic(cfg, form[cfg.field_key]);
      }
      const hasAny = configs.some((c) => form[c.field_key] !== undefined);
      if (!hasAny)
        newErrors["_form"] = "Fill in at least one field to calculate your score.";
    } else {
      newErrors = Object.fromEntries(
        Object.keys(HARDCODED_VALIDATORS).map((key) => [
          key,
          HARDCODED_VALIDATORS[key](form[key]),
        ])
      );
      const hasAny = HARDCODED_EXERCISE_KEYS.some((k) => form[k] !== undefined);
      if (!hasAny)
        newErrors["_form"] = "Fill in at least one exercise field to calculate your score.";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === "");
  };

  const handleSubmit = () => {
    if (submitting || !validateAll()) return;
    setSubmitting(true);
    onSubmit(form, useDynamic ? configs : []);
  };

  // Group dynamic configs by section (skip empty sections)
  const dynamicSections = (["personal", "strength", "endurance"] as const)
    .map((section) => ({
      ...SECTION_META[section],
      fields: configs.filter((c) => c.section === section),
    }))
    .filter((s) => s.fields.length > 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar onBack={onBack} />

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Fitness Assessment
          </h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Fill in what you can — every field is optional. Your score is calculated
            from the metrics you provide.
          </p>
          {/* Progress strip */}
          <div className="mt-4 h-1 w-full bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full w-0 transition-all duration-500" />
          </div>
        </div>

        <div className="space-y-6">
          {/* ── Loading skeleton ── */}
          {configsLoading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

          {/* ── Dynamic form (DB-configured fields) ── */}
          {!configsLoading && useDynamic &&
            dynamicSections.map(({ heading, note, fields }) => (
              <div
                key={heading}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm p-6 border-l-4 border-l-indigo-500/50"
              >
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    {heading}
                  </h3>
                  {note && (
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-600">{note}</p>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  {fields.map((cfg) => (
                    <InputField
                      key={cfg.field_key}
                      label={cfg.label + (cfg.unit ? ` (${cfg.unit})` : "")}
                      value={form[cfg.field_key]}
                      onChange={(v) => updateField(cfg.field_key, v)}
                      error={errors[cfg.field_key]}
                      step={cfg.step_value}
                      min={cfg.min_value ?? undefined}
                      max={cfg.max_value ?? undefined}
                      placeholder={cfg.placeholder ?? undefined}
                    />
                  ))}
                </div>
              </div>
            ))
          }

          {/* ── Hardcoded fallback (no DB configs) ── */}
          {!configsLoading && !useDynamic &&
            FIELD_GROUPS.map(({ heading, note, fields }) => (
              <div
                key={heading}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm p-6 border-l-4 border-l-indigo-500/50"
              >
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    {heading}
                  </h3>
                  {note && (
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-600">{note}</p>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  {fields.map(({ key, label, step, min, placeholder }) => (
                    <InputField
                      key={key}
                      label={label}
                      value={form[key]}
                      onChange={(v) => updateField(key, v)}
                      error={errors[key]}
                      step={step}
                      min={min}
                      placeholder={placeholder}
                    />
                  ))}
                </div>
              </div>
            ))
          }

          {/* ── Form-level error ── */}
          {errors["_form"] && (
            <p className="text-sm text-red-500 dark:text-red-400 text-center">
              {errors["_form"]}
            </p>
          )}

          {!configsLoading && (
            <Button fullWidth onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Calculating…" : "Calculate Score"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
