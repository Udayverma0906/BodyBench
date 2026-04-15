import { useLocation, Navigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import ScoreRing from "../components/ui/ScoreRing";
import type { ScoreBreakdown } from "../utils/calculateScore";
import type { AssessmentForm } from "../types/assessment";

interface ResultState {
  score: number;
  category: string;
  breakdown: ScoreBreakdown[];
  formData?: AssessmentForm;
}

interface Props {
  onRestart: () => void;
}

// ── Fitness score styles ──────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<
  string,
  { ring: string; badge: string; subtitle: string }
> = {
  Excellent: {
    ring:     "text-green-500 dark:text-green-400",
    badge:    "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400",
    subtitle: "Outstanding fitness level",
  },
  Good: {
    ring:     "text-blue-600 dark:text-blue-400",
    badge:    "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400",
    subtitle: "Above average fitness",
  },
  Average: {
    ring:     "text-amber-500 dark:text-amber-400",
    badge:    "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400",
    subtitle: "Room for improvement",
  },
  "Needs Improvement": {
    ring:     "text-red-500 dark:text-red-400",
    badge:    "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400",
    subtitle: "Focus on building the basics",
  },
};

const FALLBACK_STYLE = CATEGORY_STYLES["Good"];

// ── BMI helpers ───────────────────────────────────────────────────────────────

interface BmiCategory {
  label: string;
  color: string;   // text color for the big number
  badge: string;   // pill classes
}

// Thresholds are upper-exclusive (i.e. bmi < max)
const BMI_CATEGORIES: (BmiCategory & { max: number })[] = [
  {
    max: 18.5,
    label: "Underweight",
    color: "text-blue-500 dark:text-blue-400",
    badge: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400",
  },
  {
    max: 25,
    label: "Normal weight",
    color: "text-green-500 dark:text-green-400",
    badge: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400",
  },
  {
    max: 30,
    label: "Overweight",
    color: "text-amber-500 dark:text-amber-400",
    badge: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  },
  {
    max: 35,
    label: "Obese (Class I)",
    color: "text-orange-500 dark:text-orange-400",
    badge: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400",
  },
  {
    max: Infinity,
    label: "Obese (Class II+)",
    color: "text-red-500 dark:text-red-400",
    badge: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400",
  },
];

function getBmiCategory(bmi: number): BmiCategory {
  return BMI_CATEGORIES.find(c => bmi < c.max) ?? BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
}

// Scale spans 15–40. Returns a percentage (2–98) for the marker dot.
function bmiToMarkerPct(bmi: number): number {
  const pct = ((bmi - 15) / 25) * 100;
  return Math.min(98, Math.max(2, pct));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Result({ onRestart }: Props) {
  const location = useLocation();
  const state = location.state as ResultState | null;

  if (!state) return <Navigate to="/" replace />;

  const { score, category, breakdown, formData } = state;
  const style = CATEGORY_STYLES[category] ?? FALLBACK_STYLE;

  // Compute BMI only when both weight (kg) and height (cm) are present
  const weight = formData?.weight;
  const height = formData?.height;
  const bmi =
    weight && height && height >= 50
      ? weight / Math.pow(height / 100, 2)
      : null;
  const bmiCat = bmi !== null ? getBmiCategory(bmi) : null;
  const markerPct = bmi !== null ? bmiToMarkerPct(bmi) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* ── Score card ── */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Your Fitness Score
          </h2>

          <ScoreRing score={score} max={100} size={180} colorClass={style.ring} />

          <div className="mt-6">
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${style.badge}`}>
              {category}
            </span>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {style.subtitle}
            </p>
          </div>
        </div>

        {/* ── BMI card (only when weight + height were entered) ── */}
        {bmi !== null && bmiCat !== null && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-lg p-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Body Mass Index (BMI)
            </h3>

            {/* Value + badge */}
            <div className="flex items-center gap-4 mb-6">
              <span className={`text-5xl font-bold tabular-nums ${bmiCat.color}`}>
                {bmi.toFixed(1)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${bmiCat.badge}`}>
                {bmiCat.label}
              </span>
            </div>

            {/* Segmented scale bar */}
            <div className="relative mb-1">
              <div className="flex h-3 rounded-full overflow-hidden">
                {/* Underweight  15–18.5 → 14% */}
                <div className="bg-blue-400 dark:bg-blue-500"   style={{ width: "14%" }} />
                {/* Normal       18.5–25 → 26% */}
                <div className="bg-green-400 dark:bg-green-500" style={{ width: "26%" }} />
                {/* Overweight   25–30   → 20% */}
                <div className="bg-amber-400 dark:bg-amber-500" style={{ width: "20%" }} />
                {/* Obese I      30–35   → 20% */}
                <div className="bg-orange-400 dark:bg-orange-500" style={{ width: "20%" }} />
                {/* Obese II+    35–40   → 20% */}
                <div className="bg-red-400 dark:bg-red-500"     style={{ width: "20%" }} />
              </div>

              {/* Marker dot */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-800 dark:border-white shadow-md pointer-events-none"
                style={{ left: `${markerPct}%` }}
              />
            </div>

            {/* Zone labels */}
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-2 select-none">
              <span>Underweight</span>
              <span>Normal</span>
              <span>Overweight</span>
              <span>Obese</span>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              BMI is calculated from your weight and height. It may not reflect muscle mass or body composition.
            </p>
          </div>
        )}

        {/* ── Breakdown card ── */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-lg p-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Score Breakdown
          </h3>

          <div className="space-y-5">
            {breakdown.map(({ label, score: s, max }) => {
              const pct = Math.round((s / max) * 100);
              return (
                <div key={label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {s}{" "}
                      <span className="font-normal text-gray-400">/ {max}</span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-blue-600 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Button fullWidth variant="outline" onClick={onRestart}>
          Take Assessment Again
        </Button>
      </div>
    </div>
  );
}
