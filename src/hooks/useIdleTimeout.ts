import { useCallback, useEffect, useRef, useState } from 'react';

const ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click',
] as const;

interface UseIdleTimeoutReturn {
  showWarning: boolean;
  countdown: number;
  resetTimer: () => void;
  signOutNow: () => void;
}

export function useIdleTimeout(
  idleMs: number,
  warningMs: number,
  onSignOut: () => void,
): UseIdleTimeoutReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(Math.floor(warningMs / 1000));

  const idleTimer       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningShown    = useRef(false);
  // Keep onSignOut in a ref so it never enters useCallback/useEffect dep arrays.
  // Without this, a new inline arrow from the parent every render would cause
  // showWarningModal → resetTimer → useEffect to all recreate, re-running
  // resetTimer() and instantly dismissing the modal on the first countdown tick.
  const onSignOutRef = useRef(onSignOut);
  onSignOutRef.current = onSignOut;

  const clearCountdown = useCallback(() => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
  }, []);

  const showWarningModal = useCallback(() => {
    warningShown.current = true;
    setShowWarning(true);
    setCountdown(Math.floor(warningMs / 1000));

    clearCountdown();
    countdownTimer.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearCountdown();
          onSignOutRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [warningMs, clearCountdown]); // onSignOut intentionally excluded — using ref above

  const resetTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    clearCountdown();
    warningShown.current = false;
    setShowWarning(false);
    setCountdown(Math.floor(warningMs / 1000));

    idleTimer.current = setTimeout(showWarningModal, idleMs);
  }, [idleMs, warningMs, showWarningModal, clearCountdown]);

  // Re-registers activity listeners and restarts idle timer when idleMs/warningMs change
  useEffect(() => {
    const onActivity = () => {
      if (!warningShown.current) resetTimer();
    };

    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, onActivity));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      clearCountdown();
    };
  }, [idleMs, warningMs, resetTimer, showWarningModal, clearCountdown]);

  return { showWarning, countdown, resetTimer, signOutNow: () => onSignOutRef.current() };
}
