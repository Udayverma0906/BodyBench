import { useAssessment } from "../hooks/useAssessment";
import InputField from "../components/forms/InputField";
import Button from "../components/ui/Button";
import Navbar from "../components/layout/Navbar";
import type { AssessmentForm } from "../types/assessment";

interface Props {
  onSubmit: (data: AssessmentForm) => void;
  onBack: () => void;
}

// Fields are grouped by category so the form reads as sections, not a wall of inputs.
const FIELD_GROUPS = [
  {
    heading: "Personal Info",
    fields: [
      { key: "age"     as const, label: "Age",              step: 1,   min: 1,   placeholder: "e.g. 25"  },
      { key: "weight"  as const, label: "Weight (kg)",      step: 0.1, min: 20,  placeholder: "e.g. 70"  },
    ],
  },
  {
    heading: "Strength",
    fields: [
      { key: "pushups" as const, label: "Push-ups",         step: 1,   min: 0,   placeholder: "e.g. 20"  },
      { key: "squats"  as const, label: "Squats",           step: 1,   min: 0,   placeholder: "e.g. 30"  },
    ],
  },
  {
    heading: "Core & Endurance",
    fields: [
      { key: "plank"   as const, label: "Plank (seconds)",           step: 1,   min: 1,   placeholder: "e.g. 60" },
      { key: "jogTime" as const, label: "1 km Jog Time (minutes)",   step: 0.1, min: 0.1, placeholder: "e.g. 6"  },
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
            Fill in your details below to calculate your score.
          </p>
        </div>

        <div className="space-y-6">
          {FIELD_GROUPS.map(({ heading, fields }) => (
            <div
              key={heading}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6"
            >
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-5">
                {heading}
              </h3>
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

          <Button fullWidth onClick={handleSubmit}>
            Calculate Score
          </Button>
        </div>
      </div>
    </div>
  );
}
