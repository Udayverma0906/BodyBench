import { useAssessment } from "../hooks/useAssessment";
import InputField from "../components/forms/InputField";

function Assessment() {
  const { form, errors, updateField } = useAssessment();

  const handleSubmit = () => {

    console.log("Valid Data:", form);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Fitness Assessment
        </h2>

        <div className="space-y-5">

          <InputField
            label="Age"
            value={form.age}
            onChange={(v) => updateField("age", v)}
            error={errors.age}
          />

          <InputField
            label="Weight (kg)"
            value={form.weight}
            onChange={(v) => updateField("weight", v)}
            error={errors.weight}
          />

          <InputField
            label="Push-ups"
            value={form.pushups}
            onChange={(v) => updateField("pushups", v)}
            error={errors.pushups}
          />

          <InputField
            label="Squats"
            value={form.squats}
            onChange={(v) => updateField("squats", v)}
            error={errors.squats}
          />

          <InputField
            label="Plank (seconds)"
            value={form.plank}
            onChange={(v) => updateField("plank", v)}
            error={errors.plank}
          />

          <InputField
            label="1km Jog Time (minutes)"
            value={form.jogTime}
            onChange={(v) => updateField("jogTime", v)}
            error={errors.jogTime}
          />

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Calculate Score
          </button>
        </div>
      </div>
    </div>
  );
}

export default Assessment;