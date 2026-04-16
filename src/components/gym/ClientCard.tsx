import type { GymClient } from '../../types/database';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const days   = Math.floor(ms / 86_400_000);
  const months = Math.floor(days / 30);
  const years  = Math.floor(months / 12);
  if (years  >= 1) return `${years}y`;
  if (months >= 1) return `${months}mo`;
  if (days   >= 1) return `${days}d`;
  return 'Today';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CATEGORY_STYLE: Record<string, string> = {
  Excellent: 'bg-green-100  dark:bg-green-950  text-green-700  dark:text-green-300',
  Good:      'bg-blue-100   dark:bg-blue-950   text-blue-700   dark:text-blue-300',
  Fair:      'bg-amber-100  dark:bg-amber-950  text-amber-700  dark:text-amber-300',
  Poor:      'bg-red-100    dark:bg-red-950    text-red-700    dark:text-red-300',
};

// ── ClientCard ────────────────────────────────────────────────────────────────

interface Props {
  client: GymClient;
  onClick: () => void;
}

/**
 * ClientCard — compact summary card for a single client in the trainer gym grid.
 * Click triggers the slide-in detail panel.
 */
export default function ClientCard({ client, onClick }: Props) {
  const name     = client.full_name ?? client.email;
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const catStyle = CATEGORY_STYLE[client.latest_category ?? ''] ?? CATEGORY_STYLE.Fair;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col gap-3 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all duration-150 group"
    >
      {/* Row 1 — avatar + name + score */}
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-sm font-bold flex items-center justify-center shrink-0 select-none">
          {initials}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
            {client.full_name ?? '—'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{client.email}</p>
        </div>

        {client.latest_score !== null && (
          <div className="shrink-0 text-right">
            <p className="text-lg font-extrabold text-gray-900 dark:text-white leading-none">
              {client.latest_score}
            </p>
            <p className="text-[10px] text-gray-400">/ 100</p>
          </div>
        )}
      </div>

      {/* Row 2 — chips */}
      <div className="flex items-center flex-wrap gap-1.5">
        {client.latest_category && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catStyle}`}>
            {client.latest_category}
          </span>
        )}

        {client.latest_bmi !== null && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            BMI {client.latest_bmi.toFixed(1)}
          </span>
        )}

        <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">
          {client.total_assessments} session{client.total_assessments !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Row 3 — joined + last assessed */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          Joined {timeAgo(client.trainer_joined_at)} ago
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {client.latest_taken_at ? `Last: ${formatDate(client.latest_taken_at)}` : 'No sessions yet'}
        </span>
      </div>
    </button>
  );
}
