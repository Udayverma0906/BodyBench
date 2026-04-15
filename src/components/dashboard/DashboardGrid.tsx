import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Extra classes applied to the grid container */
  className?: string;
}

/**
 * DashboardGrid — CSS grid container for dashboard widgets.
 *
 * Uses a 4-column grid on medium+ screens, 2-column on small, 1-column on mobile.
 * Widgets inside use colSpan props (via WidgetShell) to span multiple columns.
 *
 * Usage:
 *   <DashboardGrid>
 *     <StatWidget colSpan={1} ... />
 *     <TrendWidget colSpan={4} ... />
 *   </DashboardGrid>
 */
export default function DashboardGrid({ children, className = "" }: Props) {
  return (
    <div
      className={[
        "grid",
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        "gap-4",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
