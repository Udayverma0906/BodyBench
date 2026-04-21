import { describe, it, expect } from "vitest";
import { calculateScore } from "./calculateScore";
import { DEFAULT_FIELD_CONFIGS } from "../lib/defaultFieldConfigs";
import type { FieldConfig } from "../types/database";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pick a subset of DEFAULT_FIELD_CONFIGS by field_key */
function defaults(...keys: string[]): FieldConfig[] {
  return DEFAULT_FIELD_CONFIGS.filter(c => keys.includes(c.field_key));
}

// ─── Hardcoded fallback path (no fieldConfigs arg) ───────────────────────────

describe("calculateScore – hardcoded fallback", () => {
  it("returns 0 / Needs Improvement when no fields are provided", () => {
    const result = calculateScore({});
    expect(result.total).toBe(0);
    expect(result.category).toBe("Needs Improvement");
    expect(result.breakdown).toHaveLength(0);
  });

  it("scores a single push-up metric", () => {
    const result = calculateScore({ pushups: 40 });
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].label).toBe("Push-ups");
    expect(result.breakdown[0].score).toBe(20); // max tier
    expect(result.breakdown[0].max).toBe(20);
    expect(result.total).toBe(100);
    expect(result.category).toBe("Excellent");
  });

  it("push-ups: mid tier (20–39 reps)", () => {
    const result = calculateScore({ pushups: 20 });
    expect(result.breakdown[0].score).toBe(14);
  });

  it("push-ups: bottom tier (0–19 reps)", () => {
    const result = calculateScore({ pushups: 5 });
    expect(result.breakdown[0].score).toBe(7);
  });

  it("jog time: lower is better – fast runner (≤5 min)", () => {
    const result = calculateScore({ jogTime: 4 });
    expect(result.breakdown[0].label).toBe("Endurance");
    expect(result.breakdown[0].score).toBe(25); // max tier
  });

  it("jog time: mid tier (5–7 min)", () => {
    const result = calculateScore({ jogTime: 6.5 });
    expect(result.breakdown[0].score).toBe(17);
  });

  it("jog time: bottom tier (>7 min)", () => {
    const result = calculateScore({ jogTime: 10 });
    expect(result.breakdown[0].score).toBe(8);
  });

  it("resting HR: lower is better – athlete (≤60 bpm)", () => {
    const result = calculateScore({ restingHR: 55 });
    expect(result.breakdown[0].score).toBe(15);
  });

  it("resting HR: mid tier (61–72 bpm)", () => {
    const result = calculateScore({ restingHR: 68 });
    expect(result.breakdown[0].score).toBe(10);
  });

  it("applies weight factor to strength fields (push-ups)", () => {
    // weight=140kg → factor=2; 15 pushups * 2 = 30 → meets threshold 20 → 14pts
    // without weight: 15 pushups → below 20 threshold → 7pts
    const withoutWeight = calculateScore({ pushups: 15 });
    const withWeight    = calculateScore({ pushups: 15, weight: 140 });
    expect(withoutWeight.breakdown[0].score).toBe(7);
    expect(withWeight.breakdown[0].score).toBe(14); // 15*2=30, ≥20 threshold
  });

  it("does NOT apply weight factor to endurance fields", () => {
    const a = calculateScore({ jogTime: 6 });
    const b = calculateScore({ jogTime: 6, weight: 140 });
    expect(a.breakdown[0].score).toBe(b.breakdown[0].score);
  });

  it("weight field alone scores 0 (no exercise fields)", () => {
    const result = calculateScore({ weight: 70 });
    // weight has no SCORING entry so metrics array is empty
    expect(result.total).toBe(0);
    expect(result.breakdown).toHaveLength(0);
  });
});

// ─── Category boundary tests ──────────────────────────────────────────────────

describe("calculateScore – category thresholds", () => {
  // Single-tier config: earned=pct, max=100 → total=pct exactly.
  // threshold=0 always matches; feeding value=0 keeps weight-adjustment inactive.
  function scoreFor(pct: number): string {
    const cfg: FieldConfig = {
      ...DEFAULT_FIELD_CONFIGS[0],
      id: "test", field_key: "testField", label: "Test",
      section: "strength", lower_is_better: false,
      scoring_tiers: [{ threshold: 0, points: pct }],
      max_points: 100,
    };
    return calculateScore({ testField: 0 }, [cfg]).category;
  }

  it("100  → Excellent",         () => expect(scoreFor(100)).toBe("Excellent"));
  it("81   → Excellent",         () => expect(scoreFor(81)).toBe("Excellent"));
  it("80   → Good",              () => expect(scoreFor(80)).toBe("Good"));
  it("61   → Good",              () => expect(scoreFor(61)).toBe("Good"));
  it("60   → Average",           () => expect(scoreFor(60)).toBe("Average"));
  it("41   → Average",           () => expect(scoreFor(41)).toBe("Average"));
  it("40   → Needs Improvement", () => expect(scoreFor(40)).toBe("Needs Improvement"));
  it("0    → Needs Improvement", () => expect(scoreFor(0)).toBe("Needs Improvement"));
});

// ─── Dynamic path (DB fieldConfigs) ──────────────────────────────────────────

