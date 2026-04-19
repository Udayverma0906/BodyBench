import { useCallback, useRef, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// ── Defaults — used when no DB row exists for a key ───────────────────────────
export const CONFIG_DEFAULTS: Record<string, string> = {
  idle_timeout_secs: '600',   // 10 minutes
  idle_warning_secs: '60',    // 60 seconds
  default_landing:   '/',
  default_theme:     'dark',
};

// ── Definition schema ─────────────────────────────────────────────────────────
export interface ConfigDef {
  key:            string;
  label:          string;
  description?:   string;
  type:           'select' | 'toggle' | 'number';
  options?:       { label: string; value: string }[];
  unit?:          string;
  section:        string;
  requiresReload?: boolean;
}

// Adding a new setting = one entry here, no other code changes needed.
export const CONFIG_DEFINITIONS: ConfigDef[] = [
  // ── Session ──────────────────────────────────────────────────────────────
  {
    key:            'idle_timeout_secs',
    label:          'Session timeout',
    description:    'How long a user can be idle before the sign-out warning appears.',
    type:           'number',
    unit:           'seconds',
    section:        'Session',
    requiresReload: true,
  },
  {
    key:            'idle_warning_secs',
    label:          'Warning countdown',
    description:    'How many seconds the sign-out countdown runs before auto sign-out.',
    type:           'number',
    unit:           'seconds',
    section:        'Session',
    requiresReload: true,
  },
  // ── Navigation ────────────────────────────────────────────────────────────
  {
    key:         'default_landing',
    label:       'Default landing page',
    description: 'Page to navigate to immediately after login.',
    type:        'select',
    section:     'Navigation',
    options: [
      { label: 'Landing Page', value: '/'          },
      { label: 'Dashboard',    value: '/dashboard'  },
      { label: 'My Gym',       value: '/gym'         },
    ],
  },
  // ── Appearance ────────────────────────────────────────────────────────────
  {
    key:         'default_theme',
    label:       'Default theme',
    description: 'Preferred colour scheme applied on login.',
    type:        'select',
    section:     'Appearance',
    options: [
      { label: 'Light', value: 'light' },
      { label: 'Dark',  value: 'dark'  },
    ],
  },
];

// ── Hook ──────────────────────────────────────────────────────────────────────
interface UseConfigReturn {
  config:        Record<string, string>;
  configLoading: boolean;
  configFor:     string | null;   // userId whose config is currently loaded
  get:           (key: string) => string;
  getNumber:     (key: string) => number | null;
  getBool:       (key: string) => boolean;
  updateConfig:  (key: string, value: string) => Promise<void>;
}

export function useConfig(): UseConfigReturn {
  const { user } = useAuth();
  const [configMap, setConfigMap] = useState<Record<string, string>>({});
  const [configLoading, setConfigLoading] = useState(true);
  const [configFor, setConfigFor] = useState<string | null>(null);

  const configMapRef = useRef(configMap);
  configMapRef.current = configMap;

  useEffect(() => {
    if (!user?.id) { setConfigFor(null); setConfigLoading(false); return; }
    setConfigLoading(true);
    supabase
      .from('config_settings')
      .select('key, value')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data ?? []).forEach((row: { key: string; value: string }) => {
          map[row.key] = row.value;
        });
        setConfigMap(map);
        setConfigFor(user.id);
        setConfigLoading(false);
      });
  }, [user?.id]);

  const get = useCallback(
    (key: string): string => configMapRef.current[key] ?? CONFIG_DEFAULTS[key] ?? '',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configMap],
  );

  const getNumber = useCallback(
    (key: string): number | null => {
      const raw = configMapRef.current[key] ?? CONFIG_DEFAULTS[key];
      if (raw == null) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configMap],
  );

  const getBool = useCallback(
    (key: string): boolean =>
      (configMapRef.current[key] ?? CONFIG_DEFAULTS[key]) === 'true',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configMap],
  );

  const updateConfig = useCallback(async (key: string, value: string): Promise<void> => {
    if (!user?.id) return;
    const prev = configMapRef.current;
    setConfigMap(c => ({ ...c, [key]: value }));

    const { error } = await supabase
      .from('config_settings')
      .upsert(
        { user_id: user.id, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' },
      );

    if (error) {
      setConfigMap(prev);
      throw error;
    }
  }, [user?.id]);

  return { config: configMap, configLoading, configFor, get, getNumber, getBool, updateConfig };
}
