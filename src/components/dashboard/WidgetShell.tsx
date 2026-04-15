import type { ReactNode } from "react";
import type { WidgetLayoutProps } from "../../types/widget";

// ── Column span → Tailwind class ─────────────────────────────────────────────
// Must be full strings so Tailwind's JIT scanner picks them up.
const COL_SPAN = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
} as const;

const ROW_SPAN = {
  1: "row-span-1",
  2: "row-span-2",
} as const;

interface Props extends WidgetLayoutProps {
  title: string;
  subtitle?: string;
  /** Extra classes applied to the outer card div */
  className?: string;
  children: ReactNode;
}

/**
 * WidgetShell — the visual card wrapper used by every dashboard widget.
 *
 * Handles:
 *   - CSS grid placement (colSpan / rowSpan)
 *   - Consistent card styling (bg, border, padding, rounded)
 *   - Title + optional subtitle header
 *
 * Usage:
 *   <WidgetShell title="Score Trend" colSpan={4}>
 *     <TrendChart ... />
 *   </WidgetShell>
 */
export default function WidgetShell({
  title,
  subtitle,
  colSpan = 1,
  rowSpan = 1,
  className = "",
  children,
}: Props) {
  return (
    <div
      className={[
        COL_SPAN[colSpan],
        ROW_SPAN[rowSpan],
        "bg-white dark:bg-gray-800",
        "rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm",
        "p-5 flex flex-col gap-3",
        className,
      ].join(" ")}
    >
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 leading-none">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
