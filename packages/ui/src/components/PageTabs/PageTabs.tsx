import { useState } from "react";
import type { KeyboardEvent } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Page } from "@atlas-tab/core";
import { useTranslation } from "../../i18n/I18nContext";
import styles from "./PageTabs.module.css";

export interface PageTabsProps {
  pages: Page[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onAddPage: (name: string) => void;
  onRenamePage: (pageId: string, name: string) => void;
  onDeletePage: (pageId: string) => void;
  onReorderPages: (orderedPageIds: string[]) => void;
}

function PageTab({
  page,
  isActive,
  canDelete,
  onSelect,
  onRename,
  onDelete,
}: {
  page: Page;
  isActive: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const t = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(page.name);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function commitRename() {
    setEditing(false);
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== page.name) onRename(trimmed);
    else setDraftName(page.name);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      setDraftName(page.name);
      setEditing(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.tab} ${isActive ? styles.tabActive : ""} ${isDragging ? styles.tabDragging : ""}`}
      {...attributes}
      {...listeners}
    >
      {editing ? (
        <input
          autoFocus
          className={styles.renameInput}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <button
          type="button"
          className={styles.tabLabel}
          onClick={onSelect}
          onDoubleClick={() => setEditing(true)}
        >
          {page.name}
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          aria-label={t("page.deleteAria", { name: page.name })}
          className={styles.deleteButton}
          onClick={onDelete}
        >
          ×
        </button>
      )}
    </div>
  );
}

export function PageTabs({
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onRenamePage,
  onDeletePage,
  onReorderPages,
}: PageTabsProps) {
  const t = useTranslation();
  const [addingPage, setAddingPage] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const sortedPages = [...pages].sort((a, b) => a.order - b.order);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedPages.findIndex((p) => p.id === active.id);
    const newIndex = sortedPages.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorderPages(arrayMove(sortedPages, oldIndex, newIndex).map((p) => p.id));
  }

  function commitNewPage() {
    const trimmed = newPageName.trim();
    setAddingPage(false);
    setNewPageName("");
    if (trimmed) onAddPage(trimmed);
  }

  return (
    <nav className={styles.tabRow} aria-label={t("page.navAria")}>
      {/* The glass background/blur lives on this non-scrolling wrapper, not
          on the overflow-x:auto element below — overflow + a negative
          z-index backdrop-filter layer on the *same* element clips the blur
          in some browsers, leaving the tabs looking flat instead of glassy. */}
      <div className={styles.scrollArea}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={sortedPages.map((p) => p.id)}
            strategy={horizontalListSortingStrategy}
          >
            {sortedPages.map((page) => (
              <PageTab
                key={page.id}
                page={page}
                isActive={page.id === activePageId}
                canDelete={pages.length > 1}
                onSelect={() => onSelectPage(page.id)}
                onRename={(name) => onRenamePage(page.id, name)}
                onDelete={() => onDeletePage(page.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {addingPage ? (
          <input
            autoFocus
            className={styles.renameInput}
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            onBlur={commitNewPage}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setNewPageName("");
                setAddingPage(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            aria-label={t("page.addAria")}
            className={styles.addButton}
            onClick={() => setAddingPage(true)}
          >
            +
          </button>
        )}
      </div>
    </nav>
  );
}
