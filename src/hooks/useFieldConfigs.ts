import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { FieldConfig } from "../types/database";

interface UseFieldConfigsResult {
  configs: FieldConfig[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches visible, non-deleted field configs.
 *
 * Priority:
 *   1. Admin's own fields  (if adminId is provided and yields results)
 *   2. Global system defaults  (admin_id IS NULL)
 *   3. Empty array  (Assessment.tsx falls back to hardcoded form)
 *
 * All setState calls happen inside the async loader (after awaits),
 * so they never fire synchronously in the effect body.
 */
export function useFieldConfigs(adminId?: string | null): UseFieldConfigsResult {
  const [configs, setConfigs] = useState<FieldConfig[]>([]);
  const [loading, setLoading] = useState(true);   // true on first render
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      // ── 1. Try admin-specific fields ───────────────────────────────────────
      if (adminId) {
        const { data, error: err } = await supabase
          .from("field_configs")
          .select("*")
          .eq("admin_id", adminId)
          .eq("visible", true)
          .eq("is_deleted", false)
          .order("section")
          .order("sort_order");

        if (!active) return;

        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          setConfigs(data as FieldConfig[]);
          setLoading(false);
          return;
        }
        // No admin fields found — fall through to global defaults
      }

      // ── 2. Global defaults (admin_id IS NULL) ──────────────────────────────
      const { data, error: err } = await supabase
        .from("field_configs")
        .select("*")
        .is("admin_id", null)
        .eq("visible", true)
        .eq("is_deleted", false)
        .order("section")
        .order("sort_order");

      if (!active) return;

      if (err) {
        setError(err.message);
      } else {
        setConfigs((data as FieldConfig[]) ?? []);
      }
      setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [adminId]);

  return { configs, loading, error };
}
