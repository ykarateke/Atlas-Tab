import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Bookmark } from "@atlas-tab/core";
import { BookmarkItem } from "../BookmarkItem/BookmarkItem";
import { BookmarkForm, type BookmarkFormValues } from "../BookmarkForm/BookmarkForm";
import { useTranslation } from "../../i18n/I18nContext";
import styles from "./BookmarksBoardBody.module.css";

export interface BookmarksBoardBodyProps {
  boardId: string;
  bookmarks: Bookmark[]; // already filtered to this board, sorted by order
  openInNewTab: boolean;
  hideExtraBookmarks: boolean;
  maxBookmarksShown: 5 | 10 | 15 | 20;
  onAddBookmark: (values: BookmarkFormValues) => void;
  onSaveEdit: (bookmarkId: string, values: BookmarkFormValues) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onOpenBackground: (bookmark: Bookmark) => void;
  onOpenIncognito: (bookmark: Bookmark) => void;
}

export function BookmarksBoardBody({
  boardId,
  bookmarks,
  openInNewTab,
  hideExtraBookmarks,
  maxBookmarksShown,
  onAddBookmark,
  onSaveEdit,
  onDeleteBookmark,
  onOpenBackground,
  onOpenIncognito,
}: BookmarksBoardBodyProps) {
  const t = useTranslation();
  const [formMode, setFormMode] = useState<null | "add" | Bookmark>(null);
  // Expanded state is UI-only and resets on reload, not persisted
  // (FEATURE_SPECS.md § Bookmarks).
  const [expanded, setExpanded] = useState(false);
  const { setNodeRef: setEndDroppableRef } = useDroppable({
    id: `bookmark-board-end-${boardId}`,
    data: { type: "bookmark-board-end", boardId },
  });

  const shouldCollapse = hideExtraBookmarks && !expanded && bookmarks.length > maxBookmarksShown;
  const visibleBookmarks = shouldCollapse ? bookmarks.slice(0, maxBookmarksShown) : bookmarks;
  const hiddenCount = bookmarks.length - visibleBookmarks.length;

  return (
    <div className={styles.body}>
      <div ref={setEndDroppableRef} className={styles.list}>
        {visibleBookmarks.map((bookmark) => (
          <BookmarkItem
            key={bookmark.id}
            bookmark={bookmark}
            openInNewTab={openInNewTab}
            onOpenBackground={onOpenBackground}
            onOpenIncognito={onOpenIncognito}
            onEdit={(bk) => setFormMode(bk)}
            onDelete={onDeleteBookmark}
          />
        ))}
      </div>

      {hiddenCount > 0 && (
        <button type="button" className={styles.showMore} onClick={() => setExpanded(true)}>
          {hiddenCount === 1
            ? t("bookmark.showMoreOne")
            : t("bookmark.showMoreOther", { count: hiddenCount })}
        </button>
      )}

      {formMode ? (
        <BookmarkForm
          initial={
            formMode === "add"
              ? undefined
              : { url: formMode.url, title: formMode.title, description: formMode.description }
          }
          onCancel={() => setFormMode(null)}
          onSave={(values) => {
            if (formMode === "add") onAddBookmark(values);
            else onSaveEdit(formMode.id, values);
            setFormMode(null);
          }}
        />
      ) : (
        <button type="button" className={styles.addButton} onClick={() => setFormMode("add")}>
          {t("bookmark.add")}
        </button>
      )}
    </div>
  );
}
