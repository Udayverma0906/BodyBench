import { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { useConfig, CONFIG_DEFINITIONS } from '../hooks/useConfig';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import type { ConfigDef } from '../hooks/useConfig';

// Only settings marked userVisible are shown here
const USER_DEFS = CONFIG_DEFINITIONS.filter(d => d.userVisible);

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastData { msg: string; ok: boolean }

function Toast({ data, onDismiss }: { data: ToastData; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
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
  def, currentValue, onSave,
}: {
  def: ConfigDef; currentValue: string; onSave: (key: string, value: string) => Promise<void>;
}) {
  const [localValue, setLocalValue] = useState(currentValue);
  const [saving, setSaving]         = useState(false);

  useEffect(() => { setLocalValue(currentValue); }, [currentValue]);

  const save = async (val: string) => {
    if (val === currentValue) return;
    setSaving(true);
    try { await onSave(def.key, val); } finally { setSaving(false); }
  };

  const cls = "px-3 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 transition";

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 px-5 py-4 flex items-center justify-between gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{def.label}</p>
        {def.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{def.description}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {def.type === 'select' && (
          <select
            value={localValue}
            disabled={saving}
            onChange={e => { setLocalValue(e.target.value); save(e.target.value); }}
            className={cls}
          >
            {def.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
        {def.type === 'toggle' && (
          <button
            disabled={saving}
            onClick={() => { const next = localValue === 'true' ? 'false' : 'true'; setLocalValue(next); save(next); }}
            className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-60 ${localValue === 'true' ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-600'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${localValue === 'true' ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        )}
        {saving && <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />}
      </div>
    </div>
  );
}

// ── Change Password ───────────────────────────────────────────────────────────

function ChangePasswordSection({ onToast }: { onToast: (d: ToastData) => void }) {
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving]                   = useState(false);

  const inputCls = "w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { onToast({ msg: "Passwords don't match.", ok: false }); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      onToast({ msg: `Failed: ${error.message}`, ok: false });
    } else {
      onToast({ msg: 'Password updated', ok: true });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Security</h2>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 px-5 py-5">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Change Password</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Choose a new password for your account.</p>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">New password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" required minLength={6} disabled={saving} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} disabled={saving} className={inputCls} />
          </div>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition">
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserSettingsPage() {
  const { get, configLoading, updateConfig } = useConfig();
  const { setTheme } = useTheme();
  const [toast, setToast] = useState<ToastData | null>(null);

  const sections = [...new Set(USER_DEFS.map(d => d.section))];

  const handleSave = async (key: string, value: string) => {
    try {
      await updateConfig(key, value);
      if (key === 'default_theme' && (value === 'dark' || value === 'light')) {
        setTheme(value);
      }
      setToast({ msg: 'Saved', ok: true });
    } catch (err) {
      setToast({ msg: `Failed to save: ${(err as Error).message}`, ok: false });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Personalise your BodyBench experience.
          </p>
        </div>

        {configLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {sections.map(section => (
              <section key={section} className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {section}
                </h2>
                {USER_DEFS.filter(d => d.section === section).map(def => (
                  <SettingRow key={def.key} def={def} currentValue={get(def.key)} onSave={handleSave} />
                ))}
              </section>
            ))}
            <ChangePasswordSection onToast={setToast} />
          </>
        )}
      </main>

      {toast && <Toast data={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
