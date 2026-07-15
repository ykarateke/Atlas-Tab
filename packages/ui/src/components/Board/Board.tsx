import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Board as BoardData } from "@atlas-tab/core";
import styles from "./Board.module.css";

export interface BoardProps {
  board: BoardData;
  onRename: (name: string) => void;
  onDelete: () => void;
  children: ReactNode;
}

export function Board({ board, onRename, onDelete, children }: BoardProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(board.name);
  const [menuOpen, setMenuOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: board.id,
    data: { type: "board", col: board.col, row: board.row },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function commitRename() {
    setEditing(false);
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== board.name) onRename(trimmed);
    else setDraftName(board.name);
  }

  function handleTitleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      setDraftName(board.name);
      setEditing(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.board} ${isDragging ? styles.dragging : ""}`}
    >
      <div className={styles.header}>
        <button
          type="button"
          className={styles.dragHandle}
          aria-label={`Drag ${board.name}`}
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        {editing ? (
          <input
            autoFocus
            className={styles.renameInput}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleTitleKeyDown}
          />
        ) : (
          <button type="button" className={styles.title} onDoubleClick={() => setEditing(true)}>
            {board.name}
          </button>
        )}
        <div className={styles.menuWrapper}>
          <button
            type="button"
            aria-label={`${board.name} menu`}
            className={styles.menuButton}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ⋯
          </button>
          {menuOpen && (
            <div className={styles.menu} role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setEditing(true);
                }}
              >
                Rename
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
