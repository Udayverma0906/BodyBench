// ── Shared data shapes used by all widgets ────────────────────────────────────

/** A single numeric value with metadata, used by StatWidget. */
export interface StatData {
  value: number | string;
  /** Optional unit label rendered after the value, e.g. "pts" */
  unit?: string;
  /** If provided, renders a +/- badge comparing to a previous value. */
  delta?: { value: number; vs: string };
  color?: "default" | "green" | "blue" | "amber" | "red";
}

/** One point in a time series, used by TrendWidget. */
export interface TimeSeriesPoint {
  value: number;
  timestamp: string; // ISO date string
}

/** One bar in a bar chart, used by BarWidget. */
export interface CategoryPoint {
  label: string;
  value: number;
  /** Used to compute the fill percentage and Y-axis ceiling. */
  max: number;
  /** Optional hex/CSS color. Falls back to widget default. */
  color?: string;
}

// ── Common widget layout props (extend in each widget) ────────────────────────

export interface WidgetLayoutProps {
  /** Number of grid columns this widget occupies (out of 4). Default: 1 */
  colSpan?: 1 | 2 | 3 | 4;
  /** Number of grid rows this widget occupies. Default: 1 */
  rowSpan?: 1 | 2;
}
