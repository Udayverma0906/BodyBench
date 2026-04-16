import { useEffect } from 'react';
import type { GymClient } from '../../types/database';
import { useDashboardData } from '../../hooks/useDashboardData';
import DashboardGrid from '../dashboard/DashboardGrid';
import StatWidget from '../dashboard/widgets/StatWidget';
import TrendWidget from '../dashboard/widgets/TrendWidget';
import BarWidget from '../dashboard/widgets/BarWidget';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const ms     = Date.now() - new Date(iso).getTime();
  const months = Math.floor(ms / (1000 * 60 * 60 * 24 * 30));
  const years  = Math.floor(months / 12);
  if (years >= 1) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months >= 1) return `${months} month${months > 1 ? 's' : ''} ago`;
  return 'This month';
}

const CATEGORY_STYLE: Record<string, string> = {
  Excellent: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
  Good:      'bg-blue-100  dark:bg-blue-950  text-blue-700  dark:text-blue-300',
  Fair:      'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
  Poor:      'bg-red-100   dark:bg-red-950   text-red-700   dark:text-red-300',
};

// ── ClientDetailPanel ─────────────────────────────────────────────────────────

interface Props {
  client: GymClient | null;
  onClose: () => void;
}

/**
 * ClientDetailPanel — slide-in panel showing a client's full dashboard.
 * Reuses all existing dashboard widgets for consistency.
 */
export default function ClientDetailPanel({ client, onClose }: Props) {
  // useRpc=true: trainer/superadmin cannot read another user's assessments via
  // direct table query (RLS blocks it). The get_client_assessments() RPC is
  // SECURITY DEFINER and checks the caller is the client's trainer or superadmin.
  const data = useDashboardData(client?.user_id ?? '', true);

  // Block body scroll when panel is open
  useEffect(() => {
    if (client) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [client]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isOpen = !!client;

  const series     = data.scoreTimeSeries;
  const prevScore  = series.length >= 2 ? series[series.length - 2].value : null;
  const latestDelta = data.latestScore !== null && prevScore !== null
    ? data.latestScore - prevScore : null;

  const name     = client?.full_name ?? client?.email ?? '—';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const catStyle = CATEGORY_STYLE[client?.latest_category ?? ''] ?? CATEGORY_STYLE.Fair;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ zIndex: 1100 }}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ zIndex: 1200 }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-4 px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          {/* Avatar */}
          <span className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-sm font-bold flex items-center justify-center shrink-0 select-none">
            {initials}
          </span>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-gray-900 dark:text-white truncate">{client?.full_name ?? '—'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{client?.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {client?.latest_category && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catStyle}`}>
                  {client.latest_category}
                </span>
              )}
              {client?.latest_score !== null && (
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {client?.latest_score} / 100
                </span>
              )}
              {client?.latest_bmi !== null && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  BMI {client?.latest_bmi?.toFixed(1)}
                </span>
              )}
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Joined {timeAgo(client?.trainer_joined_at ?? null)}
              </span>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!client ? null : (
            <DashboardGrid>
              <StatWidget
                title="Assessments"
                subtitle="Total taken"
                loading={data.loading}
                data={{ value: data.totalAssessments, color: 'blue' }}
                colSpan={1}
              />
              <StatWidget
                title="Latest Score"
                subtitle="Most recent"
                loading={data.loading}
                data={
                  data.latestScore !== null
                    ? {
                        value: data.latestScore,
                        unit: '/ 100',
                        color: 'default',
                        delta: latestDelta !== null ? { value: latestDelta, vs: 'vs prev' } : undefined,
                      }
                    : { value: '—' }
                }
                colSpan={1}
              />
              <StatWidget
                title="Best Score"
                subtitle="All time"
                loading={data.loading}
                data={data.bestScore !== null ? { value: data.bestScore, unit: '/ 100', color: 'green' } : { value: '—' }}
                colSpan={1}
              />
              <StatWidget
                title="Avg Score"
                subtitle="All sessions"
                loading={data.loading}
                data={data.avgScore !== null ? { value: data.avgScore, unit: '/ 100', color: 'amber' } : { value: '—' }}
                colSpan={1}
              />

              <TrendWidget
                title="Score Trend"
                subtitle="Overall fitness over time"
                loading={data.loading}
                data={data.scoreTimeSeries}
                yMin={0}
                yMax={100}
                colSpan={4}
              />

              {!data.loading && data.bmiTimeSeries.length > 0 && (
                <TrendWidget
                  title="BMI Trend"
                  subtitle="Body Mass Index over time"
                  loading={data.loading}
                  data={data.bmiTimeSeries}
                  color="#22c55e"
                  valueFormatter={v => v.toFixed(1)}
                  colSpan={4}
                />
              )}

              <BarWidget
                title="Avg Score by Metric"
                subtitle="% of max points per category"
                loading={data.loading}
                data={data.avgBreakdown}
                colSpan={4}
              />
            </DashboardGrid>
          )}

          {!data.loading && data.totalAssessments === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">
              No assessments yet.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
