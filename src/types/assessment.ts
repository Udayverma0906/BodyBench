/**
 * Widened to Record so dynamic field_key values from field_configs work
 * alongside the hardcoded fallback keys (pushups, jogTime, …).
 * All existing access patterns (data.pushups, data.jogTime) still type-check
 * because Record<string, …> allows any string property.
 */
export type AssessmentForm = Record<string, number | undefined>;
