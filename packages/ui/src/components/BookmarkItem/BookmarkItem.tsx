import { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Bookmark } from "@atlas-tab/core";
import { useFavicon } from "../../favicon/FaviconContext";
import { useTranslation } from "../../i18n/I18nContext";
import { combineRefs } from "../../dnd/combineRefs";
import { GripIcon, MoreIcon } from "../../icons/Icons";
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
  const t = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const favicon = useFavicon(bookmark.url);

  // Plain draggable + droppable, not sortable — see Board.tsx for why
  // (cross-container drops need to escape the per-board SortableContext).
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: bookmark.id,
    data: { type: "bookmark", boardId: bookmark.boardId, order: bookmark.order },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `bookmark-drop-${bookmark.id}`,
    data: { type: "bookmark", boardId: bookmark.boardId, order: bookmark.order },
  });

  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <div
      ref={combineRefs(setDragRef, setDropRef)}
      style={style}
      className={`${styles.item} ${isDragging ? styles.dragging : ""} ${isOver ? styles.dropTarget : ""}`}
    >
      <button
        type="button"
        className={styles.dragHandle}
        aria-label={t("bookmark.dragAria", { title: bookmark.title })}
        {...attributes}
        {...listeners}
      >
        <GripIcon width={13} height={13} />
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
          aria-label={t("bookmark.menuAria", { title: bookmark.title })}
          className={styles.menuButton}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MoreIcon width={14} height={14} />
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
              {t("bookmark.open")}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onOpenIncognito(bookmark);
              }}
            >
              {t("bookmark.openIncognito")}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onEdit(bookmark);
              }}
            >
              {t("bookmark.edit")}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onDelete(bookmark.id);
              }}
            >
              {t("bookmark.delete")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
