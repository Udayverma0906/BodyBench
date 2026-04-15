import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Assessment } from "../types/database";
import type { ScoreBreakdown } from "../utils/calculateScore";
import type { TimeSeriesPoint, CategoryPoint } from "../types/widget";

// ── Output shape ──────────────────────────────────────────────────────────────

export interface DashboardData {
  loading: boolean;
  totalAssessments: number;
  latestScore: number | null;
  bestScore: number | null;
  avgScore: number | null;
  /** Oldest → newest, ready for TrendWidget */
  scoreTimeSeries: TimeSeriesPoint[];
  /** BMI over time — only includes assessments that had weight + height (oldest → newest) */
  bmiTimeSeries: TimeSeriesPoint[];
  /** Distribution of category labels (Excellent, Good, …) */
  categoryDistribution: CategoryPoint[];
  /** Average score per breakdown metric across all assessments */
  avgBreakdown: CategoryPoint[];
}

const EMPTY: DashboardData = {
  loading: true,
  totalAssessments: 0,
  latestScore: null,
  bestScore: null,
  avgScore: null,
  scoreTimeSeries: [],
  bmiTimeSeries: [],
  categoryDistribution: [],
  avgBreakdown: [],
};

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useDashboardData — fetches all active assessments for a user and returns
 * pre-computed slices ready to pass directly into dashboard widgets.
 *
 * Usage:
 *   const data = useDashboardData(user.id);
 *   <StatWidget title="Total" data={{ value: data.totalAssessments }} />
 */
export function useDashboardData(userId: string): DashboardData {
  const [state, setState] = useState<DashboardData>(EMPTY);

  useEffect(() => {
    if (!userId) return;

    setState(EMPTY); // reset on user change

    supabase
      .from("assessments")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("taken_at", { ascending: true }) // oldest first for time-series
      .then(({ data, error }) => {
        if (error || !data) {
          setState((s) => ({ ...s, loading: false }));
          return;
        }

        const rows = data as Assessment[];
        if (rows.length === 0) {
          setState({ ...EMPTY, loading: false });
          return;
        }

        // ── Basic stats ───────────────────────────────────────────────────
        const scores = rows.map((r) => r.score);
        const latestScore = rows[rows.length - 1].score;
        const bestScore   = Math.max(...scores);
        const avgScore    = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

        // ── Time series ───────────────────────────────────────────────────
        const scoreTimeSeries: TimeSeriesPoint[] = rows.map((r) => ({
          value: r.score,
          timestamp: r.taken_at,
        }));

        // ── Category distribution ─────────────────────────────────────────
        const catCount: Record<string, number> = {};
        for (const r of rows) {
          catCount[r.category] = (catCount[r.category] ?? 0) + 1;
        }
        const categoryDistribution: CategoryPoint[] = Object.entries(catCount).map(
          ([label, value]) => ({ label, value, max: rows.length })
        );

        // ── BMI time series ───────────────────────────────────────────────
        const bmiTimeSeries: TimeSeriesPoint[] = rows.flatMap(r => {
          const w = r.form_data?.weight;
          const h = r.form_data?.height;
          if (!w || !h || h < 50) return [];
          return [{ value: w / Math.pow(h / 100, 2), timestamp: r.taken_at }];
        });

        // ── Average breakdown by metric ───────────────────────────────────
        // Accumulate earned + max per label across all assessments
        const metricAcc: Record<string, { totalEarned: number; totalMax: number; count: number }> = {};
        for (const r of rows) {
          const breakdown = r.breakdown as ScoreBreakdown[];
          for (const { label, score: earned, max } of breakdown) {
            if (!metricAcc[label]) metricAcc[label] = { totalEarned: 0, totalMax: 0, count: 0 };
            metricAcc[label].totalEarned += earned;
            metricAcc[label].totalMax    += max;
            metricAcc[label].count       += 1;
          }
        }
        const avgBreakdown: CategoryPoint[] = Object.entries(metricAcc).map(
          ([label, { totalEarned, totalMax }]) => ({
            label,
            // Express as a percentage so bars are comparable across metrics with different max
            value: Math.round((totalEarned / totalMax) * 100),
            max: 100,
          })
        );

        setState({
          loading: false,
          totalAssessments: rows.length,
          latestScore,
          bestScore,
          avgScore,
          scoreTimeSeries,
          bmiTimeSeries,
          categoryDistribution,
          avgBreakdown,
        });
      });
  }, [userId]);

  return state;
}
