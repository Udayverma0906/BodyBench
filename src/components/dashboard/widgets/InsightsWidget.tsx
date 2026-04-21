import WidgetShell from "../WidgetShell";
import type { WidgetLayoutProps, TimeSeriesPoint } from "../../../types/widget";

interface Props extends WidgetLayoutProps {
  scoreTimeSeries: TimeSeriesPoint[];
  loading?: boolean;
}

export default function InsightsWidget({
  scoreTimeSeries,
  loading,
  colSpan,
  rowSpan,
}: Props) {
  const n = scoreTimeSeries.length;

  let daysActive = 0;
  let scoreImprovement = 0;
  let bestJump = 0;

  if (n >= 2) {
    const first = new Date(scoreTimeSeries[0].timestamp);
    const last  = new Date(scoreTimeSeries[n - 1].timestamp);
    daysActive = Math.floor((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));

    scoreImprovement = scoreTimeSeries[n - 1].value - scoreTimeSeries[0].value;

    for (let i = 1; i < n; i++) {
      const diff = scoreTimeSeries[i].value - scoreTimeSeries[i - 1].value;
      if (diff > bestJump) bestJump = diff;
    }
  }

  const improveFmt = (v: number) => v >= 0 ? `+${v.toFixed(0)}` : `${v.toFixed(0)}`;

  const insights = [
    {
      label: "Sessions",
      value: n,
      unit: "in period",
      desc: "Assessments taken within the selected date range",
      icon: "📊",
      color: "from-blue-700 to-blue-900",
    },
    {
      label: "Best Jump",
      value: bestJump > 0 ? `+${bestJump.toFixed(0)}` : "—",
      unit: bestJump > 0 ? "pts in one session" : "no gains yet",
      desc: "Largest score improvement between any two consecutive sessions",
      icon: "⚡",
      color: "from-purple-700 to-purple-900",
    },
    {
      label: "Days Active",
      value: Math.max(0, daysActive),
      unit: "day span",
      desc: "Days elapsed from your first to your latest session",
      icon: "📅",
      color: "from-green-700 to-green-900",
    },
    {
      label: "Improvement",
      value: n >= 2 ? improveFmt(scoreImprovement) : "—",
      unit: n >= 2 ? "first → latest" : "need 2+ sessions",
      desc: "Overall score change from your first session to the most recent",
      icon: scoreImprovement >= 0 ? "📈" : "📉",
      color: scoreImprovement >= 0 ? "from-emerald-700 to-emerald-900" : "from-amber-700 to-amber-900",
    },
  ];

  return (
    <WidgetShell title="Performance Insights" subtitle="Quick overview of your progress" colSpan={colSpan} rowSpan={rowSpan}>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {insights.map((insight) => (
            <div
              key={insight.label}
              className={`bg-gradient-to-br ${insight.color} p-4 rounded-xl text-white flex flex-col gap-0.5`}
            >
              <div className="text-xl mb-0.5">{insight.icon}</div>
              <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{insight.label}</p>
              <p className="text-2xl font-bold leading-tight">{insight.value}</p>
              <p className="text-xs opacity-70">{insight.unit}</p>
              <p className="text-[10px] opacity-55 mt-1 leading-snug">{insight.desc}</p>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
