import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import Navbar from "../components/layout/Navbar";
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

// ── Score Trend Chart ─────────────────────────────────────────────────────────

function ScoreTrendChart({ assessments }: { assessments: Assessment[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const W = 560, H = 168;
  const padL = 30, padR = 10, padT = 16, padB = 42;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const scores = assessments.map((a) => a.score);
  const n = scores.length;

  const toX = (i: number) =>
    padL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const toY = (s: number) =>
    padT + chartH - (s / 100) * chartH;

  const points = scores.map((s, i) => ({ x: toX(i), y: toY(s) }));

  // Smooth curve via catmull-rom → cubic bezier conversion
  let linePath = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(n - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    linePath += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  const areaPath =
    linePath +
    ` L ${points[n - 1].x.toFixed(2)} ${H - padB} L ${points[0].x.toFixed(2)} ${H - padB} Z`;

  const gridYValues = [0, 25, 50, 75, 100];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: 168 }}
      aria-label="Score trend chart"
    >
      <defs>
        <linearGradient id="scoreTrendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {gridYValues.map((v) => {
        const y = toY(v);
        const isEdge = v === 0 || v === 100;
        return (
          <g key={v}>
            <line
              x1={padL} y1={y}
              x2={W - padR} y2={y}
              stroke="currentColor"
              strokeOpacity={isEdge ? 0.12 : 0.07}
              strokeWidth="1"
              strokeDasharray={isEdge ? undefined : "3 4"}
            />
            <text
              x={padL - 5} y={y + 4}
              textAnchor="end"
              fontSize="9"
              className="fill-gray-400 dark:fill-gray-600"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#scoreTrendGrad)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots, hit areas, tooltips */}
      {points.map((p, i) => {
        const isHovered = hovered === i;
        // Clamp tooltip so it doesn't overflow left/right edges
        const ttW = 36, ttH = 22;
        const ttX = Math.max(padL, Math.min(p.x - ttW / 2, W - padR - ttW));
        const ttY = p.y - ttH - 7;

        return (
          <g
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Invisible large hit zone */}
            <circle cx={p.x} cy={p.y} r={14} fill="transparent" style={{ cursor: "pointer" }} />

            {/* Halo ring */}
            {isHovered && (
              <circle
                cx={p.x} cy={p.y} r={8}
                fill="none"
                stroke="#3b82f6"
                strokeOpacity="0.25"
                strokeWidth="5"
              />
            )}

            {/* Main dot */}
            <circle
              cx={p.x} cy={p.y}
              r={isHovered ? 5 : 3.5}
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
            />

            {/* Tooltip */}
            {isHovered && (
              <>
                <rect
                  x={ttX} y={ttY}
                  width={ttW} height={ttH}
                  rx="5" ry="5"
                  fill="#1d4ed8"
                />
                <text
                  x={ttX + ttW / 2} y={ttY + 15}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="white"
                >
                  {scores[i]}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* X-axis date + time labels — smart density, two lines */}
      {points.map((p, i) => {
        const step = Math.ceil(n / 5);
        const show = n <= 6 || i === 0 || i === n - 1 || i % step === 0;
        if (!show) return null;
        const d = new Date(assessments[i].taken_at);
        const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const timeLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        return (
          <text
            key={i}
            x={p.x} y={H - 22}
            textAnchor="middle"
            fontSize="9"
            className="fill-gray-400 dark:fill-gray-500"
          >
            <tspan x={p.x} dy="0">{dateLabel}</tspan>
            <tspan x={p.x} dy="12">{timeLabel}</tspan>
          </text>
        );
      })}
    </svg>
  );
}

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

  // Oldest → newest for the chart
  const chartAssessments = [...assessments].reverse();

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
        {!loading && assessments.length >= 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            {/* Card header */}
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

            <ScoreTrendChart assessments={chartAssessments} />
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
