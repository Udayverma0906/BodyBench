import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import Navbar from "../components/layout/Navbar";
import TrendChart from "../components/ui/TrendChart";
import type { Assessment } from "../types/database";
import type { ScoreBreakdown } from "../utils/calculateScore";

// ── Category styles ───────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { color: string; badge: string }> = {
  Excellent:           { color: "text-green-500 dark:text-green-400",  badge: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" },
  Good:                { color: "text-blue-600 dark:text-blue-400",    badge: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" },
  Average:             { color: "text-amber-500 dark:text-amber-400",  badge: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" },
  "Needs Improvement": { color: "text-red-500 dark:text-red-400",      badge: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" },
};
const FALLBACK_STYLE = CATEGORY_STYLES["Good"];

// ── Date formatter ────────────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// ── Assessment card ───────────────────────────────────────────────────────────

function AssessmentCard({ a }: { a: Assessment }) {
  const style = CATEGORY_STYLES[a.category] ?? FALLBACK_STYLE;
  const breakdown = a.breakdown as ScoreBreakdown[];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex gap-5 items-start">
      {/* Score circle */}
      <div className="shrink-0 flex flex-col items-center gap-1.5">
        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${style.color} border-current`}>
          <span className="text-xl font-extrabold text-gray-900 dark:text-white leading-none">
            {a.score}
          </span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
          {a.category}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
          {dateFmt.format(new Date(a.taken_at))}
        </p>

        {/* Breakdown bars */}
        <div className="space-y-2">
          {breakdown.map(({ label, score: s, max }) => {
            const pct = Math.round((s / max) * 100);
            return (
              <div key={label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-500 dark:text-gray-400">{label}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {s}<span className="text-gray-400">/{max}</span>
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-1.5 bg-blue-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("assessments")
      .select("*")
      .eq("user_id", user.id)
      .order("taken_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setAssessments(data as Assessment[]);
        setLoading(false);
      });
  }, [user]);

  // Map to TrendChart's data format (oldest → newest)
  const chartData = [...assessments]
    .reverse()
    .map((a) => ({ value: a.score, timestamp: a.taken_at }));

  const latest = assessments[0]?.score;
  const prev   = assessments[1]?.score;
  const delta  = latest !== undefined && prev !== undefined ? latest - prev : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Assessment History
          </h1>
          <button
            onClick={() => navigate("/assessment")}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
          >
            New Assessment
          </button>
        </div>

        {/* Score trend card */}
        {!loading && chartData.length >= 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Score Trend
              </p>
              <div className="flex items-center gap-2.5">
                {delta !== null && (
                  <span
                    className={[
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      delta >= 0
                        ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400",
                    ].join(" ")}
                  >
                    {delta >= 0 ? "+" : ""}{delta} vs prev
                  </span>
                )}
                <div className="text-right leading-none">
                  <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {latest}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-0.5">
                    / 100
                  </span>
                </div>
              </div>
            </div>

            <TrendChart data={chartData} yMin={0} yMax={100} />
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          </div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-1">
              No assessments yet
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Complete your first assessment to see your history here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((a) => (
              <AssessmentCard key={a.id} a={a} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
