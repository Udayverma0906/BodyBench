import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import BasePopup from "../ui/BasePopup";
import type { Assessment } from "../../types/database";

// ── Shared styles ─────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { color: string; badge: string }> = {
  Excellent:           { color: "text-green-500 dark:text-green-400",  badge: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" },
  Good:                { color: "text-blue-600 dark:text-blue-400",    badge: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" },
  Average:             { color: "text-amber-500 dark:text-amber-400",  badge: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" },
  "Needs Improvement": { color: "text-red-500 dark:text-red-400",      badge: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" },
};
const FALLBACK_STYLE = CATEGORY_STYLES["Good"];

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// ── Restore icon ──────────────────────────────────────────────────────────────

function RestoreIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

// ── Deleted assessment card ───────────────────────────────────────────────────

function DeletedCard({
  a,
  onRestore,
  restoring,
}: {
  a: Assessment;
  onRestore: () => void;
  restoring: boolean;
}) {
  const style = CATEGORY_STYLES[a.category] ?? FALLBACK_STYLE;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      {/* Score circle */}
      <div className={`shrink-0 w-12 h-12 rounded-full border-[3px] flex items-center justify-center ${style.color} border-current opacity-60`}>
        <span className="text-sm font-extrabold text-gray-700 dark:text-gray-300 leading-none">
          {a.score}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge} opacity-70`}>
          {a.category}
        </span>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {dateFmt.format(new Date(a.taken_at))}
        </p>
      </div>

      {/* Restore button */}
      <button
        onClick={onRestore}
        disabled={restoring}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <RestoreIcon />
        Restore
      </button>
    </div>
  );
}

// ── Public props ──────────────────────────────────────────────────────────────

export interface DeletedAssessmentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  /** Called after a row is successfully restored so the parent can add it back. */
  onRestored: (assessment: Assessment) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * DeletedAssessmentsPanel — reusable panel that lists soft-deleted assessments
 * and lets the user restore any of them.
 *
 * Usage:
 *   <DeletedAssessmentsPanel
 *     isOpen={showDeleted}
 *     onClose={() => setShowDeleted(false)}
 *     userId={user.id}
 *     onRestored={(a) => setAssessments(prev => [...prev, a])}
 *   />
 */
export default function DeletedAssessmentsPanel({
  isOpen,
  onClose,
  userId,
  onRestored,
}: DeletedAssessmentsPanelProps) {
  const [items, setItems] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Fetch deleted items whenever the panel opens
  useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;
    
    const fetchDeletedItems = async () => {
      try {
        const { data } = await supabase
          .from("assessments")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", false)
          .order("taken_at", { ascending: false });
        
        if (isMounted) {
          setItems((data as Assessment[]) ?? []);
        }
      } catch {
        if (isMounted) {
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchDeletedItems();
    
    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  const handleRestore = async (a: Assessment) => {
    setRestoringId(a.id);
    const { error, count } = await supabase
      .from("assessments")
      .update({ is_active: true }, { count: "exact" })
      .eq("id", a.id)
      .eq("user_id", userId);

    setRestoringId(null);

    if (error) {
      console.error("[DeletedAssessmentsPanel] restore error:", error);
      return;
    }
    if (!count || count === 0) {
      console.warn("[DeletedAssessmentsPanel] 0 rows updated — check RLS UPDATE policy.");
      return;
    }

    const restored: Assessment = { ...a, is_active: true };
    setItems((prev) => prev.filter((item) => item.id !== a.id));
    onRestored(restored);
  };

  return (
    <BasePopup isOpen={isOpen} onClose={onClose} title="Deleted Assessments" size="md">
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            No deleted assessments
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Removed assessments will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {items.map((a) => (
            <DeletedCard
              key={a.id}
              a={a}
              onRestore={() => handleRestore(a)}
              restoring={restoringId === a.id}
            />
          ))}
        </div>
      )}
    </BasePopup>
  );
}
