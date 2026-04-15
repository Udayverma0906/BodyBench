import WidgetShell from "../WidgetShell";
import type { StatData, WidgetLayoutProps } from "../../../types/widget";

// ── Color map ─────────────────────────────────────────────────────────────────

const COLOR = {
  default: { value: "text-gray-900 dark:text-white",      delta_pos: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400", delta_neg: "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400" },
  green:   { value: "text-green-600 dark:text-green-400", delta_pos: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400", delta_neg: "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400" },
  blue:    { value: "text-blue-600 dark:text-blue-400",   delta_pos: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400", delta_neg: "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400" },
  amber:   { value: "text-amber-500 dark:text-amber-400", delta_pos: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400", delta_neg: "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400" },
  red:     { value: "text-red-500 dark:text-red-400",     delta_pos: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400", delta_neg: "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400" },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props extends WidgetLayoutProps {
  title: string;
  subtitle?: string;
  data: StatData | null;
  /** Shown while data is loading */
  loading?: boolean;
}

/**
 * StatWidget — displays a single prominent number with an optional delta badge.
 *
 * Usage:
 *   <StatWidget
 *     title="Best Score"
 *     data={{ value: 87, unit: "pts", color: "green" }}
 *     colSpan={1}
 *   />
 */
export default function StatWidget({ title, subtitle, data, loading, colSpan, rowSpan }: Props) {
  const colors = COLOR[data?.color ?? "default"];

  return (
    <WidgetShell title={title} subtitle={subtitle} colSpan={colSpan} rowSpan={rowSpan}>
      {loading || !data ? (
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="w-6 h-6 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Main value */}
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-extrabold leading-none ${colors.value}`}>
              {data.value}
            </span>
            {data.unit && (
              <span className="text-sm text-gray-400 dark:text-gray-500">{data.unit}</span>
            )}
          </div>

          {/* Delta badge */}
          {data.delta && (
            <span
              className={[
                "self-start text-xs font-semibold px-2 py-0.5 rounded-full",
                data.delta.value >= 0 ? colors.delta_pos : colors.delta_neg,
              ].join(" ")}
            >
              {data.delta.value >= 0 ? "+" : ""}{data.delta.value} {data.delta.vs}
            </span>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
