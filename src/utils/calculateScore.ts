import type { AssessmentForm } from "../types/assessment";

const REFERENCE_WEIGHT_KG = 70;

type Tier = { threshold: number; points: number };

interface MetricConfig {
  tiers: Tier[];
  /** Lower values score better (e.g. jog time, resting HR). */
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

const SCORING: Record<string, MetricConfig> = {
  jogTime: {
    lowerIsBetter: true,
    tiers: [
      { threshold: 5,        points: 25 },
      { threshold: 7,        points: 17 },
      { threshold: Infinity, points: 8  },
    ],
  },
  pushups: {
    tiers: [
      { threshold: 40, points: 20 },
      { threshold: 20, points: 14 },
      { threshold: 0,  points: 7  },
    ],
  },
  pullups: {
    tiers: [
      { threshold: 15, points: 20 },
      { threshold: 8,  points: 14 },
      { threshold: 0,  points: 7  },
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
      { threshold: 60,  points: 14 },
      { threshold: 0,   points: 7  },
    ],
  },
  situps: {
    tiers: [
      { threshold: 40, points: 15 },
      { threshold: 25, points: 10 },
      { threshold: 0,  points: 5  },
    ],
  },
  flexibility: {
    tiers: [
      { threshold: 15, points: 15 },
      { threshold: 5,  points: 10 },
      { threshold: 0,  points: 5  },
    ],
  },
  restingHR: {
    lowerIsBetter: true,
    tiers: [
      { threshold: 60,       points: 15 },
      { threshold: 72,       points: 10 },
      { threshold: Infinity, points: 5  },
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
  // Use provided weight for strength scaling, else reference body weight.
  const weightFactor = data.weight ? data.weight / REFERENCE_WEIGHT_KG : 1;

  // Build a list of metrics that actually have a value supplied.
  type RawMetric = { label: string; earned: number; max: number } | null;

  const raw: RawMetric[] = [
    data.jogTime  !== undefined
      ? { label: "Endurance",   earned: pickTier(data.jogTime, SCORING.jogTime), max: 25 }
      : null,
    data.pushups  !== undefined
      ? { label: "Push-ups",    earned: pickTier(Math.round(data.pushups * weightFactor), SCORING.pushups), max: 20 }
      : null,
    data.pullups  !== undefined
      ? { label: "Pull-ups",    earned: pickTier(Math.round(data.pullups * weightFactor), SCORING.pullups), max: 20 }
      : null,
    data.squats   !== undefined
      ? { label: "Squats",      earned: pickTier(Math.round(data.squats  * weightFactor), SCORING.squats),  max: 15 }
      : null,
    data.plank    !== undefined
      ? { label: "Plank",       earned: pickTier(data.plank, SCORING.plank), max: 20 }
      : null,
    data.situps   !== undefined
      ? { label: "Sit-ups",     earned: pickTier(data.situps, SCORING.situps), max: 15 }
      : null,
    data.flexibility !== undefined
      ? { label: "Flexibility", earned: pickTier(data.flexibility, SCORING.flexibility), max: 15 }
      : null,
    data.restingHR !== undefined
      ? { label: "Recovery",    earned: pickTier(data.restingHR, SCORING.restingHR), max: 15 }
      : null,
    data.age      !== undefined
      ? { label: "Age Bonus",   earned: pickTier(data.age, SCORING.age), max: 15 }
      : null,
  ];

  const metrics = raw.filter((m): m is NonNullable<RawMetric> => m !== null);

  const totalEarned = metrics.reduce((sum, m) => sum + m.earned, 0);
  const totalMax    = metrics.reduce((sum, m) => sum + m.max,    0);

  // Normalize to 100 so the score is always comparable regardless of which
  // optional fields were filled in.
  const total    = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
  const category = CATEGORIES.find((c) => total >= c.min)?.label ?? "Needs Improvement";

  const breakdown: ScoreBreakdown[] = metrics.map((m) => ({
    label: m.label,
    score: m.earned,
    max:   m.max,
  }));

  return { total, category, breakdown };
}
