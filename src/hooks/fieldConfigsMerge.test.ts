/**
 * Tests for the useFieldConfigs merge logic in isolation.
 *
 * The actual hook makes Supabase calls, so we extract and test the pure merge
 * step as a standalone function. This covers: admin override, hidden blocking,
 * deleted blocking, and sort order correctness.
 */
import { describe, it, expect } from "vitest";
import type { FieldConfig } from "../types/database";

// ─── Pure merge logic (mirrors useFieldConfigs exactly) ───────────────────────

function merge(adminFields: FieldConfig[], globalFields: FieldConfig[]): FieldConfig[] {
  const sectionOrder: Record<FieldConfig["section"], number> = {
    personal: 0, strength: 1, endurance: 2,
  };

  // adminKeys covers ALL admin fields (including deleted + hidden) so that
  // a deleted or hidden admin field blocks the global default from re-appearing.
  const adminKeys = new Set(adminFields.map(f => f.field_key));

  const merged = [
    ...adminFields.filter(f => !f.is_deleted && f.visible),
    ...globalFields.filter(f => !adminKeys.has(f.field_key)),
  ];

  merged.sort((a, b) => {
    const sd = sectionOrder[a.section] - sectionOrder[b.section];
    return sd !== 0 ? sd : a.sort_order - b.sort_order;
  });

  return merged;
}

// ─── Factory helpers ──────────────────────────────────────────────────────────

let seq = 0;
function makeField(overrides: Partial<FieldConfig> & { field_key: string }): FieldConfig {
  return {
    id:               `id_${seq++}`,
    admin_id:         null,
    user_id:          null,
    label:            overrides.field_key,
    section:          "strength",
    field_type:       "number",
    description:      null,
    placeholder:      "",
    unit:             null,
    min_value:        0,
    max_value:        null,
    step_value:       1,
    required:         false,
    lower_is_better:  false,
    visible:          true,
    is_deleted:       false,
    sort_order:       0,
    created_at:       "",
    scoring_tiers:    [],
    max_points:       10,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("fieldConfigs merge logic", () => {

  it("returns global fields when admin has no overrides", () => {
    const globals = [makeField({ field_key: "pushups" }), makeField({ field_key: "squats" })];
    const result = merge([], globals);
    expect(result.map(f => f.field_key)).toEqual(["pushups", "squats"]);
  });

  it("admin field overrides matching global field", () => {
    const admin  = [makeField({ field_key: "pushups", admin_id: "admin1", label: "Custom Push-ups" })];
    const global = [makeField({ field_key: "pushups", label: "Push-ups" })];
    const result = merge(admin, global);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Custom Push-ups");
  });

  it("admin field + unrelated global both appear", () => {
    const admin  = [makeField({ field_key: "pushups", admin_id: "admin1" })];
    const global = [makeField({ field_key: "squats" })];
    const result = merge(admin, global);
    expect(result.map(f => f.field_key)).toContain("pushups");
    expect(result.map(f => f.field_key)).toContain("squats");
  });

  it("hidden admin field does NOT appear in output", () => {
    const admin  = [makeField({ field_key: "pushups", admin_id: "admin1", visible: false })];
    const result = merge(admin, []);
    expect(result).toHaveLength(0);
  });

  it("hidden admin field BLOCKS the matching global from appearing", () => {
    const admin  = [makeField({ field_key: "pushups", admin_id: "admin1", visible: false })];
    const global = [makeField({ field_key: "pushups" })];
    const result = merge(admin, global);
    expect(result).toHaveLength(0); // hidden admin blocks global
  });

  it("deleted admin field does NOT appear in output", () => {
    const admin  = [makeField({ field_key: "pushups", admin_id: "admin1", is_deleted: true })];
    const result = merge(admin, []);
    expect(result).toHaveLength(0);
  });

  it("deleted admin field BLOCKS the matching global from re-appearing", () => {
    // This is the bug that was fixed: deleted fields must block global defaults
    const admin  = [makeField({ field_key: "pushups", admin_id: "admin1", is_deleted: true })];
    const global = [makeField({ field_key: "pushups" })];
    const result = merge(admin, global);
    expect(result).toHaveLength(0); // deleted admin blocks global
  });

  it("deleted + hidden admin fields block their globals; other globals still appear", () => {
    const admin = [
      makeField({ field_key: "pushups",  admin_id: "a", is_deleted: true }),
      makeField({ field_key: "pullups",  admin_id: "a", visible: false }),
    ];
    const global = [
      makeField({ field_key: "pushups"  }),
      makeField({ field_key: "pullups"  }),
      makeField({ field_key: "squats"   }),
    ];
    const result = merge(admin, global);
    expect(result.map(f => f.field_key)).toEqual(["squats"]);
  });

  it("sorts by section then sort_order", () => {
    const fields = [
      makeField({ field_key: "plank",   section: "endurance", sort_order: 0 }),
      makeField({ field_key: "situps",  section: "endurance", sort_order: 1 }),
      makeField({ field_key: "squats",  section: "strength",  sort_order: 0 }),
      makeField({ field_key: "age",     section: "personal",  sort_order: 0 }),
    ];
    const result = merge(fields, []);
    expect(result.map(f => f.field_key)).toEqual(["age", "squats", "plank", "situps"]);
  });

  it("sort_order within same section is respected", () => {
    const fields = [
      makeField({ field_key: "c", section: "strength", sort_order: 2 }),
      makeField({ field_key: "a", section: "strength", sort_order: 0 }),
      makeField({ field_key: "b", section: "strength", sort_order: 1 }),
    ];
    const result = merge(fields, []);
    expect(result.map(f => f.field_key)).toEqual(["a", "b", "c"]);
  });
});
