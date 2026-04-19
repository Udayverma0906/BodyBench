import { Clock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  countdown: number;
  warningSeconds: number;
  onContinue: () => void;
  onSignOut: () => void;
}

export default function IdleWarningModal({
  isOpen,
  countdown,
  warningSeconds,
  onContinue,
  onSignOut,
}: Props) {
  if (!isOpen) return null;

  const pct        = Math.max(0, Math.min(100, (countdown / warningSeconds) * 100));
  const isUrgent   = countdown <= 10;
  const numColor   = isUrgent
    ? 'text-red-500 dark:text-red-400'
    : 'text-amber-500 dark:text-amber-400';
  const barColor   = isUrgent
    ? 'bg-red-500'
    : 'bg-amber-500';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 p-6 flex flex-col items-center gap-5">

        {/* Clock icon */}
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <Clock className="w-7 h-7 text-amber-500 dark:text-amber-400" />
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Session expiring soon
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            You've been inactive. Sign out or continue?
          </p>
        </div>

        {/* Countdown number */}
        <div className={`text-5xl font-extrabold leading-none tabular-nums transition-colors ${numColor}`}>
          {countdown}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onSignOut}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
          >
            Sign out
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
          >
            Continue session
          </button>
        </div>
      </div>
    </div>
  );
}
