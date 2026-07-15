import styles from "./ClockWidget.module.css";

export interface ClockWidgetProps {
  now: Date;
  timeFormat: "12h" | "24h";
  dateFormat: "DMY" | "MDY" | "YMD";
}

function formatTime(date: Date, timeFormat: "12h" | "24h"): string {
  const minutes = String(date.getMinutes()).padStart(2, "0");
  if (timeFormat === "24h") {
    return `${String(date.getHours()).padStart(2, "0")}:${minutes}`;
  }
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes} ${hours24 < 12 ? "AM" : "PM"}`;
}

function formatDate(date: Date, dateFormat: "DMY" | "MDY" | "YMD"): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  if (dateFormat === "MDY") return `${mm}/${dd}/${yyyy}`;
  if (dateFormat === "YMD") return `${yyyy}-${mm}-${dd}`;
  return `${dd}.${mm}.${yyyy}`;
}

// Purely a function of the `now` prop — the owning app is responsible for
// updating it on the minute boundary (kept out of this component so the
// impure `new Date()` read lives in exactly one place; see App.tsx).
export function ClockWidget({ now, timeFormat, dateFormat }: ClockWidgetProps) {
  return (
    <div className={styles.clock}>
      <span className={styles.time}>{formatTime(now, timeFormat)}</span>
      <span className={styles.date}>{formatDate(now, dateFormat)}</span>
    </div>
  );
}
