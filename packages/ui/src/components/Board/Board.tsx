import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Board as BoardData } from "@atlas-tab/core";
import { useTranslation } from "../../i18n/I18nContext";
import { GripIcon, MoreIcon } from "../../icons/Icons";
import styles from "./Board.module.css";

export interface BoardProps {
  board: BoardData;
  onRename: (name: string) => void;
  onDelete: () => void;
  children: ReactNode;
}

export function Board({ board, onRename, onDelete, children }: BoardProps) {
  const t = useTranslation();
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
          aria-label={t("board.dragAria", { name: board.name })}
          {...attributes}
          {...listeners}
        >
          <GripIcon width={14} height={14} />
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
            aria-label={t("board.menuAria", { name: board.name })}
            className={styles.menuButton}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreIcon width={16} height={16} />
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
                {t("board.rename")}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                {t("board.delete")}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
