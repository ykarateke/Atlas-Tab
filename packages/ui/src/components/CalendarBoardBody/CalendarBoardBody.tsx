import { useState } from "react";
import { useTranslation } from "../../i18n/I18nContext";
import { ChevronLeftIcon, ChevronRightIcon } from "../../icons/Icons";
import styles from "./CalendarBoardBody.module.css";

export interface CalendarBoardBodyProps {
  weekStart: 0 | 1;
  locale: "en" | "tr";
}

const DAYS_IN_GRID = 42; // 6 weeks x 7 days, enough to always cover a month

// Display-only month view — v1's event-dot code was never actually wired to
// persistence (data reset every reload), so v2 ships exactly that real
// behavior rather than a half-finished event system
// (FEATURE_SPECS.md § Widgets / Calendar).
export function getMonthGridDays(year: number, month: number, weekStart: 0 | 1): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const offset = (firstOfMonth.getDay() - weekStart + 7) % 7;
  const gridStart = new Date(year, month, 1 - offset);

  return Array.from(
    { length: DAYS_IN_GRID },
    (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i),
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function localeTag(locale: "en" | "tr"): string {
  return locale === "tr" ? "tr-TR" : "en-US";
}

export function CalendarBoardBody({ weekStart, locale }: CalendarBoardBodyProps) {
  const t = useTranslation();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const days = getMonthGridDays(viewYear, viewMonth, weekStart);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(localeTag(locale), {
    month: "long",
    year: "numeric",
  });
  const weekdayLabels = days
    .slice(0, 7)
    .map((d) => d.toLocaleDateString(localeTag(locale), { weekday: "narrow" }));

  function goToMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  return (
    <div className={styles.body}>
      <div className={styles.header}>
        <button
          type="button"
          aria-label={t("calendar.prevMonth")}
          onClick={() => goToMonth(-1)}
        >
          <ChevronLeftIcon width={14} height={14} />
        </button>
        <button
          type="button"
          className={styles.monthLabel}
          onClick={() => {
            setViewYear(today.getFullYear());
            setViewMonth(today.getMonth());
          }}
          title={t("calendar.today")}
        >
          {monthLabel}
        </button>
        <button
          type="button"
          aria-label={t("calendar.nextMonth")}
          onClick={() => goToMonth(1)}
        >
          <ChevronRightIcon width={14} height={14} />
        </button>
      </div>

      <div className={styles.weekdays}>
        {weekdayLabels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {days.map((day) => {
          const dayOfWeek = day.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const isOtherMonth = day.getMonth() !== viewMonth;
          const isToday = isSameDay(day, today);
          return (
            <span
              key={day.toISOString()}
              className={[
                styles.day,
                isWeekend ? styles.weekend : "",
                isOtherMonth ? styles.otherMonth : "",
                isToday ? styles.today : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {day.getDate()}
            </span>
          );
        })}
      </div>
    </div>
  );
}
