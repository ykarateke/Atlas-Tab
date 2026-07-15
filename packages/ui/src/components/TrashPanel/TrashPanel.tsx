import { useState } from "react";
import type { Bookmark, Board } from "@atlas-tab/core";
import { useTranslation } from "../../i18n/I18nContext";
import { CloseIcon } from "../../icons/Icons";
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
  const t = useTranslation();
  const [confirmingEmpty, setConfirmingEmpty] = useState(false);
  const isEmpty = trashedBoards.length === 0 && trashedBookmarks.length === 0;

  return (
    <section className={styles.panel} aria-label={t("trash.title")}>
      <header className={styles.header}>
        <h2>{t("trash.title")}</h2>
        {!isEmpty &&
          (confirmingEmpty ? (
            <span className={styles.confirmRow}>
              {t("trash.emptyConfirm")}
              <button
                type="button"
                onClick={() => {
                  setConfirmingEmpty(false);
                  onEmptyTrash();
                }}
              >
                {t("common.confirm")}
              </button>
              <button type="button" onClick={() => setConfirmingEmpty(false)}>
                {t("common.cancel")}
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmingEmpty(true)}>
              {t("trash.empty")}
            </button>
          ))}
      </header>

      {isEmpty && <p className={styles.empty}>{t("trash.isEmpty")}</p>}

      {trashedBoards.length > 0 && (
        <ul className={styles.list}>
          {trashedBoards.map((board) => {
            const count = trashedBookmarks.filter((bk) => bk.boardId === board.id).length;
            return (
              <li key={board.id} className={styles.row}>
                <span className={styles.name}>
                  {board.name} (
                  {count === 1
                    ? t("trash.bookmarkCountOne")
                    : t("trash.bookmarkCountOther", { count })}
                  )
                </span>
                <button type="button" onClick={() => onRestoreBoard(board.id)}>
                  {t("common.restore")}
                </button>
                <button
                  type="button"
                  aria-label={t("trash.permanentlyDeleteAria", { name: board.name })}
                  onClick={() => onPermanentlyDeleteBoard(board.id)}
                >
                  <CloseIcon width={12} height={12} />
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
                {t("common.restore")}
              </button>
              <button
                type="button"
                aria-label={t("trash.permanentlyDeleteAria", { name: bookmark.title })}
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
