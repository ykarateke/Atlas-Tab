import { useState } from "react";
import type { FocusStatEntry } from "@atlas-tab/core";
import { useTranslation } from "../../i18n/I18nContext";
import styles from "./FocusStatsWidget.module.css";

export interface FocusStatsWidgetProps {
  now: Date;
  focusStats: FocusStatEntry[];
}

const HISTORY_DAYS = 7;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function minutesOnDay(focusStats: FocusStatEntry[], day: Date): number {
  return focusStats
    .filter((entry) => isSameDay(new Date(entry.ts), day))
    .reduce((sum, entry) => sum + entry.minutes, 0);
}

function lastNDays(now: Date, count: number): Date[] {
  return Array.from(
    { length: count },
    (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - (count - 1 - i)),
  );
}

function formatMinutes(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

// Only rendered by the caller at all if at least one pomodoro board exists
// anywhere in the workspace (FEATURE_SPECS.md § Widgets / Pomodoro).
export function FocusStatsWidget({ now, focusStats }: FocusStatsWidgetProps) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);

  const days = lastNDays(now, HISTORY_DAYS);
  const dailyMinutes = days.map((d) => minutesOnDay(focusStats, d));
  const todayMinutes = dailyMinutes[dailyMinutes.length - 1] ?? 0;
  const maxMinutes = Math.max(1, ...dailyMinutes);

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.pill}
        aria-label={t("focusStats.openAria")}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.label}>{t("focusStats.today")}</span>
        <span className={styles.value}>{formatMinutes(todayMinutes)}</span>
      </button>

      {open && (
        <div className={styles.popup}>
          <div className={styles.bars}>
            {days.map((d, i) => (
              <div key={d.toISOString()} className={styles.barCol}>
                <div className={styles.barTrack}>
                  <div
                    className={styles.bar}
                    style={{ height: `${Math.max(2, (dailyMinutes[i]! / maxMinutes) * 100)}%` }}
                  />
                </div>
                <span className={styles.barLabel}>
                  {d.toLocaleDateString(undefined, { weekday: "narrow" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
