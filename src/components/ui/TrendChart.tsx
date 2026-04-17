import { useState, useId } from "react";

// ── Public types ──────────────────────────────────────────────────────────────

export interface TrendDataPoint {
  value: number;
  timestamp: string; // ISO date string
}

interface Props {
  data: TrendDataPoint[];
  /** CSS color used for the line, dots, and gradient. Default: indigo (#6366f1) */
  color?: string;
  /** Explicit Y-axis minimum. Auto-calculated with padding if omitted. */
  yMin?: number;
  /** Explicit Y-axis maximum. Auto-calculated with padding if omitted. */
  yMax?: number;
  /** Format the value shown in the hover tooltip. Default: String(value) */
  valueFormatter?: (v: number) => string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function niceStep(range: number, targetLines: number): number {
  const rough = range / targetLines;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough / magnitude;
  const nice = n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10;
  return nice * magnitude;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrendChart({
  data,
  color = "#6366f1",
  yMin: yMinProp,
  yMax: yMaxProp,
  valueFormatter = String,
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const uid = useId().replace(/:/g, "");

  if (data.length < 2) return null;

  // ── Layout ────────────────────────────────────────────────────────────────
  const W = 560, H = 180;
  const padL = 36, padR = 12, padT = 20, padB = 46;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // ── Y axis ────────────────────────────────────────────────────────────────
  const values = data.map((d) => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const autoPad = (dataMax - dataMin) * 0.15 || 5;
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

  // ── Grid lines ────────────────────────────────────────────────────────────
  const step = niceStep(yRange, 4);
  const gridStart = Math.ceil(yMin / step) * step;
  const gridValues: number[] = [];
  for (let v = gridStart; v <= yMax + step * 0.01; v += step) {
    gridValues.push(Math.round(v * 1000) / 1000);
  }

  // ── X-axis label indices (pixel-gap based, no overlap) ───────────────────
  // Each label is ~54px wide at font-size 9. Keep at least 58px between centers.
  const MIN_LABEL_GAP = 58;
  const labelIndices: number[] = [0];
  for (let i = 1; i < n; i++) {
    const prev = labelIndices[labelIndices.length - 1];
    if (points[i].x - points[prev].x >= MIN_LABEL_GAP) {
      labelIndices.push(i);
    }
  }
  // Always include the last point; replace the previous shown if too close
  if (labelIndices[labelIndices.length - 1] !== n - 1) {
    const prev = labelIndices[labelIndices.length - 1];
    if (points[n - 1].x - points[prev].x < MIN_LABEL_GAP) {
      labelIndices[labelIndices.length - 1] = n - 1;
    } else {
      labelIndices.push(n - 1);
    }
  }
  const labelSet = new Set(labelIndices);

  // ── Tooltip geometry ──────────────────────────────────────────────────────
  const TT_W = 90, TT_H = 44;

  const gradId   = `trendGrad_${uid}`;
  const shadowId = `trendShadow_${uid}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: H }}
      aria-label="Trend chart"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.25" />
        </filter>
      </defs>

      {/* ── Grid lines + Y-axis labels ──────────────────────────────────── */}
      {gridValues.map((v) => {
        const y = toY(v);
        return (
          <g key={v}>
            <line
              x1={padL} y1={y} x2={W - padR} y2={y}
              stroke="currentColor"
              strokeOpacity="0.07"
              strokeWidth="1"
              strokeDasharray="4 5"
            />
            <text
              x={padL - 6} y={y + 4}
              textAnchor="end"
              fontSize="9.5"
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

      {/* ── Crosshair + dots + tooltips ─────────────────────────────────── */}
      {points.map((p, i) => {
        const isHovered = hovered === i;
        const d = new Date(data[i].timestamp);

        // Tooltip position: clamp so it never clips left/right edge
        const ttX = Math.max(padL, Math.min(p.x - TT_W / 2, W - padR - TT_W));
        // Show above the dot; flip below if clearance is tight; hard-clamp to SVG bounds
        const ttAboveY = p.y - TT_H - 10;
        const ttBelowY = p.y + 12;
        const rawTtY = ttAboveY >= padT + 6 ? ttAboveY : ttBelowY;
        const ttY = Math.max(2, Math.min(rawTtY, H - TT_H - 2));

        return (
          <g
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Vertical crosshair */}
            {isHovered && (
              <line
                x1={p.x} y1={padT}
                x2={p.x} y2={H - padB}
                stroke={color}
                strokeOpacity="0.2"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}

            {/* Invisible hit zone */}
            <circle cx={p.x} cy={p.y} r={14} fill="transparent" style={{ cursor: "pointer" }} />

            {/* Halo on hover */}
            {isHovered && (
              <circle cx={p.x} cy={p.y} r={9} fill={color} fillOpacity="0.12" />
            )}

            {/* Dot */}
            <circle
              cx={p.x} cy={p.y}
              r={isHovered ? 5.5 : 3.5}
              fill={isHovered ? "white" : color}
              stroke={color}
              strokeWidth={isHovered ? 2.5 : 2}
              filter={isHovered ? `url(#${shadowId})` : undefined}
            />

            {/* Tooltip card */}
            {isHovered && (
              <g>
                {/* Shadow rect */}
                <rect
                  x={ttX} y={ttY}
                  width={TT_W} height={TT_H}
                  rx="7"
                  fill={color}
                  fillOpacity="0.95"
                  filter={`url(#${shadowId})`}
                />
                {/* Value */}
                <text
                  x={ttX + TT_W / 2} y={ttY + 17}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill="white"
                >
                  {valueFormatter(values[i])}
                </text>
                {/* Date · Time */}
                <text
                  x={ttX + TT_W / 2} y={ttY + 34}
                  textAnchor="middle"
                  fontSize="9"
                  fill="white"
                  fillOpacity="0.75"
                >
                  {fmtDate(d)} · {fmtTime(d)}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* ── X-axis labels (pixel-gap culled, no overlap) ─────────────────── */}
      {points.map((p, i) => {
        if (!labelSet.has(i)) return null;
        const d = new Date(data[i].timestamp);
        return (
          <text
            key={i}
            textAnchor="middle"
            fontSize="9.5"
            className="fill-gray-400 dark:fill-gray-500"
          >
            <tspan x={p.x} y={H - 26}>{fmtDate(d)}</tspan>
            <tspan x={p.x} dy="13">{fmtTime(d)}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
