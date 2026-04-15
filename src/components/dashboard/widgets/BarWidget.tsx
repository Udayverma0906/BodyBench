import { useState } from "react";
import WidgetShell from "../WidgetShell";
import type { CategoryPoint, WidgetLayoutProps } from "../../../types/widget";

// ── SVG bar chart ─────────────────────────────────────────────────────────────

function BarChart({
  data,
  color = "#3b82f6",
}: {
  data: CategoryPoint[];
  color?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const W = 560, H = 180;
  const padL = 30, padR = 10, padT = 16, padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const n = data.length;
  if (n === 0) return null;

  // All bars share the same ceiling (100 for percentages, or data max)
  const yMax = Math.max(...data.map((d) => d.max));
  const yMin = 0;
  const yRange = yMax - yMin || 1;

  // Bar geometry
  const totalGap   = chartW * 0.3;           // 30% of width reserved for gaps
  const barW       = (chartW - totalGap) / n;
  const gapW       = n > 1 ? totalGap / (n - 1) : 0;
  const barX       = (i: number) => padL + i * (barW + gapW);
  const barH       = (v: number) => ((v - yMin) / yRange) * chartH;
  const barY       = (v: number) => padT + chartH - barH(v);

  // Y grid lines (0, 25, 50, 75, 100 for percentage data)
  const step  = yMax <= 100 ? 25 : Math.ceil(yMax / 4 / 10) * 10;
  const grids: number[] = [];
  for (let v = 0; v <= yMax; v += step) grids.push(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} aria-label="Bar chart">
      {/* Grid lines + Y labels */}
      {grids.map((v) => {
        const y = barY(v);
        return (
          <g key={v}>
            <line
              x1={padL} y1={y} x2={W - padR} y2={y}
              stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="3 4"
            />
            <text
              x={padL - 5} y={y + 4}
              textAnchor="end" fontSize="9"
              className="fill-gray-400 dark:fill-gray-600"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* Bars + tooltips */}
      {data.map((d, i) => {
        const x  = barX(i);
        const h  = barH(d.value);
        const y  = barY(d.value);
        const isHovered = hovered === i;
        const barColor  = d.color ?? color;

        // Tooltip position
        const ttW = 44, ttH = 22;
        const ttX = Math.max(padL, Math.min(x + barW / 2 - ttW / 2, W - padR - ttW));
        const ttY = y - ttH - 6;

        return (
          <g
            key={d.label}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer" }}
          >
            {/* Bar background (full height track) */}
            <rect
              x={x} y={padT} width={barW} height={chartH}
              rx="4"
              fill="currentColor"
              className="text-gray-100 dark:text-gray-700"
            />

            {/* Filled bar */}
            <rect
              x={x} y={y} width={barW} height={h}
              rx="4"
              fill={barColor}
              fillOpacity={isHovered ? 1 : 0.85}
              style={{ transition: "fill-opacity 150ms ease" }}
            />

            {/* Hover tooltip */}
            {isHovered && h > 0 && (
              <>
                <rect x={ttX} y={ttY} width={ttW} height={ttH} rx="5" fill={barColor} fillOpacity="0.9" />
                <text
                  x={ttX + ttW / 2} y={ttY + 15}
                  textAnchor="middle" fontSize="11" fontWeight="bold" fill="white"
                >
                  {d.value}%
                </text>
              </>
            )}

            {/* X-axis label */}
            <text
              x={x + barW / 2} y={H - padB + 14}
              textAnchor="middle" fontSize="9"
              className="fill-gray-400 dark:fill-gray-500"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Widget ────────────────────────────────────────────────────────────────────

interface Props extends WidgetLayoutProps {
  title: string;
  subtitle?: string;
  data: CategoryPoint[];
  loading?: boolean;
  color?: string;
}

/**
 * BarWidget — a dashboard widget that renders a vertical bar chart.
 *
 * Usage:
 *   <BarWidget
 *     title="Avg Score by Metric"
 *     subtitle="Percentage of max points, averaged across all assessments"
 *     data={avgBreakdown}
 *     colSpan={4}
 *   />
 */
export default function BarWidget({ title, subtitle, data, loading, color, colSpan, rowSpan }: Props) {
  return (
    <WidgetShell title={title} subtitle={subtitle} colSpan={colSpan} rowSpan={rowSpan}>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-gray-400 dark:text-gray-500">No data yet.</p>
        </div>
      ) : (
        <BarChart data={data} color={color} />
      )}
    </WidgetShell>
  );
}
