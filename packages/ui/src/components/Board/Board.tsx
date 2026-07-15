import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Board as BoardData } from "@atlas-tab/core";
import { useTranslation } from "../../i18n/I18nContext";
import { combineRefs } from "../../dnd/combineRefs";
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

  // Plain draggable + droppable (not dnd-kit's "sortable" preset, which
  // scopes its collision detection to a single SortableContext) — boards
  // need to be draggable *across* per-column containers, which sortable
  // makes unreliable. Both hooks share one DOM node via combineRefs.
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: board.id,
    data: { type: "board", col: board.col, row: board.row },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `board-drop-${board.id}`,
    data: { type: "board", col: board.col, row: board.row },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
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
      ref={combineRefs(setDragRef, setDropRef)}
      style={style}
      className={`${styles.board} ${isDragging ? styles.dragging : ""} ${isOver ? styles.dropTarget : ""}`}
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
