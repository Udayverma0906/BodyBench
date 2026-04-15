import { useAssessment } from "../hooks/useAssessment";
import InputField from "../components/forms/InputField";
import Button from "../components/ui/Button";
import Navbar from "../components/layout/Navbar";
import type { AssessmentForm } from "../types/assessment";

interface Props {
  onSubmit: (data: AssessmentForm) => void;
  onBack: () => void;
}

// All fields are optional — fill what you can measure.
const FIELD_GROUPS = [
  {
    heading: "Body Stats",
    note: "Used to adjust strength scores for body weight.",
    fields: [
      { key: "age"    as const, label: "Age",           step: 1,   min: 1,   placeholder: "e.g. 25"  },
      { key: "weight" as const, label: "Weight (kg)",   step: 0.1, min: 1,   placeholder: "e.g. 70"  },
      { key: "height" as const, label: "Height (cm)",   step: 0.1, min: 50,  placeholder: "e.g. 175" },
    ],
  },
  {
    heading: "Strength",
    fields: [
      { key: "pushups" as const, label: "Push-ups",   step: 1, min: 0, placeholder: "e.g. 20" },
      { key: "pullups" as const, label: "Pull-ups",   step: 1, min: 0, placeholder: "e.g. 8"  },
      { key: "squats"  as const, label: "Squats",     step: 1, min: 0, placeholder: "e.g. 30" },
    ],
  },
  {
    heading: "Core & Endurance",
    fields: [
      { key: "plank"   as const, label: "Plank (seconds)",           step: 1,   min: 1,   placeholder: "e.g. 60"  },
      { key: "situps"  as const, label: "Sit-ups (1 min)",           step: 1,   min: 0,   placeholder: "e.g. 30"  },
      { key: "jogTime" as const, label: "1 km Jog Time (minutes)",   step: 0.1, min: 0.1, placeholder: "e.g. 6"   },
    ],
  },
  {
    heading: "Flexibility & Recovery",
    fields: [
      { key: "flexibility" as const, label: "Sit-and-Reach (cm)",          step: 0.5, min: -50, placeholder: "e.g. 10"  },
      { key: "restingHR"   as const, label: "Resting Heart Rate (bpm)",    step: 1,   min: 20,  placeholder: "e.g. 65"  },
    ],
  },
];

export default function Assessment({ onSubmit, onBack }: Props) {
  const { form, errors, updateField, validateAll } = useAssessment();

  const handleSubmit = () => {
    if (!validateAll()) return;
    onSubmit(form as AssessmentForm);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
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
        </div>

        <div className="space-y-6">
          {FIELD_GROUPS.map(({ heading, note, fields }) => (
            <div
              key={heading}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6"
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
          ))}

          {/* Form-level error (e.g. nothing filled in) */}
          {errors["_form"] && (
            <p className="text-sm text-red-500 dark:text-red-400 text-center">
              {errors["_form"]}
            </p>
          )}

          <Button fullWidth onClick={handleSubmit}>
            Calculate Score
          </Button>
        </div>
      </div>
    </div>
  );
}
