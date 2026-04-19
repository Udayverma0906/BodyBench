import { useEffect, useRef, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import { useConfig, CONFIG_DEFINITIONS } from '../../hooks/useConfig';
import { useTheme } from '../../context/ThemeContext';
import type { ConfigDef } from '../../hooks/useConfig';

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastData { msg: string; ok: boolean }

function Toast({ data, onDismiss }: { data: ToastData; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white whitespace-nowrap ${
      data.ok ? 'bg-green-600' : 'bg-red-600'
    }`}>
      {data.msg}
    </div>
  );
}

// ── SettingRow ────────────────────────────────────────────────────────────────

function SettingRow({
  def,
  currentValue,
  onSave,
}: {
  def:          ConfigDef;
  currentValue: string;
  onSave:       (key: string, value: string) => Promise<void>;
}) {
  const [localValue, setLocalValue] = useState(currentValue);
  const [saving, setSaving]         = useState(false);

  // Sync local value if external value changes (e.g. after config loads)
  useEffect(() => { setLocalValue(currentValue); }, [currentValue]);

  const save = async (val: string) => {
    if (val === currentValue) return; // dirty check — never save unchanged values
    setSaving(true);
    try {
      await onSave(def.key, val);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 px-5 py-4 flex items-center justify-between gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{def.label}</p>
        {def.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
            {def.description}
          </p>
        )}
        {def.requiresReload && (
          <p className="text-[10px] text-amber-500 dark:text-amber-400 mt-1 font-medium">
            Requires page reload to take effect
          </p>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {/* ── Select ── */}
        {def.type === 'select' && (
          <select
            value={localValue}
            disabled={saving}
            onChange={e => { setLocalValue(e.target.value); save(e.target.value); }}
            className="px-3 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 transition"
          >
            {def.options?.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        {/* ── Toggle ── */}
        {def.type === 'toggle' && (
          <button
            disabled={saving}
            onClick={() => {
              const next = localValue === 'true' ? 'false' : 'true';
              setLocalValue(next);
              save(next);
            }}
            className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-60 ${
              localValue === 'true' ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-600'
            }`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              localValue === 'true' ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        )}

        {/* ── Number ── */}
        {def.type === 'number' && (
          <>
            <input
              type="number"
              value={localValue}
              disabled={saving}
              onChange={e => setLocalValue(e.target.value)}
              onBlur={() => save(localValue)}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              className="w-20 px-3 py-1.5 text-sm text-right rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {def.unit && (
              <span className="text-xs text-gray-500 dark:text-gray-400 w-12">{def.unit}</span>
            )}
          </>
        )}

        {saving && (
          <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { get, configLoading, updateConfig } = useConfig();
  const { setTheme } = useTheme();
  const [toast, setToast] = useState<ToastData | null>(null);
  const reloadIvRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up reload countdown if the page unmounts before the 3s fires
  useEffect(() => () => { if (reloadIvRef.current) clearInterval(reloadIvRef.current); }, []);

  const sections = [...new Set(CONFIG_DEFINITIONS.map(d => d.section))];

  const handleSave = async (key: string, value: string) => {
    const def = CONFIG_DEFINITIONS.find(d => d.key === key);
    try {
      await updateConfig(key, value);

      // Apply theme immediately — no reload needed for visual change
      if (key === 'default_theme' && (value === 'dark' || value === 'light')) {
        setTheme(value);
      }

      if (def?.requiresReload) {
        let secs = 3;
        setToast({ msg: `Saved — reloading in ${secs}…`, ok: true });
        reloadIvRef.current = setInterval(() => {
          secs -= 1;
          if (secs <= 0) { clearInterval(reloadIvRef.current!); window.location.reload(); return; }
          setToast(t => t ? { ...t, msg: `Saved — reloading in ${secs}…` } : null);
        }, 1000);
      } else {
        setToast({ msg: 'Saved', ok: true });
      }
    } catch (err) {
      setToast({ msg: `Failed to save: ${(err as Error).message}`, ok: false });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure your organisation's preferences.
          </p>
        </div>

        {configLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          sections.map(section => (
            <section key={section} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {section}
              </h2>
              {CONFIG_DEFINITIONS.filter(d => d.section === section).map(def => (
                <SettingRow
                  key={def.key}
                  def={def}
                  currentValue={get(def.key)}
                  onSave={handleSave}
                />
              ))}
            </section>
          ))
        )}
      </main>

      {toast && <Toast data={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
