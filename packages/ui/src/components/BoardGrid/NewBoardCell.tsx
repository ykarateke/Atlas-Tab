import { useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import type { BoardType, NewBoard } from "@atlas-tab/core";
import styles from "./BoardGrid.module.css";

const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  bookmarks: "Bookmarks",
  notes: "Notes",
  calendar: "Calendar",
  pomodoro: "Pomodoro",
  search: "Search",
};

function buildDraft(
  type: BoardType,
  pageId: string,
  col: number,
  row: number,
  name: string,
): NewBoard {
  const base = { pageId, col, row, name };
  switch (type) {
    case "bookmarks":
      return { ...base, type };
    case "notes":
      return { ...base, type, content: "", height: 160 };
    case "calendar":
      return { ...base, type };
    case "pomodoro":
      return {
        ...base,
        type,
        settings: {
          focusMinutes: 25,
          shortBreakMinutes: 5,
          longBreakMinutes: 15,
          cyclesBeforeLongBreak: 4,
        },
      };
    case "search":
      return { ...base, type, searchEngineId: "default" };
  }
}

export interface NewBoardCellProps {
  pageId: string;
  col: number;
  row: number;
  onCreate: (draft: NewBoard) => void;
}

// A newly created board with no name typed before it loses focus is
// discarded, not saved (FEATURE_SPECS.md § Boards) — nothing is committed to
// the store until the whole form (name input or type select) loses focus
// with a non-blank name.
export function NewBoardCell({ pageId, col, row, onCreate }: NewBoardCellProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<BoardType>("bookmarks");

  function commit() {
    const trimmed = name.trim();
    setOpen(false);
    setName("");
    setType("bookmarks");
    if (trimmed) onCreate(buildDraft(type, pageId, col, row, trimmed));
  }

  function handleFormBlur(e: FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) commit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      setName("");
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className={styles.newBoardButton}
        aria-label="Add board"
        onClick={() => setOpen(true)}
      >
        +
      </button>
    );
  }

  return (
    <div className={styles.newBoardForm} onBlur={handleFormBlur}>
      <select
        aria-label="Board type"
        value={type}
        onChange={(e) => setType(e.target.value as BoardType)}
      >
        {Object.entries(BOARD_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input
        autoFocus
        placeholder="Board name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
