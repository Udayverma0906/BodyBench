import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Assessment } from "../types/database";
import type { ScoreBreakdown } from "../utils/calculateScore";
import type { TimeSeriesPoint, CategoryPoint } from "../types/widget";

// ── Date range ────────────────────────────────────────────────────────────────

export type DateRange = "today" | "7d" | "30d" | "90d";

export function dateRangeToISO(range: DateRange): string {
  const now = new Date();
  switch (range) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    case "7d":  return new Date(now.getTime() -  7 * 86_400_000).toISOString();
    case "30d": return new Date(now.getTime() - 30 * 86_400_000).toISOString();
    case "90d": return new Date(now.getTime() - 90 * 86_400_000).toISOString();
  }
}

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
 * @param userId     The user whose assessments to load.
 * @param useRpc     When true, uses get_client_assessments() RPC (trainer/admin view).
 * @param dateRange  Optional range filter: 'today' | '7d' | '30d' | '90d'.
 *                   When omitted, all assessments are included.
 *
 * Usage:
 *   const data = useDashboardData(user.id);                    // own dashboard, all time
 *   const data = useDashboardData(user.id, false, '30d');      // own dashboard, last 30 days
 *   const data = useDashboardData(client.id, true);            // trainer viewing client
 */
export function useDashboardData(
  userId: string,
  useRpc = false,
  dateRange?: DateRange,
): DashboardData {
  const [state, setState] = useState<DashboardData>(EMPTY);

  useEffect(() => {
    if (!userId) return;

    let active = true;
    setState(EMPTY);

    const since = dateRange ? dateRangeToISO(dateRange) : undefined;

    // Build query — apply DB-level date filter for direct table queries
    let query;
    if (useRpc) {
      query = supabase.rpc("get_client_assessments", { p_user_id: userId });
    } else {
      let q = supabase
        .from("assessments")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("taken_at", { ascending: true });
      if (since) q = q.gte("taken_at", since);
      query = q;
    }

    query.then(({ data, error }) => {
        if (!active) return;
        if (error || !data) {
          setState((s) => ({ ...s, loading: false }));
          return;
        }

        let rows = (data as Assessment[]).sort(
          (a, b) => a.taken_at.localeCompare(b.taken_at)
        );

        // RPC doesn't support server-side date filtering — apply client-side
        if (useRpc && since) {
          rows = rows.filter((r) => r.taken_at >= since);
        }

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

    return () => { active = false; };
  }, [userId, useRpc, dateRange]);

  return state;
}
