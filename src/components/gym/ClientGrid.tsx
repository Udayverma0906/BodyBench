import { useMemo, useState } from 'react';
import type { GymClient } from '../../types/database';
import ClientCard from './ClientCard';

// ── Helpers ───────────────────────────────────────────────────────────────────

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isActive(client: GymClient): boolean {
  if (!client.latest_taken_at) return false;
  return Date.now() - new Date(client.latest_taken_at).getTime() < THIRTY_DAYS_MS;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'active' | 'inactive';
type Sort   = 'recent' | 'score' | 'name';

// ── ClientGrid ────────────────────────────────────────────────────────────────

interface Props {
  clients: GymClient[];
  loading: boolean;
  onClientClick: (client: GymClient) => void;
}

/**
 * ClientGrid — filterable, sortable grid of client cards for the trainer gym view.
 */
export default function ClientGrid({ clients, loading, onClientClick }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort,   setSort]   = useState<Sort>('recent');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = [...clients];

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        (c.full_name ?? '').toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }

    // Filter
    if (filter === 'active')   list = list.filter(isActive);
    if (filter === 'inactive') list = list.filter(c => !isActive(c));

    // Sort
    if (sort === 'recent') list.sort((a, b) =>
      (b.latest_taken_at ?? '').localeCompare(a.latest_taken_at ?? '')
    );
    if (sort === 'score') list.sort((a, b) =>
      (b.latest_score ?? -1) - (a.latest_score ?? -1)
    );
    if (sort === 'name') list.sort((a, b) =>
      (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email)
    );

    return list;
  }, [clients, filter, sort, search]);

  // Summary stats
  const activeCount = clients.filter(isActive).length;
  const avgBmi = (() => {
    const vals = clients.map(c => c.latest_bmi).filter((v): v is number => v !== null);
    return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : null;
  })();

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      {clients.length > 0 && (
        <div className="flex items-center gap-4 px-1">
          <StatChip label="Total" value={String(clients.length)} />
          <StatChip label="Active" value={String(activeCount)} color="green" />
          {avgBmi && <StatChip label="Avg BMI" value={avgBmi} color="blue" />}
        </div>
      )}

      {/* Search + controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clients…"
          className="flex-1 min-w-[160px] px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        />

        {/* Filter pills */}
        <div className="flex items-center gap-1">
          {(['all', 'active', 'inactive'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize transition ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sort select */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as Sort)}
          className="px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        >
          <option value="recent">Recent</option>
          <option value="score">Score</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">
          {search || filter !== 'all' ? 'No clients match your filter.' : 'No clients yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(c => (
            <ClientCard key={c.user_id} client={c} onClick={() => onClientClick(c)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inline sub-component ──────────────────────────────────────────────────────

function StatChip({ label, value, color }: { label: string; value: string; color?: 'green' | 'blue' }) {
  const cls = color === 'green' ? 'text-green-600 dark:text-green-400'
            : color === 'blue'  ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-900 dark:text-white';
  return (
    <div className="flex flex-col">
      <span className={`text-base font-extrabold leading-none ${cls}`}>{value}</span>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{label}</span>
    </div>
  );
}
