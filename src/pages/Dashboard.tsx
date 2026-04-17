import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import StatWidget from "../components/dashboard/widgets/StatWidget";
import TrendWidget from "../components/dashboard/widgets/TrendWidget";
import BarWidget from "../components/dashboard/widgets/BarWidget";
import { useDashboardData } from "../hooks/useDashboardData";

export default function Dashboard() {
  const { user } = useAuth();
  const data = useDashboardData(user?.id ?? "");

  const { loading, totalAssessments, latestScore, bestScore, avgScore } = data;

  // Delta: latest vs previous is computed from the time-series
  const series = data.scoreTimeSeries;
  const prevScore = series.length >= 2 ? series[series.length - 2].value : null;
  const latestDelta =
    latestScore !== null && prevScore !== null
      ? latestScore - prevScore
      : null;

  const bmiSeries = data.bmiTimeSeries;
  const latestBmi = bmiSeries.length > 0 ? bmiSeries[bmiSeries.length - 1].value : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your fitness at a glance
          </p>
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
            subtitle="Percentage of max points per category, averaged across all assessments"
            loading={loading}
            data={data.avgBreakdown}
            colSpan={4}
          />

        </DashboardGrid>
      </div>
    </div>
  );
}
