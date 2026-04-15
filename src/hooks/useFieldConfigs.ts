import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { DEFAULT_FIELD_CONFIGS } from "../lib/defaultFieldConfigs";
import type { FieldConfig } from "../types/database";

interface UseFieldConfigsResult {
  configs: FieldConfig[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches visible, non-deleted field configs.
 *
 * Returns a merged set: admin's own fields + any global defaults (admin_id IS NULL)
 * that the admin hasn't already overridden (matched by field_key). Admin fields
 * take precedence. Result is sorted by section then sort_order.
 *
 * Falls back to empty array only when both queries return nothing, in which case
 * Assessment.tsx renders the hardcoded form.
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
      let adminFields: FieldConfig[] = [];

      // ── 1. Admin-specific fields ───────────────────────────────────────────
      // Fetch ALL non-deleted admin fields (including hidden ones) so that
      // hidden field_keys are still present in adminKeys and correctly block
      // the global-defaults fallback from re-adding them.
      if (adminId) {
        const { data, error: err } = await supabase
          .from("field_configs")
          .select("*")
          .eq("admin_id", adminId)
          .eq("is_deleted", false)
          .order("section")
          .order("sort_order");

        if (!active) return;

        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }

        adminFields = (data as FieldConfig[]) ?? [];
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
        setLoading(false);
        return;
      }

      // If the DB has no global defaults yet, fall back to the built-in list
      const globalFields: FieldConfig[] =
        (data as FieldConfig[] | null)?.length
          ? (data as FieldConfig[])
          : DEFAULT_FIELD_CONFIGS;

      // ── 3. Merge: admin fields override globals by field_key ───────────────
      // adminKeys covers ALL non-deleted admin fields (visible or hidden) so
      // that a hidden admin field blocks the global default from re-appearing.
      // Only visible admin fields are included in the merged output.
      const adminKeys = new Set(adminFields.map(f => f.field_key));
      const merged = [
        ...adminFields.filter(f => f.visible),
        ...globalFields.filter(f => !adminKeys.has(f.field_key)),
      ];

      // Re-sort by section then sort_order so the result is deterministic
      const sectionOrder: Record<FieldConfig["section"], number> = {
        personal: 0, strength: 1, endurance: 2,
      };
      merged.sort((a, b) => {
        const sd = sectionOrder[a.section] - sectionOrder[b.section];
        return sd !== 0 ? sd : a.sort_order - b.sort_order;
      });

      setConfigs(merged);
      setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [adminId]);

  return { configs, loading, error };
}
