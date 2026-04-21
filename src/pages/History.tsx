import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import Navbar from "../components/layout/Navbar";
import TrendChart from "../components/ui/TrendChart";
import BasePopup from "../components/ui/BasePopup";
import DeletedAssessmentsPanel from "../components/assessments/DeletedAssessmentsPanel";
import type { Assessment } from "../types/database";
import type { ScoreBreakdown } from "../utils/calculateScore";

// ── Category styles ───────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { color: string; badge: string; border: string; dot: string }> = {
  Excellent:           { color: "text-green-500 dark:text-green-400",   badge: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",   border: "border-l-green-500/70",  dot: "bg-green-500"  },
  Good:                { color: "text-indigo-500 dark:text-indigo-400", badge: "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300", border: "border-l-indigo-500/70", dot: "bg-indigo-500" },
  Average:             { color: "text-amber-500 dark:text-amber-400",   badge: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",   border: "border-l-amber-500/70",  dot: "bg-amber-500"  },
  "Needs Improvement": { color: "text-red-500 dark:text-red-400",       badge: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",           border: "border-l-red-500/70",    dot: "bg-red-500"    },
};
const FALLBACK_STYLE = CATEGORY_STYLES["Good"];

// ── BMI helpers ───────────────────────────────────────────────────────────────

const BMI_LEVELS: { max: number; label: string; badge: string }[] = [
  { max: 18.5, label: "Underweight",    badge: "bg-blue-100   dark:bg-blue-950   text-blue-700   dark:text-blue-400"   },
  { max: 25,   label: "Normal",         badge: "bg-green-100  dark:bg-green-950  text-green-700  dark:text-green-400"  },
  { max: 30,   label: "Overweight",     badge: "bg-amber-100  dark:bg-amber-950  text-amber-700  dark:text-amber-400"  },
  { max: 35,   label: "Obese I",        badge: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400" },
  { max: Infinity, label: "Obese II+",  badge: "bg-red-100    dark:bg-red-950    text-red-700    dark:text-red-400"    },
];

function calcBmi(weight?: number, height?: number) {
  if (!weight || !height || height < 50) return null;
  return weight / Math.pow(height / 100, 2);
}

function getBmiLevel(bmi: number) {
  return BMI_LEVELS.find(l => bmi < l.max) ?? BMI_LEVELS[BMI_LEVELS.length - 1];
}

// ── Date formatter ────────────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// ── Trash icon ────────────────────────────────────────────────────────────────

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ── Assessment card ───────────────────────────────────────────────────────────

function AssessmentCard({
  a,
  onDelete,
}: {
  a: Assessment;
  onDelete: (id: string) => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const style = CATEGORY_STYLES[a.category] ?? FALLBACK_STYLE;
  const breakdown = a.breakdown as ScoreBreakdown[];
  const bmi = calcBmi(a.form_data?.weight, a.form_data?.height);
  const bmiLevel = bmi !== null ? getBmiLevel(bmi) : null;

  return (
    <>
      <div className={`bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm p-5 flex gap-5 items-start group border-l-4 ${style.border}`}>
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
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {dateFmt.format(new Date(a.taken_at))}
            </p>

            {/* Delete button — always visible on mobile, fades in on hover for desktop */}
            <button
              onClick={() => setShowConfirm(true)}
              aria-label="Delete assessment"
              className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <TrashIcon />
            </button>
          </div>

          {/* BMI pill */}
          {bmi !== null && bmiLevel !== null && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-400 dark:text-gray-500">BMI</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {bmi.toFixed(1)}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bmiLevel.badge}`}>
                {bmiLevel.label}
              </span>
            </div>
          )}

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
                  <div className="h-1.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 bg-indigo-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delete confirmation popup */}
      <BasePopup
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Remove Assessment"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          This assessment will be removed from your history and trend graph.
          You can't undo this action.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setShowConfirm(false);
              onDelete(a.id);
            }}
            className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition"
          >
            Remove
          </button>
        </div>
      </BasePopup>
    </>
  );
}

// ── Group assessments by Month Year ──────────────────────────────────────────

const monthFmt = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

function groupByMonth(items: Assessment[]): { label: string; items: Assessment[] }[] {
  const map = new Map<string, Assessment[]>();
  for (const a of items) {
    const key = monthFmt.format(new Date(a.taken_at));
    const bucket = map.get(key) ?? [];
    bucket.push(a);
    map.set(key, bucket);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

// ── Pagination ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 4;

function ChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const listTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    supabase
      .from("assessments")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)          // only active (non-deleted) rows
      .order("taken_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data) setAssessments(data as Assessment[]);
        setLoading(false);
      });
    return () => { active = false; };
  }, [user?.id]);

  // Soft-delete: flip is_active → false, then remove from local state
  const handleDelete = async (id: string) => {
    const { error, count } = await supabase
      .from("assessments")
      .update({ is_active: false }, { count: "exact" })
      .eq("id", id)
      .eq("user_id", user!.id);   // belt-and-suspenders: ensures RLS matches

    if (error) {
      console.error("[handleDelete] Supabase error:", error);
      return;
    }
    if (count === 0) {
      console.warn("[handleDelete] Update ran but 0 rows changed — check RLS UPDATE policy on assessments table.");
      return;
    }
    setAssessments((prev) => prev.filter((a) => a.id !== id));
  };

  // Re-insert a restored assessment in date-descending order
  const handleRestored = (restored: Assessment) => {
    setAssessments((prev) =>
      [...prev, restored].sort(
        (a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime()
      )
    );
  };

  const totalPages  = Math.max(1, Math.ceil(assessments.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const pageItems   = assessments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goToPage = (next: number) => {
    setPage(next);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Map to TrendChart's data format (oldest → newest)
  const chartData = [...assessments]
    .reverse()
    .map((a) => ({ value: a.score, timestamp: a.taken_at }));

  const latest = assessments[0]?.score;
  const prev   = assessments[1]?.score;
  const delta  = latest !== undefined && prev !== undefined ? latest - prev : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Assessment History
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleted(true)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-semibold transition"
            >
              Deleted
            </button>
            <button
              onClick={() => navigate("/assessment")}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
            >
              New
            </button>
          </div>
        </div>

        {/* Score trend card */}
        {!loading && chartData.length >= 2 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm p-5">
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
        <div ref={listTopRef} />
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
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
          <>
            <div className="space-y-8">
              {groupByMonth(pageItems).map(({ label, items }) => (
                <div key={label} className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">
                    {label}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((a) => (
                      <AssessmentCard key={a.id} a={a} onDelete={handleDelete} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center sm:text-left">
                  {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, assessments.length)} of {assessments.length}
                </p>

                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage === 1}
                    aria-label="Previous page"
                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={[
                        "w-7 h-7 rounded-lg text-xs font-semibold transition",
                        p === safePage
                          ? "bg-indigo-600 text-white"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800",
                      ].join(" ")}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage === totalPages}
                    aria-label="Next page"
                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* Deleted assessments panel */}
      <DeletedAssessmentsPanel
        isOpen={showDeleted}
        onClose={() => setShowDeleted(false)}
        userId={user!.id}
        onRestored={handleRestored}
      />
    </div>
  );
}
