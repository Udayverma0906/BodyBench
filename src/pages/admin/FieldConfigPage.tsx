import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/layout/Navbar";
import BasePopup from "../../components/ui/BasePopup";
import { supabase } from "../../lib/supabase";
import { DEFAULT_FIELD_CONFIGS } from "../../lib/defaultFieldConfigs";
import type { FieldConfig } from "../../types/database";

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTIONS: { key: FieldConfig["section"]; label: string }[] = [
  { key: "personal",  label: "Body Stats"      },
  { key: "strength",  label: "Strength"         },
  { key: "endurance", label: "Core & Endurance" },
];

const SECTION_HINT: Record<FieldConfig["section"], string> = {
  personal:  "Used for adjustments (e.g. age, weight, height).",
  strength:  "Max reps / weight — higher is better.",
  endurance: "Time / HR metrics — lower is often better.",
};

// field_keys that originated from the built-in defaults — used only for the "Standard" badge
const STANDARD_KEYS = new Set(DEFAULT_FIELD_CONFIGS.map(d => d.field_key));

const DEFAULT_TIERS: Record<FieldConfig["section"], TierRow[]> = {
  personal:  [{ threshold: "29", points: "15" }, { threshold: "49", points: "10" }, { threshold: "99", points: "5" }],
  strength:  [{ threshold: "20", points: "20" }, { threshold: "10", points: "14" }, { threshold: "0",  points: "7" }],
  endurance: [{ threshold: "5",  points: "25" }, { threshold: "7",  points: "17" }, { threshold: "999", points: "8" }],
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

// ── Local types ───────────────────────────────────────────────────────────────

interface TierRow { threshold: string; points: string }

interface FormState {
  label: string;
  field_key: string;
  section: FieldConfig["section"];
  description: string;
  placeholder: string;
  unit: string;
  min_value: string;
  max_value: string;
  step_value: string;
  required: boolean;
  lower_is_better: boolean;
  visible: boolean;
  sort_order: string;
  tiers: TierRow[];
}

type FormErrors = Partial<Record<keyof FormState | "tiers" | "_save", string>>;

function emptyForm(section: FieldConfig["section"] = "strength"): FormState {
  return {
    label: "", field_key: "", section,
    description: "", placeholder: "", unit: "",
    min_value: "0", max_value: "", step_value: "1",
    required: false, lower_is_better: false, visible: true,
    sort_order: "0",
    tiers: [...DEFAULT_TIERS[section]],
  };
}

function formFromConfig(c: FieldConfig): FormState {
  return {
    label: c.label, field_key: c.field_key, section: c.section,
    description: c.description ?? "",
    placeholder: c.placeholder ?? "", unit: c.unit ?? "",
    min_value: c.min_value?.toString() ?? "0",
    max_value: c.max_value?.toString() ?? "",
    step_value: c.step_value.toString(),
    required: c.required, lower_is_better: c.lower_is_better, visible: c.visible,
    sort_order: c.sort_order.toString(),
    tiers: c.scoring_tiers.length
      ? c.scoring_tiers.map(t => ({ threshold: String(t.threshold), points: String(t.points) }))
      : [...DEFAULT_TIERS[c.section]],
  };
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 " +
  "bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 transition";
const INPUT_ERR = "border-red-400 dark:border-red-500 focus:ring-red-400";

function LabelWrap({ label, error, hint, children }: {
  label: string; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full relative transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : ""
        }`} />
      </div>
      <span className="text-xs text-gray-600 dark:text-gray-300">{label}</span>
    </label>
  );
}

// ── FieldCard ─────────────────────────────────────────────────────────────────

interface FieldCardProps {
  config: FieldConfig;
  deleted?: boolean;
  isStandard?: boolean;     // shows "Standard" badge — informational only, no control difference
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleVisible?: () => void;
  onRestore?: () => void;
}

function FieldCard({ config, deleted = false, isStandard = false, onEdit, onDelete, onToggleVisible, onRestore }: FieldCardProps) {
  const op = config.lower_is_better ? "≤" : "≥";
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-start gap-4 transition ${deleted ? "opacity-50" : ""}`}>
      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">{config.label}</span>
          <code className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono">
            {config.field_key}
          </code>
          {config.unit && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{config.unit}</span>
          )}
          {isStandard ? (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">
              Standard
            </span>
          ) : (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400">
              Custom
            </span>
          )}
          {config.required && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
              Required
            </span>
          )}
          {config.lower_is_better && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
              ↓ Lower is better
            </span>
          )}
        </div>

        {/* Description */}
        {config.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{config.description}</p>
        )}

        {/* Scoring tiers */}
        <div className="mt-2 flex flex-wrap gap-1">
          {config.scoring_tiers.map((t, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              {op}{t.threshold} → {t.points}pt
            </span>
          ))}
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            max {config.max_points}pt
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
        {deleted ? (
          <button
            onClick={onRestore}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 transition"
          >
            Restore
          </button>
        ) : (
          <>
            <button
              onClick={onToggleVisible}
              title={config.visible ? "Hide from assessment form" : "Show in assessment form"}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                config.visible
                  ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {config.visible ? "Visible" : "Hidden"}
            </button>
            <button
              onClick={onEdit}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── FieldForm ─────────────────────────────────────────────────────────────────

interface FieldFormProps {
  form: FormState;
  errors: FormErrors;
  isEdit: boolean;
  autoMaxPoints: number;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  updateTier: (i: number, k: keyof TierRow, v: string) => void;
  addTier: () => void;
  removeTier: (i: number) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}

function FieldForm({
  form, errors, isEdit, autoMaxPoints,
  setField, updateTier, addTier, removeTier,
  onCancel, onSave, saving,
}: FieldFormProps) {
  return (
    <div className="max-h-[68vh] overflow-y-auto -mx-6 px-6 space-y-5 pb-1">

      {/* ── Identity ── */}
      {isEdit ? (
        <div className="grid grid-cols-2 gap-4">
          <LabelWrap label="Label *" error={errors.label}>
            <input
              className={`${INPUT_CLS} ${errors.label ? INPUT_ERR : ""}`}
              value={form.label}
              onChange={e => setField("label", e.target.value)}
              placeholder="e.g. Push-ups"
            />
          </LabelWrap>
          <LabelWrap label="Field Key" hint="Locked after creation">
            <input
              className={`${INPUT_CLS} font-mono text-xs opacity-50 cursor-not-allowed`}
              value={form.field_key}
              readOnly
              tabIndex={-1}
            />
          </LabelWrap>
        </div>
      ) : (
        <LabelWrap label="Label *" error={errors.label}>
          <input
            className={`${INPUT_CLS} ${errors.label ? INPUT_ERR : ""}`}
            value={form.label}
            onChange={e => setField("label", e.target.value)}
            placeholder="e.g. Push-ups"
          />
        </LabelWrap>
      )}

      <div className="grid grid-cols-2 gap-4">
        <LabelWrap label="Section *" error={errors.section} hint={SECTION_HINT[form.section]}>
          <select
            className={`${INPUT_CLS} ${errors.section ? INPUT_ERR : ""}`}
            value={form.section}
            onChange={e => setField("section", e.target.value as FieldConfig["section"])}
          >
            {SECTIONS.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </LabelWrap>
        <LabelWrap label="Unit">
          <input
            className={INPUT_CLS}
            value={form.unit}
            onChange={e => setField("unit", e.target.value)}
            placeholder="e.g. reps, kg, sec"
          />
        </LabelWrap>
      </div>

      <LabelWrap label="Description">
        <input
          className={INPUT_CLS}
          value={form.description}
          onChange={e => setField("description", e.target.value)}
          placeholder="Help text shown below the input field"
        />
      </LabelWrap>

      <LabelWrap label="Placeholder">
        <input
          className={INPUT_CLS}
          value={form.placeholder}
          onChange={e => setField("placeholder", e.target.value)}
          placeholder="e.g. e.g. 20"
        />
      </LabelWrap>

      {/* ── Input constraints ── */}
      <div className="grid grid-cols-3 gap-3">
        <LabelWrap label="Min Value">
          <input
            type="number"
            className={INPUT_CLS}
            value={form.min_value}
            onChange={e => setField("min_value", e.target.value)}
            placeholder="0"
          />
        </LabelWrap>
        <LabelWrap label="Max Value">
          <input
            type="number"
            className={INPUT_CLS}
            value={form.max_value}
            onChange={e => setField("max_value", e.target.value)}
            placeholder="—"
          />
        </LabelWrap>
        <LabelWrap label="Step *" error={errors.step_value}>
          <input
            type="number"
            className={`${INPUT_CLS} ${errors.step_value ? INPUT_ERR : ""}`}
            value={form.step_value}
            onChange={e => setField("step_value", e.target.value)}
            placeholder="1"
            min="0.01"
          />
        </LabelWrap>
      </div>

      {/* ── Toggles ── */}
      <div className="flex flex-wrap gap-6 py-1">
        <Toggle checked={form.required}        onChange={v => setField("required", v)}        label="Required" />
        <Toggle checked={form.lower_is_better} onChange={v => setField("lower_is_better", v)} label="Lower is better" />
        <Toggle checked={form.visible}         onChange={v => setField("visible", v)}         label="Visible in form" />
      </div>

      <LabelWrap label="Sort Order" hint="Lower numbers appear first within a section">
        <input
          type="number"
          className={INPUT_CLS}
          value={form.sort_order}
          onChange={e => setField("sort_order", e.target.value)}
          placeholder="0"
        />
      </LabelWrap>

      {/* ── Scoring tiers ── */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Scoring Tiers <span className="text-red-400">*</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Evaluated top-to-bottom — first match wins.{" "}
              Tier fires when value {form.lower_is_better ? "≤" : "≥"} threshold.
            </p>
          </div>
          <button
            onClick={addTier}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0 ml-4 mt-0.5"
          >
            + Add Tier
          </button>
        </div>

        {errors.tiers && (
          <p className="text-xs text-red-500 mb-2">{errors.tiers}</p>
        )}

        <div className="space-y-2">
          {form.tiers.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400 w-4 shrink-0 text-right">
                {form.lower_is_better ? "≤" : "≥"}
              </span>
              <input
                type="number"
                className={`${INPUT_CLS} flex-1`}
                value={t.threshold}
                onChange={e => updateTier(i, "threshold", e.target.value)}
                placeholder="threshold"
              />
              <span className="text-xs text-gray-400 shrink-0">→</span>
              <input
                type="number"
                className={`${INPUT_CLS} flex-1`}
                value={t.points}
                onChange={e => updateTier(i, "points", e.target.value)}
                placeholder="pts"
              />
              <button
                onClick={() => removeTier(i)}
                disabled={form.tiers.length === 1}
                title="Remove tier"
                className="text-xs text-red-400 hover:text-red-600 disabled:opacity-25 px-1 shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Max Points (auto):{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-300">{autoMaxPoints}pt</span>
        </p>
      </div>

      {/* ── Save error ── */}
      {errors._save && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2">
          {errors._save}
        </p>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Field"}
        </button>
      </div>
    </div>
  );
}

// ── JoinCodeCard ──────────────────────────────────────────────────────────────

function makeCode(): string {
  // Excludes visually ambiguous characters (I, O, 0, 1)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function JoinCodeCard({ userId }: { userId: string }) {
  const [code, setCode]           = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(true);
  const [working, setWorking]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.from("profiles").select("join_code").eq("id", userId).single()
      .then(({ data }) => {
        if (!active) return;
        setCode(data?.join_code ?? null);
        setCodeLoading(false);
      });
    return () => { active = false; };
  }, [userId]);

  // Generates a new code and saves it, retrying up to 5 times on a unique
  // constraint collision (error code 23505). Each attempt picks a fresh random
  // code so the retry is genuinely independent.
  const generateAndSave = async () => {
    setWorking(true);
    setCodeError(null);
    const MAX_ATTEMPTS = 5;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const candidate = makeCode();
      const { error } = await supabase
        .from("profiles")
        .update({ join_code: candidate })
        .eq("id", userId);
      if (!error) {
        setCode(candidate);
        setWorking(false);
        return;
      }
      if (error.code !== "23505") {
        // Non-collision error — no point retrying
        setCodeError("Failed to save code. Please try again.");
        break;
      }
      // error.code === "23505" → collision, loop and try a new code
    }
    setWorking(false);
  };

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Your Join Code</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Share this with clients so they can link to your fields.
        </p>
      </div>

      {codeLoading ? (
        <div className="h-10 w-48 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-xl" />
      ) : code ? (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-2xl font-bold tracking-[0.25em] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-4 py-2 rounded-xl select-all">
            {code}
          </span>
          <button
            onClick={copy}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      ) : (
        <button
          onClick={generateAndSave}
          disabled={working}
          className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          {working ? "Generating…" : "Generate Code"}
        </button>
      )}

      {codeError && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-3">{codeError}</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FieldConfigPage() {
  const { user } = useAuth();

  const [configs, setConfigs] = useState<FieldConfig[]>([]);   // admin's own fields (all, incl. deleted)
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted]   = useState(false);
  const [refreshKey, setRefreshKey]     = useState(0);

  // Form popup
  const [formOpen, setFormOpen]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(emptyForm());
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving]         = useState(false);

  // Delete confirm popup
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  // setLoading(true) lives here (outside the effect) so the effect body
  // never calls setState synchronously — satisfies react-hooks/set-state-in-effect.
  // On mount, loading is already true (initial useState value).
  // On manual refetch, refetch() sets loading=true before bumping the key.
  function refetch() {
    setLoading(true);
    setRefreshKey(k => k + 1);
  }

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function loadAndSeed() {
      // Fetch ALL admin-owned rows (including deleted) so we know which standard
      // fields have ever existed for this admin and shouldn't be re-seeded.
      const { data: adminData } = await supabase
        .from("field_configs")
        .select("*")
        .eq("admin_id", user!.id)
        .order("section")
        .order("sort_order");

      if (!active) return;

      const existing = (adminData as FieldConfig[]) ?? [];

      // Seed any DEFAULT_FIELD_CONFIGS whose field_key the admin has never had.
      // We skip keys that already exist (even as soft-deleted) so the admin's
      // deliberate deletions are not accidentally restored.
      const adminAllKeys = new Set(existing.map(c => c.field_key));
      const toSeed = DEFAULT_FIELD_CONFIGS.filter(d => !adminAllKeys.has(d.field_key));

      if (toSeed.length > 0) {
        await supabase.from("field_configs").insert(
          toSeed.map(d => ({
            admin_id:        user!.id,
            label:           d.label,
            field_key:       d.field_key,
            section:         d.section,
            field_type:      "number" as const,
            description:     d.description,
            placeholder:     d.placeholder,
            unit:            d.unit,
            min_value:       d.min_value,
            max_value:       d.max_value,
            step_value:      d.step_value,
            required:        d.required,
            lower_is_better: d.lower_is_better,
            visible:         d.visible,
            is_deleted:      false,
            sort_order:      d.sort_order,
            scoring_tiers:   d.scoring_tiers,
            max_points:      d.max_points,
          }))
        );
        if (!active) return;
        // Re-fetch after seeding so we have the real DB ids
        const { data: refreshed } = await supabase
          .from("field_configs")
          .select("*")
          .eq("admin_id", user!.id)
          .order("section")
          .order("sort_order");
        if (!active) return;
        setConfigs((refreshed as FieldConfig[]) ?? []);
      } else {
        setConfigs(existing);
      }
      setLoading(false);
    }

    loadAndSeed();
    return () => { active = false; };
  }, [user, refreshKey]);

  // ── Form helpers ──────────────────────────────────────────────────────────

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setFormErrors({});
    setFormOpen(true);
  }

  function openEdit(config: FieldConfig) {
    setEditingId(config.id);
    setForm(formFromConfig(config));
    setFormErrors({});
    setFormOpen(true);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      // Reset tiers to section defaults when section changes in add mode
      if (key === "section" && !editingId) {
        next.tiers = [...DEFAULT_TIERS[value as FieldConfig["section"]]];
      }
      return next;
    });
    setFormErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function updateTier(i: number, k: keyof TierRow, v: string) {
    setForm(prev => {
      const tiers = [...prev.tiers];
      tiers[i] = { ...tiers[i], [k]: v };
      return { ...prev, tiers };
    });
    setFormErrors(prev => ({ ...prev, tiers: undefined }));
  }

  function addTier() {
    setForm(prev => ({ ...prev, tiers: [...prev.tiers, { threshold: "", points: "" }] }));
  }

  function removeTier(i: number) {
    setForm(prev => ({ ...prev, tiers: prev.tiers.filter((_, idx) => idx !== i) }));
  }

  const autoMaxPoints = Math.max(0, ...form.tiers.map(t => Number(t.points) || 0));

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.label.trim())   errs.label = "Required";
    // field_key is auto-generated on insert; only validate it in edit mode
    if (editingId && !form.field_key.trim()) errs.field_key = "Required";
    if (form.tiers.length === 0) {
      errs.tiers = "At least one scoring tier is required";
    } else if (form.tiers.some(t => t.threshold === "" || t.points === "" || isNaN(Number(t.threshold)) || isNaN(Number(t.points)))) {
      errs.tiers = "All tier threshold and points values must be valid numbers";
    }
    if (!form.step_value || Number(form.step_value) <= 0) errs.step_value = "Must be greater than 0";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!validate() || !user) return;
    setSaving(true);

    const payload = {
      admin_id:        user.id,
      label:           form.label.trim(),
      field_key:       editingId
                         ? form.field_key.trim()
                         : `${slugify(form.label.trim())}_${Date.now().toString(36)}`,
      section:         form.section,
      field_type:      "number" as const,
      description:     form.description.trim() || null,
      placeholder:     form.placeholder.trim() || null,
      unit:            form.unit.trim() || null,
      min_value:       form.min_value !== "" ? Number(form.min_value) : null,
      max_value:       form.max_value !== "" ? Number(form.max_value) : null,
      step_value:      Number(form.step_value) || 1,
      required:        form.required,
      lower_is_better: form.lower_is_better,
      visible:         form.visible,
      is_deleted:      false,
      sort_order:      Number(form.sort_order) || 0,
      scoring_tiers:   form.tiers.map(t => ({ threshold: Number(t.threshold), points: Number(t.points) })),
      max_points:      autoMaxPoints,
    };

    if (editingId) {
      const { error } = await supabase
        .from("field_configs")
        .update(payload)
        .eq("id", editingId)
        .eq("admin_id", user.id);
      if (error) {
        setFormErrors({ _save: error.message });
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("field_configs")
        .insert(payload);
      if (error) {
        setFormErrors({ _save: error.message });
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setFormOpen(false);
    refetch();
  }

  // ── Soft delete / restore ─────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteId || !user) return;
    setDeleting(true);
    await supabase
      .from("field_configs")
      .update({ is_deleted: true })
      .eq("id", deleteId)
      .eq("admin_id", user.id);
    setDeleting(false);
    setDeleteId(null);
    refetch();
  }

  async function handleRestore(id: string) {
    if (!user) return;
    await supabase
      .from("field_configs")
      .update({ is_deleted: false })
      .eq("id", id)
      .eq("admin_id", user.id);
    refetch();
  }

  // ── Toggle visible (inline, no confirm needed) ────────────────────────────

  async function handleToggleVisible(config: FieldConfig) {
    if (!user) return;
    const next = !config.visible;
    await supabase
      .from("field_configs")
      .update({ visible: next })
      .eq("id", config.id)
      .eq("admin_id", user.id);
    setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, visible: next } : c));
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const active  = configs.filter(c => !c.is_deleted);
  const deleted = configs.filter(c =>  c.is_deleted);

  const grouped = SECTIONS.map(s => ({
    ...s,
    fields: active.filter(c => c.section === s.key),
  }));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Field Configuration</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage assessment input fields and their scoring rules
            </p>
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shrink-0"
          >
            + Add Field
          </button>
        </div>

        {/* Join code — lets clients link to this admin's fields */}
        {user && <JoinCodeCard userId={user.id} />}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Active fields grouped by section */}
            {grouped.map(({ key, label, fields }) => (
              <section key={key}>
                <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                  {label}
                </h2>
                {fields.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-600 px-1 py-3">No fields yet.</p>
                ) : (
                  <div className="space-y-3">
                    {fields.map(cfg => (
                      <FieldCard
                        key={cfg.id}
                        config={cfg}
                        isStandard={STANDARD_KEYS.has(cfg.field_key)}
                        onEdit={() => openEdit(cfg)}
                        onDelete={() => setDeleteId(cfg.id)}
                        onToggleVisible={() => handleToggleVisible(cfg)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}

            {/* Deleted fields (collapsible) */}
            {deleted.length > 0 && (
              <section>
                <button
                  onClick={() => setShowDeleted(v => !v)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-gray-600 dark:hover:text-gray-300 transition mb-3"
                >
                  <span>{showDeleted ? "▾" : "▸"}</span>
                  Deleted ({deleted.length})
                </button>
                {showDeleted && (
                  <div className="space-y-3">
                    {deleted.map(cfg => (
                      <FieldCard
                        key={cfg.id}
                        config={cfg}
                        deleted
                        onRestore={() => handleRestore(cfg.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* ── Add / Edit popup ─────────────────────────────────────────────── */}
      <BasePopup
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? "Edit Field" : "Add Field"}
        size="xl"
      >
        <FieldForm
          form={form}
          errors={formErrors}
          isEdit={!!editingId}
          autoMaxPoints={autoMaxPoints}
          setField={setField}
          updateTier={updateTier}
          addTier={addTier}
          removeTier={removeTier}
          onCancel={() => setFormOpen(false)}
          onSave={handleSave}
          saving={saving}
        />
      </BasePopup>

      {/* ── Delete confirmation popup ─────────────────────────────────────── */}
      <BasePopup
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Field"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          This field will be hidden from assessments.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          Historical assessment data is unaffected — you can restore it at any time from the Deleted section.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </BasePopup>
    </div>
  );
}
