import TrendChart from "../../ui/TrendChart";
import WidgetShell from "../WidgetShell";
import type { TimeSeriesPoint, WidgetLayoutProps } from "../../../types/widget";

interface Props extends WidgetLayoutProps {
  title: string;
  subtitle?: string;
  data: TimeSeriesPoint[];
  loading?: boolean;
  color?: string;
  yMin?: number;
  yMax?: number;
  valueFormatter?: (v: number) => string;
}

/**
 * TrendWidget — a dashboard widget that renders a line/area trend chart.
 * Wraps the generic TrendChart component inside a WidgetShell.
 *
 * Requires at least 2 data points; shows an empty state otherwise.
 *
 * Usage:
 *   <TrendWidget
 *     title="Score Trend"
 *     data={scoreTimeSeries}
 *     yMin={0}
 *     yMax={100}
 *     colSpan={4}
 *   />
 */
export default function TrendWidget({
  title,
  subtitle,
  data,
  loading,
  color,
  yMin,
  yMax,
  valueFormatter,
  colSpan,
  rowSpan,
}: Props) {
  return (
    <WidgetShell title={title} subtitle={subtitle} colSpan={colSpan} rowSpan={rowSpan}>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : data.length < 2 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            At least 2 assessments needed to show a trend.
          </p>
        </div>
      ) : (
        <TrendChart
          data={data}
          color={color}
          yMin={yMin}
          yMax={yMax}
          valueFormatter={valueFormatter}
        />
      )}
    </WidgetShell>
  );
}
