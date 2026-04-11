import type { AssessmentForm } from "../types/assessment";

const REFERENCE_WEIGHT_KG = 70;

type Tier = { threshold: number; points: number };

interface MetricConfig {
  tiers: Tier[];
  /** Lower values score better (e.g. jog time, age). */
  lowerIsBetter?: boolean;
}

/**
 * Walk tiers in declaration order and return points for the first match.
 * - lowerIsBetter: match when value <= threshold  (tiers: low → high)
 * - default:       match when value >= threshold  (tiers: high → low)
 */
function pickTier(value: number, { tiers, lowerIsBetter = false }: MetricConfig): number {
  for (const tier of tiers) {
    if (lowerIsBetter ? value <= tier.threshold : value >= tier.threshold) {
      return tier.points;
    }
  }
  return tiers[tiers.length - 1].points;
}

// ─── Scoring config ───────────────────────────────────────────────────────────
// To adjust difficulty: edit thresholds/points here — no logic changes needed.

const SCORING: Record<string, MetricConfig> = {
  jogTime: {
    lowerIsBetter: true,
    tiers: [
      { threshold: 5,        points: 30 },
      { threshold: 7,        points: 20 },
      { threshold: Infinity, points: 10 },
    ],
  },
  pushups: {
    tiers: [
      { threshold: 40, points: 20 },
      { threshold: 20, points: 15 },
      { threshold: 0,  points: 10 },
    ],
  },
  squats: {
    tiers: [
      { threshold: 50, points: 15 },
      { threshold: 30, points: 10 },
      { threshold: 0,  points: 5  },
    ],
  },
  plank: {
    tiers: [
      { threshold: 120, points: 20 },
      { threshold: 60,  points: 15 },
      { threshold: 0,   points: 10 },
    ],
  },
  age: {
    lowerIsBetter: true,
    tiers: [
      { threshold: 29,       points: 15 },
      { threshold: 49,       points: 10 },
      { threshold: Infinity, points: 5  },
    ],
  },
};

const CATEGORIES: { min: number; label: string }[] = [
  { min: 81, label: "Excellent"          },
  { min: 61, label: "Good"               },
  { min: 41, label: "Average"            },
  { min: 0,  label: "Needs Improvement"  },
];

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  label: string;
  score: number;
  max: number;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function calculateScore(data: AssessmentForm): {
  total: number;
  category: string;
  breakdown: ScoreBreakdown[];
} {
  // Heavier people lift more absolute force on bodyweight exercises, so their
  // rep count is scaled up relative to the 70 kg reference person.
  const weightFactor = data.weight / REFERENCE_WEIGHT_KG;
  const adjustedPushups = Math.round(data.pushups * weightFactor);
  const adjustedSquats  = Math.round(data.squats  * weightFactor);

  const breakdown: ScoreBreakdown[] = [
    { label: "Endurance", score: pickTier(data.jogTime,    SCORING.jogTime), max: 30 },
    { label: "Push-ups",  score: pickTier(adjustedPushups, SCORING.pushups), max: 20 },
    { label: "Squats",    score: pickTier(adjustedSquats,  SCORING.squats),  max: 15 },
    { label: "Plank",     score: pickTier(data.plank,      SCORING.plank),   max: 20 },
    { label: "Age Bonus", score: pickTier(data.age,        SCORING.age),     max: 15 },
  ];

  const total    = breakdown.reduce((sum, b) => sum + b.score, 0);
  const category = CATEGORIES.find((c) => total >= c.min)?.label ?? "Needs Improvement";

  return { total, category, breakdown };
}
