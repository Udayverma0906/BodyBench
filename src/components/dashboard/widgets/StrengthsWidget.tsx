import WidgetShell from "../WidgetShell";
import type { WidgetLayoutProps, CategoryPoint } from "../../../types/widget";

interface Props extends WidgetLayoutProps {
  data: CategoryPoint[];
  loading?: boolean;
}

/**
 * StrengthsWidget — shows top performing fitness categories
 * Displays the categories where the user scores best
 */
export default function StrengthsWidget({
  data,
  loading,
  colSpan,
  rowSpan,
}: Props) {
  const EXCLUDED = new Set(["Age", "Age Bonus"]);

  // Get top 3 categories by value, excluding removed metrics
  const topThree = [...data]
    .filter(d => !EXCLUDED.has(d.label))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const maxValue = Math.max(...topThree.map(d => d.value), 1);

  return (
    <WidgetShell title="Your Strengths" subtitle="Top performing categories" colSpan={colSpan} rowSpan={rowSpan}>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
        </div>
      ) : topThree.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No data yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {topThree.map(({ label, value }, idx) => {
            const percentage = Math.round((value / maxValue) * 100);
            const colors = [
              "from-yellow-400 to-yellow-500",
              "from-gray-400 to-gray-500",
              "from-orange-400 to-orange-500",
            ];
            const badgeColors = [
              "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300",
              "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
              "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
            ];

            return (
              <div key={label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColors[idx]}`}>
                    #{idx + 1}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`h-2 bg-gradient-to-r ${colors[idx]} rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {value.toFixed(0)} / 100
                </p>
              </div>
            );
          })}
        </div>
      )}
    </WidgetShell>
  );
}