describe("calculateScore – dynamic path (DEFAULT_FIELD_CONFIGS)", () => {
  it("push-ups max tier via DB config", () => {
    const result = calculateScore({ pushups: 50 }, defaults("pushups"));
    expect(result.breakdown[0].label).toBe("Push-ups");
    expect(result.breakdown[0].score).toBe(20);
    expect(result.breakdown[0].max).toBe(20);
    expect(result.total).toBe(100);
  });

  it("skips fields with max_points = 0 (weight, height)", () => {
    const result = calculateScore(
      { weight: 70, height: 175 },
      defaults("weight", "height")
    );
    expect(result.breakdown).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("skips fields absent from form data", () => {
    const result = calculateScore(
      { pushups: 30 },
      defaults("pushups", "pullups") // pullups not in data
    );
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].label).toBe("Push-ups");
  });

  it("jog time lower_is_better via DB config", () => {
    const fast   = calculateScore({ jogTime: 4   }, defaults("jogTime"));
    const medium = calculateScore({ jogTime: 6   }, defaults("jogTime"));
    const slow   = calculateScore({ jogTime: 100 }, defaults("jogTime"));
    expect(fast.breakdown[0].score).toBe(25);   // ≤5 → 25pts
    expect(medium.breakdown[0].score).toBe(17); // ≤7 → 17pts
    expect(slow.breakdown[0].score).toBe(8);    // >7 → 8pts
  });

  it("resting HR lower_is_better via DB config", () => {
    const athlete = calculateScore({ restingHR: 55 }, defaults("restingHR"));
    const avg     = calculateScore({ restingHR: 65 }, defaults("restingHR"));
    const high    = calculateScore({ restingHR: 90 }, defaults("restingHR"));
    expect(athlete.breakdown[0].score).toBe(15);
    expect(avg.breakdown[0].score).toBe(10);
    expect(high.breakdown[0].score).toBe(5);
  });

  it("strength weight adjustment in dynamic path", () => {
    // pushups=15, weight=140 → factor=2 → adjusted=30 → ≥20 threshold → 14pts
    const light = calculateScore({ pushups: 15, weight: 70  }, defaults("pushups", "weight"));
    const heavy = calculateScore({ pushups: 15, weight: 140 }, defaults("pushups", "weight"));
    expect(light.breakdown.find(b => b.label === "Push-ups")?.score).toBe(7);  // 15 < 20
    expect(heavy.breakdown.find(b => b.label === "Push-ups")?.score).toBe(14); // 30 ≥ 20
  });

  it("full perfect score across all standard fields", () => {
    const data = {
      pushups: 50, pullups: 20, squats: 60,
      plank: 150, situps: 50, jogTime: 3,
      flexibility: 20, restingHR: 55,
    };
    const configs = defaults("pushups","pullups","squats","plank","situps","jogTime","flexibility","restingHR");
    const result = calculateScore(data, configs);
    expect(result.total).toBe(100);
    expect(result.category).toBe("Excellent");
    result.breakdown.forEach(b => expect(b.score).toBe(b.max));
  });
});

// ─── Dynamic path: custom single-metric configs ───────────────────────────────

describe("calculateScore – custom FieldConfig", () => {
  function makeConfig(partial: Partial<FieldConfig>): FieldConfig {
    return {
      id: "custom_1",
      admin_id: "admin",
      user_id: null,
      label: "Test Metric",
      field_key: "testMetric",
      section: "endurance",
      field_type: "number",
      description: null,
      placeholder: "",
      unit: null,
      min_value: 0,
      max_value: null,
      step_value: 1,
      required: false,
      lower_is_better: false,
      visible: true,
      is_deleted: false,
      sort_order: 0,
      created_at: "",
      scoring_tiers: [
        { threshold: 10, points: 30 },
        { threshold: 5,  points: 20 },
        { threshold: 0,  points: 10 },
      ],
      max_points: 30,
      ...partial,
    };
  }

  it("uses custom scoring tiers", () => {
    const cfg = makeConfig({});
    expect(calculateScore({ testMetric: 12 }, [cfg]).breakdown[0].score).toBe(30);
    expect(calculateScore({ testMetric: 7  }, [cfg]).breakdown[0].score).toBe(20);
    expect(calculateScore({ testMetric: 1  }, [cfg]).breakdown[0].score).toBe(10);
  });

  it("custom lower_is_better field", () => {
    const cfg = makeConfig({
      lower_is_better: true,
      scoring_tiers: [
        { threshold: 3,  points: 30 },
        { threshold: 7,  points: 20 },
        { threshold: 999, points: 10 },
      ],
    });
    expect(calculateScore({ testMetric: 2  }, [cfg]).breakdown[0].score).toBe(30);
    expect(calculateScore({ testMetric: 5  }, [cfg]).breakdown[0].score).toBe(20);
    expect(calculateScore({ testMetric: 15 }, [cfg]).breakdown[0].score).toBe(10);
  });

  it("field with max_points=0 is excluded from score", () => {
    const cfg = makeConfig({ max_points: 0 });
    const result = calculateScore({ testMetric: 50 }, [cfg]);
    expect(result.breakdown).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
