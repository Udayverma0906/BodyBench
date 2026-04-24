import type { AssessmentForm } from "../types/assessment";
import type { FieldConfig } from "../types/database";

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
 * Falls back to the last tier's points when nothing matched.
 */
function pickTier(value: number, { tiers, lowerIsBetter = false }: MetricConfig): number {
  for (const tier of tiers) {
    if (lowerIsBetter ? value <= tier.threshold : value >= tier.threshold) {
      return tier.points;
    }
  }
  return tiers[tiers.length - 1].points;
}

// ─── Hardcoded scoring config (used when no fieldConfigs supplied) ─────────────

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
};

// Hardcoded field keys that get weight-adjusted in the fallback path.
const HARDCODED_STRENGTH_KEYS = new Set(["pushups", "pullups", "squats"]);

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

/**
 * @param data        — form values keyed by field_key (or the hardcoded keys)
 * @param fieldConfigs — visible, non-deleted FieldConfig rows from the DB.
 *                       When provided (and non-empty) dynamic tiers are used;
 *                       when omitted or empty the hardcoded SCORING is the fallback.
 */
export function calculateScore(
  data: AssessmentForm,
  fieldConfigs?: FieldConfig[]
): {
  total: number;
  category: string;
  breakdown: ScoreBreakdown[];
} {
  const weightFactor = data.weight ? data.weight / REFERENCE_WEIGHT_KG : 1;

  type RawMetric = { label: string; earned: number; max: number };

  // ── Dynamic path (DB-configured fields) ────────────────────────────────────
  if (fieldConfigs && fieldConfigs.length > 0) {
    const metrics: RawMetric[] = [];

    for (const cfg of fieldConfigs) {
      const rawVal = data[cfg.field_key];
      if (rawVal === undefined) continue;
      if (cfg.section === "personal") continue;  // personal fields are adjustments, not scored
      if (cfg.max_points <= 0) continue;   // field contributes nothing to score

      // Strength fields are weight-adjusted; all other sections are raw.
      const value =
        cfg.section === "strength" && data.weight
          ? Math.round(rawVal * weightFactor)
          : rawVal;

      metrics.push({
        label:  cfg.label,
        earned: pickTier(value, { tiers: cfg.scoring_tiers, lowerIsBetter: cfg.lower_is_better }),
        max:    cfg.max_points,
      });
    }

    const totalEarned = metrics.reduce((sum, m) => sum + m.earned, 0);
    const totalMax    = metrics.reduce((sum, m) => sum + m.max,    0);
    const total       = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
    const category    = CATEGORIES.find((c) => total >= c.min)?.label ?? "Needs Improvement";
    const breakdown   = metrics.map((m) => ({ label: m.label, score: m.earned, max: m.max }));

    return { total, category, breakdown };
  }

  // ── Hardcoded fallback ──────────────────────────────────────────────────────
  const HARDCODED_LABELS: Record<string, string> = {
    jogTime:     "Endurance",
    pushups:     "Push-ups",
    pullups:     "Pull-ups",
    squats:      "Squats",
    plank:       "Plank",
    situps:      "Sit-ups",
    flexibility: "Flexibility",
    restingHR:   "Recovery",
  };

  const raw: (RawMetric | null)[] = Object.entries(SCORING).map(([key, cfg]) => {
    const rawVal = data[key];
    if (rawVal === undefined) return null;

    const value = HARDCODED_STRENGTH_KEYS.has(key) && data.weight
      ? Math.round(rawVal * weightFactor)
      : rawVal;

    return {
      label:  HARDCODED_LABELS[key] ?? key,
      earned: pickTier(value, cfg),
      max:    Math.max(...cfg.tiers.filter((t) => isFinite(t.threshold)).map((t) => t.points),
                       cfg.tiers[0].points),
    };
  });

  const metrics = raw.filter((m): m is RawMetric => m !== null);
  const totalEarned = metrics.reduce((sum, m) => sum + m.earned, 0);
  const totalMax    = metrics.reduce((sum, m) => sum + m.max,    0);
  const total       = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
  const category    = CATEGORIES.find((c) => total >= c.min)?.label ?? "Needs Improvement";
  const breakdown   = metrics.map((m) => ({ label: m.label, score: m.earned, max: m.max }));

  return { total, category, breakdown };
}
