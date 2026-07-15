import type { BoardType } from "@atlas-tab/core";
import styles from "./PlaceholderBoardBody.module.css";

const TYPE_LABELS: Record<Exclude<BoardType, "bookmarks">, string> = {
  notes: "Notes",
  calendar: "Calendar",
  pomodoro: "Pomodoro",
  search: "Search",
};

export interface PlaceholderBoardBodyProps {
  type: Exclude<BoardType, "bookmarks">;
}

// Structural placeholder for board types whose interactive content (notes
// autosave, calendar month view, pomodoro timer, search mini-input) ships in
// a later phase — see ROADMAP.md Phase 2. The board itself is fully
// creatable/draggable/deletable in Phase 1, only the body is inert.
export function PlaceholderBoardBody({ type }: PlaceholderBoardBodyProps) {
  return <p className={styles.placeholder}>{TYPE_LABELS[type]} — coming soon</p>;
}
