import { useState, useId } from "react";

// ── Public types ──────────────────────────────────────────────────────────────

export interface TrendDataPoint {
  value: number;
  timestamp: string; // ISO date string
}

interface Props {
  data: TrendDataPoint[];
  /** CSS color used for the line, dots, and gradient. Default: blue (#3b82f6) */
  color?: string;
  /** Explicit Y-axis minimum. Auto-calculated with padding if omitted. */
  yMin?: number;
  /** Explicit Y-axis maximum. Auto-calculated with padding if omitted. */
  yMax?: number;
  /** Format the value shown in the hover tooltip. Default: String(value) */
  valueFormatter?: (v: number) => string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns a "nice" round step size that produces ~targetLines grid lines. */
function niceStep(range: number, targetLines: number): number {
  const rough = range / targetLines;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough / magnitude;
  const nice = n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10;
  return nice * magnitude;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * TrendChart — generic reusable SVG line chart.
 *
 * Usage:
 *   <TrendChart
 *     data={[{ value: 72, timestamp: "2025-04-01T10:00:00Z" }, ...]}
 *     color="#3b82f6"
 *     yMin={0}
 *     yMax={100}
 *     valueFormatter={(v) => `${v} pts`}
 *   />
 *
 * Features:
 *   - Smooth catmull-rom bezier curve
 *   - Gradient area fill under the line
 *   - Auto or fixed Y-axis with "nice" grid lines and labels
 *   - Smart-density X-axis date + time labels (local timezone)
 *   - Hover dots with score tooltip
 *   - Supports multiple instances on the same page (unique SVG IDs via useId)
 */
export default function TrendChart({
  data,
  color = "#3b82f6",
  yMin: yMinProp,
  yMax: yMaxProp,
  valueFormatter = String,
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  // useId gives a stable, page-unique ID so multiple charts don't share the same gradient.
  const uid = useId().replace(/:/g, "");

  // Need at least 2 points to draw a line.
  if (data.length < 2) return null;

  // ── Layout constants ──────────────────────────────────────────────────────
  const W = 560, H = 168;
  const padL = 34, padR = 10, padT = 16, padB = 42;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // ── Y axis range ──────────────────────────────────────────────────────────
  const values = data.map((d) => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const autoPad = (dataMax - dataMin) * 0.12 || 5;
  const yMin = yMinProp ?? Math.max(0, dataMin - autoPad);
  const yMax = yMaxProp ?? dataMax + autoPad;
  const yRange = yMax - yMin || 1;

  // ── Coordinate helpers ────────────────────────────────────────────────────
  const n = data.length;
  const toX = (i: number) =>
    padL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const toY = (v: number) =>
    padT + chartH - ((v - yMin) / yRange) * chartH;

  const points = values.map((v, i) => ({ x: toX(i), y: toY(v) }));

  // ── Smooth path (catmull-rom → cubic bezier) ──────────────────────────────
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
    ` L ${points[n - 1].x.toFixed(2)} ${H - padB}` +
    ` L ${points[0].x.toFixed(2)} ${H - padB} Z`;

  // ── Grid line values ──────────────────────────────────────────────────────
  const step = niceStep(yRange, 4);
  const gridStart = Math.ceil(yMin / step) * step;
  const gridValues: number[] = [];
  for (let v = gridStart; v <= yMax + step * 0.01; v += step) {
    gridValues.push(Math.round(v * 1000) / 1000);
  }

  const gradId = `trendGrad_${uid}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: H }}
      aria-label="Trend chart"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* ── Grid lines + Y-axis labels ──────────────────────────────────── */}
      {gridValues.map((v) => {
        const y = toY(v);
        return (
          <g key={v}>
            <line
              x1={padL} y1={y} x2={W - padR} y2={y}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeWidth="1"
              strokeDasharray="3 4"
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

      {/* ── Area fill ──────────────────────────────────────────────────── */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* ── Line ───────────────────────────────────────────────────────── */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Dots + hit zones + tooltips ─────────────────────────────────── */}
      {points.map((p, i) => {
        const isHovered = hovered === i;
        const ttW = 42, ttH = 22;
        const ttX = Math.max(padL, Math.min(p.x - ttW / 2, W - padR - ttW));
        const ttY = p.y - ttH - 7;

        return (
          <g
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Invisible hit zone */}
            <circle cx={p.x} cy={p.y} r={14} fill="transparent" style={{ cursor: "pointer" }} />

            {/* Halo on hover */}
            {isHovered && (
              <circle cx={p.x} cy={p.y} r={8} fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="5" />
            )}

            {/* Dot */}
            <circle
              cx={p.x} cy={p.y}
              r={isHovered ? 5 : 3.5}
              fill={color}
              stroke="white"
              strokeWidth="2"
            />

            {/* Tooltip */}
            {isHovered && (
              <>
                <rect x={ttX} y={ttY} width={ttW} height={ttH} rx="5" fill={color} fillOpacity="0.9" />
                <text
                  x={ttX + ttW / 2} y={ttY + 15}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="white"
                >
                  {valueFormatter(values[i])}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* ── X-axis date + time labels (local timezone, smart density) ──── */}
      {points.map((p, i) => {
        const step = Math.ceil(n / 5);
        const show = n <= 6 || i === 0 || i === n - 1 || i % step === 0;
        if (!show) return null;
        const d = new Date(data[i].timestamp);
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
