import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import StatWidget from "../components/dashboard/widgets/StatWidget";
import TrendWidget from "../components/dashboard/widgets/TrendWidget";
import BarWidget from "../components/dashboard/widgets/BarWidget";
import { useDashboardData, type DateRange } from "../hooks/useDashboardData";

// ── Date range picker ─────────────────────────────────────────────────────────

const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: "Today",   value: "today" },
  { label: "1 Week",  value: "7d"    },
  { label: "30 Days", value: "30d"   },
  { label: "90 Days", value: "90d"   },
];

function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
      {DATE_RANGES.map(({ label, value: v }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={[
            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            value === v
              ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const data = useDashboardData(user?.id ?? "", false, dateRange);

  const { loading, totalAssessments, latestScore, bestScore, avgScore } = data;

  const series = data.scoreTimeSeries;
  const prevScore = series.length >= 2 ? series[series.length - 2].value : null;
  const latestDelta =
    latestScore !== null && prevScore !== null ? latestScore - prevScore : null;

  const bmiSeries = data.bmiTimeSeries;
  const latestBmi = bmiSeries.length > 0 ? bmiSeries[bmiSeries.length - 1].value : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* Page header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your fitness at a glance
            </p>
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        <DashboardGrid>

          {/* ── Row 1: stat cards ───────────────────────────────────────── */}

          <StatWidget
            title="Assessments"
            subtitle="Total taken"
            loading={loading}
            data={{ value: totalAssessments, color: "blue" }}
            colSpan={1}
          />

          <StatWidget
            title="Latest Score"
            subtitle="Most recent"
            loading={loading}
            data={
              latestScore !== null
                ? {
                    value: latestScore,
                    unit: "/ 100",
                    color: "default",
                    delta: latestDelta !== null
                      ? { value: latestDelta, vs: "vs prev" }
                      : undefined,
                  }
                : { value: "—" }
            }
            colSpan={1}
          />

          <StatWidget
            title="Best Score"
            subtitle="All time high"
            loading={loading}
            data={
              bestScore !== null
                ? { value: bestScore, unit: "/ 100", color: "green" }
                : { value: "—" }
            }
            colSpan={1}
          />

          <StatWidget
            title="Avg Score"
            subtitle="Across all sessions"
            loading={loading}
            data={
              avgScore !== null
                ? { value: avgScore, unit: "/ 100", color: "amber" }
                : { value: "—" }
            }
            colSpan={1}
          />

          {/* ── Row 2: score trend ──────────────────────────────────────── */}

          <TrendWidget
            title="Score Trend"
            subtitle="Overall fitness score over time"
            loading={loading}
            data={data.scoreTimeSeries}
            yMin={0}
            yMax={100}
            colSpan={4}
          />

          {/* ── Row 3: BMI trend ───────────────────────────────────────── */}

          {!loading && bmiSeries.length > 0 && (
            <TrendWidget
              title="BMI Trend"
              subtitle={`Body Mass Index over time · Latest: ${latestBmi!.toFixed(1)}`}
              loading={loading}
              data={bmiSeries}
              color="#22c55e"
              valueFormatter={v => v.toFixed(1)}
              colSpan={4}
            />
          )}

          {/* ── Row 4: breakdown bar chart ──────────────────────────────── */}

          <BarWidget
            title="Avg Score by Metric"
            subtitle="Percentage of max points per category, averaged across selected period"
            loading={loading}
            data={data.avgBreakdown}
            colSpan={4}
          />

        </DashboardGrid>
      </div>
    </div>
  );
}
