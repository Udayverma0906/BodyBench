import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import ScoreRing from "../components/ui/ScoreRing";
import type { ScoreBreakdown } from "../utils/calculateScore";

interface Props {
  score: number;
  category: string;
  breakdown: ScoreBreakdown[];
  onRestart: () => void;
}

// Visual identity per category: ring color, badge color, subtitle.
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

export default function Result({ score, category, breakdown, onRestart }: Props) {
  const style = CATEGORY_STYLES[category] ?? FALLBACK_STYLE;

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
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${style.badge}`}
            >
              {category}
            </span>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {style.subtitle}
            </p>
          </div>
        </div>

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
