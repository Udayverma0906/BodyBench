import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import ClientDetailPanel from '../../components/gym/ClientDetailPanel';
import { supabase } from '../../lib/supabase';
import type { AdminUser, GymClient } from '../../types/database';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const ms     = Date.now() - new Date(iso).getTime();
  const months = Math.floor(ms / (1000 * 60 * 60 * 24 * 30));
  const years  = Math.floor(months / 12);
  if (years  >= 1) return `${years}y ago`;
  if (months >= 1) return `${months}mo ago`;
  return 'This month';
}

const CATEGORY_STYLE: Record<string, string> = {
  Excellent: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
  Good:      'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300',
  Fair:      'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
  Poor:      'bg-red-100   dark:bg-red-950   text-red-700   dark:text-red-300',
};

/** Convert AdminUser to the GymClient shape ClientDetailPanel expects */
function toGymClient(u: AdminUser): GymClient {
  return {
    user_id:           u.user_id,
    email:             u.email,
    full_name:         u.full_name,
    trainer_joined_at: u.trainer_joined_at,
    latest_score:      u.latest_score,
    latest_category:   u.latest_category,
    latest_taken_at:   u.latest_taken_at,
    total_assessments: u.total_assessments,
    latest_bmi:        u.latest_bmi,
  };
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function ScoreSparkline({ scores }: { scores: number[] }) {
  if (!scores || scores.length < 2) {
    return <span className="text-xs text-gray-300 dark:text-gray-600">—</span>;
  }
  const W = 72, H = 28, PAD = 2;
  const min = Math.min(...scores), max = Math.max(...scores);
  const range = max - min || 1;
  const pts = scores.map((s, i) => {
    const x = PAD + (i / (scores.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((s - min) / range) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const trend = scores[scores.length - 1] - scores[0];
  const color = trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#94a3b8';
  return (
    <svg width={W} height={H} className="overflow-visible" aria-label="Score trend">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── AllUsersPage ──────────────────────────────────────────────────────────────

export default function AllUsersPage() {
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [trainerFilter, setTrainerFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser]   = useState<GymClient | null>(null);

  useEffect(() => {
    supabase
      .rpc('get_all_users_admin')
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setUsers((data as AdminUser[]) ?? []);
        setLoading(false);
      });
  }, []);

  const trainers = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(u => {
      if (u.trainer_id) {
        // use name if available, otherwise fall back to trainer_id (UUID) as key only — label comes from email later
        if (!map.has(u.trainer_id)) map.set(u.trainer_id, u.trainer_name ?? u.trainer_id);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      const matchSearch = !q ||
        (u.full_name ?? '').toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.trainer_name ?? '').toLowerCase().includes(q);
      const matchTrainer =
        trainerFilter === 'all' ? true :
        trainerFilter === '__none__' ? !u.trainer_id :
        u.trainer_id === trainerFilter;
      return matchSearch && matchTrainer;
    });
  }, [users, search, trainerFilter]);

  const withTrainer  = users.filter(u => !!u.trainer_id).length;
  const trainerCount = users.filter(u => u.user_role === 'admin').length;
  const avgScore = (() => {
    const vals = users.map(u => u.latest_score).filter((v): v is number => v !== null);
    return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null;
  })();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Users</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {users.length} account{users.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <SummaryChip label="With trainer"  value={String(withTrainer)}   color="indigo" />
            <SummaryChip label="Trainers"       value={String(trainerCount)}  color="amber"  />
            <SummaryChip label="Unassigned"     value={String(users.filter(u => !u.trainer_id && u.user_role === 'user').length)} />
            {avgScore !== null && <SummaryChip label="Avg score" value={String(avgScore)} color="green" />}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or trainer…"
            className="flex-1 min-w-[200px] px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          <select
            value={trainerFilter}
            onChange={e => setTrainerFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="all">All trainers</option>
            <option value="__none__">Unassigned</option>
            {trainers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">
            {search || trainerFilter !== 'all' ? 'No users match your filters.' : 'No users yet.'}
          </p>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-700">
                  <th className="px-5 py-3 text-left   text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-[32%]">User</th>
                  <th className="px-4 py-3 text-left   text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-[10%]">Role</th>
                  <th className="px-4 py-3 text-left   text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-[20%]">Trainer</th>
                  <th className="px-4 py-3 text-right  text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-[12%]">Score</th>
                  <th className="px-4 py-3 text-right  text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-[10%]">BMI</th>
                  <th className="px-5 py-3 text-right  text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-[16%]">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/60">
                {filtered.map(u => (
                  <UserRow key={u.user_id} user={u} onClick={() => setSelectedUser(toGymClient(u))} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Detail panel — reuses the trainer gym panel with RPC access */}
      <ClientDetailPanel client={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
}

// ── UserRow ───────────────────────────────────────────────────────────────────

function UserRow({ user, onClick }: { user: AdminUser; onClick: () => void }) {
  const displayName   = user.full_name ?? user.email.split('@')[0];
  const initials      = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const catStyle      = CATEGORY_STYLE[user.latest_category ?? ''] ?? CATEGORY_STYLE.Fair;
  const isTrainer     = user.user_role === 'admin';
  const trainerLabel  = user.trainer_name ?? (user.trainer_id ? 'Trainer' : null);

  return (
    <tr
      onClick={onClick}
      className="hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors group"
    >
      {/* User */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className={`w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center shrink-0 select-none ${
            isTrainer
              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
              : 'bg-blue-100   dark:bg-blue-900/40   text-blue-700   dark:text-blue-300'
          }`}>
            {initials}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              {user.total_assessments} session{user.total_assessments !== 1 ? 's' : ''}
              {user.latest_taken_at && ` · ${formatDate(user.latest_taken_at)}`}
            </p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3.5">
        {isTrainer ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
            Trainer
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            User
          </span>
        )}
      </td>

      {/* Trainer */}
      <td className="px-4 py-3.5">
        {trainerLabel ? (
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{trainerLabel}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo(user.trainer_joined_at)}</p>
          </div>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
            Unassigned
          </span>
        )}
      </td>

      {/* Score */}
      <td className="px-4 py-3.5 text-right">
        {user.latest_score !== null ? (
          <div className="flex flex-col items-end gap-1">
            <span className="text-base font-extrabold text-gray-900 dark:text-white leading-none">
              {user.latest_score}
            </span>
            {user.latest_category && (
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${catStyle}`}>
                {user.latest_category}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
        )}
      </td>

      {/* BMI */}
      <td className="px-4 py-3.5 text-right">
        {user.latest_bmi !== null ? (
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {user.latest_bmi.toFixed(1)}
          </span>
        ) : (
          <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
        )}
      </td>

      {/* Sparkline */}
      <td className="px-5 py-3.5">
        <div className="flex justify-end">
          <ScoreSparkline scores={user.score_history ?? []} />
        </div>
      </td>
    </tr>
  );
}

// ── SummaryChip ───────────────────────────────────────────────────────────────

function SummaryChip({ label, value, color }: { label: string; value: string; color?: 'indigo' | 'green' | 'amber' }) {
  const cls = color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400'
            : color === 'green'  ? 'text-green-600  dark:text-green-400'
            : color === 'amber'  ? 'text-amber-500  dark:text-amber-400'
            : 'text-gray-700 dark:text-gray-300';
  return (
    <div className="text-center">
      <p className={`text-xl font-extrabold leading-none ${cls}`}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
