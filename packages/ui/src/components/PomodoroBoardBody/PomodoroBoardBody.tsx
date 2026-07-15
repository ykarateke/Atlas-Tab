import { useEffect, useRef, useState } from "react";
import type { PomodoroTimerState, TranslationKey } from "@atlas-tab/core";
import { computeRemainingSeconds } from "@atlas-tab/core";
import { useTranslation } from "../../i18n/I18nContext";
import { PauseIcon, PlayIcon, RefreshIcon } from "../../icons/Icons";
import { playBeep } from "../../audio/playBeep";
import styles from "./PomodoroBoardBody.module.css";

export interface PomodoroBoardBodyProps {
  timer: PomodoroTimerState;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onTick: () => void;
}

const PHASE_LABEL_KEYS: Record<PomodoroTimerState["phase"], TranslationKey> = {
  focus: "pomodoro.phase.focus",
  shortBreak: "pomodoro.phase.shortBreak",
  longBreak: "pomodoro.phase.longBreak",
};

function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// `now` is refreshed once a second via the effect below (never read directly
// during render, which React's purity rules disallow) purely to force the
// displayed countdown to update — the actual remaining time is always
// derived fresh from wall-clock time via computeRemainingSeconds, never
// decremented per-tick (FEATURE_SPECS.md § Widgets / Pomodoro).
export function PomodoroBoardBody({ timer, onStart, onPause, onReset, onTick }: PomodoroBoardBodyProps) {
  const t = useTranslation();
  const prevPhaseRef = useRef(timer.phase);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer.running) return;
    // The first correction lands within 1s via this interval — close enough
    // for a countdown display that a synchronous pre-fire isn't worth the
    // extra render-during-effect this would otherwise require.
    const interval = setInterval(() => {
      onTick();
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [timer.running, onTick]);

  useEffect(() => {
    if (prevPhaseRef.current !== timer.phase) playBeep();
    prevPhaseRef.current = timer.phase;
  }, [timer.phase]);

  const remaining = computeRemainingSeconds(timer, now);

  return (
    <div className={styles.body}>
      <div className={styles.phase}>{t(PHASE_LABEL_KEYS[timer.phase])}</div>
      <div className={styles.time}>{formatTime(remaining)}</div>
      <div className={styles.controls}>
        {timer.running ? (
          <button type="button" aria-label={t("pomodoro.pause")} onClick={onPause}>
            <PauseIcon width={16} height={16} />
          </button>
        ) : (
          <button type="button" aria-label={t("pomodoro.start")} onClick={onStart}>
            <PlayIcon width={16} height={16} />
          </button>
        )}
        <button type="button" aria-label={t("pomodoro.reset")} onClick={onReset}>
          <RefreshIcon width={14} height={14} />
        </button>
      </div>
      <div className={styles.sessions}>{t("pomodoro.sessions", { count: timer.sessionsCompleted })}</div>
    </div>
  );
}
