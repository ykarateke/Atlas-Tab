import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Bookmark } from "@atlas-tab/core";
import { useFavicon } from "../../favicon/FaviconContext";
import styles from "./BookmarkItem.module.css";

export interface BookmarkItemProps {
  bookmark: Bookmark;
  openInNewTab: boolean;
  onOpenBackground: (bookmark: Bookmark) => void;
  onOpenIncognito: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: string) => void;
}

export function BookmarkItem({
  bookmark,
  openInNewTab,
  onOpenBackground,
  onOpenIncognito,
  onEdit,
  onDelete,
}: BookmarkItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const favicon = useFavicon(bookmark.url);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bookmark.id,
    data: { type: "bookmark", boardId: bookmark.boardId, order: bookmark.order },
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.item} ${isDragging ? styles.dragging : ""}`}
    >
      <button
        type="button"
        className={styles.dragHandle}
        aria-label={`Drag ${bookmark.title}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      {favicon ? (
        <img className={styles.favicon} src={favicon} alt="" width={16} height={16} />
      ) : (
        <div className={styles.faviconPlaceholder} />
      )}
      <a
        className={styles.title}
        href={bookmark.url}
        target={openInNewTab ? "_blank" : "_self"}
        rel="noopener noreferrer"
      >
        {bookmark.title}
      </a>
      <div className={styles.menuWrapper}>
        <button
          type="button"
          aria-label={`${bookmark.title} menu`}
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
                onOpenBackground(bookmark);
              }}
            >
              Open
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onOpenIncognito(bookmark);
              }}
            >
              Open Incognito
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onEdit(bookmark);
              }}
            >
              Edit
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onDelete(bookmark.id);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
