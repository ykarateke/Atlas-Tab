import { useState } from "react";
import type { Bookmark, Board } from "@atlas-tab/core";
import styles from "./TrashPanel.module.css";

export interface TrashPanelProps {
  trashedBoards: Array<Board & { deletedAt: number }>;
  trashedBookmarks: Array<Bookmark & { deletedAt: number }>;
  onRestoreBoard: (boardId: string) => void;
  onPermanentlyDeleteBoard: (boardId: string) => void;
  onRestoreBookmark: (bookmarkId: string) => void;
  onPermanentlyDeleteBookmark: (bookmarkId: string) => void;
  onEmptyTrash: () => void;
}

export function TrashPanel({
  trashedBoards,
  trashedBookmarks,
  onRestoreBoard,
  onPermanentlyDeleteBoard,
  onRestoreBookmark,
  onPermanentlyDeleteBookmark,
  onEmptyTrash,
}: TrashPanelProps) {
  const [confirmingEmpty, setConfirmingEmpty] = useState(false);
  const isEmpty = trashedBoards.length === 0 && trashedBookmarks.length === 0;

  return (
    <section className={styles.panel} aria-label="Trash">
      <header className={styles.header}>
        <h2>Trash</h2>
        {!isEmpty &&
          (confirmingEmpty ? (
            <span className={styles.confirmRow}>
              Empty trash?
              <button
                type="button"
                onClick={() => {
                  setConfirmingEmpty(false);
                  onEmptyTrash();
                }}
              >
                Confirm
              </button>
              <button type="button" onClick={() => setConfirmingEmpty(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmingEmpty(true)}>
              Empty trash
            </button>
          ))}
      </header>

      {isEmpty && <p className={styles.empty}>Trash is empty.</p>}

      {trashedBoards.length > 0 && (
        <ul className={styles.list}>
          {trashedBoards.map((board) => {
            const count = trashedBookmarks.filter((bk) => bk.boardId === board.id).length;
            return (
              <li key={board.id} className={styles.row}>
                <span className={styles.name}>
                  {board.name} ({count} bookmark{count === 1 ? "" : "s"})
                </span>
                <button type="button" onClick={() => onRestoreBoard(board.id)}>
                  Restore
                </button>
                <button
                  type="button"
                  aria-label={`Permanently delete ${board.name}`}
                  onClick={() => onPermanentlyDeleteBoard(board.id)}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {trashedBookmarks.length > 0 && (
        <ul className={styles.list}>
          {trashedBookmarks.map((bookmark) => (
            <li key={bookmark.id} className={styles.row}>
              <span className={styles.name}>{bookmark.title}</span>
              <button type="button" onClick={() => onRestoreBookmark(bookmark.id)}>
                Restore
              </button>
              <button
                type="button"
                aria-label={`Permanently delete ${bookmark.title}`}
                onClick={() => onPermanentlyDeleteBookmark(bookmark.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
