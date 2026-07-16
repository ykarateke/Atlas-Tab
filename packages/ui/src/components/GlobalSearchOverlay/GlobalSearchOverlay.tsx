import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Bookmark, Board } from "@atlas-tab/core";
import { useTranslation } from "../../i18n/I18nContext";
import { SearchIcon } from "../../icons/Icons";
import { useFavicon } from "../../favicon/FaviconContext";
import styles from "./GlobalSearchOverlay.module.css";

const MAX_RESULTS = 24;

export interface GlobalSearchOverlayProps {
  open: boolean;
  bookmarks: Bookmark[];
  boards: Board[];
  onClose: () => void;
}

export function GlobalSearchOverlay({ open, bookmarks, boards, onClose }: GlobalSearchOverlayProps) {
  const t = useTranslation();
  const resolveFavicon = useFavicon();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const boardNameById = new Map(boards.map((b) => [b.id, b.name]));

  const lowerQuery = query.toLowerCase().trim();
  const results = !lowerQuery
    ? []
    : bookmarks
        .filter(
          (bm) =>
            bm.title.toLowerCase().includes(lowerQuery) ||
            bm.url.toLowerCase().includes(lowerQuery),
        )
        .slice(0, MAX_RESULTS);

  // Reset query + active index whenever the overlay opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Focus the input after the overlay renders
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      chrome.tabs.create({ url: results[activeIndex]!.url });
      onClose();
    }
  }

  function handleClick(bm: Bookmark) {
    chrome.tabs.create({ url: bm.url });
    onClose();
  }

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.panel}>
        <div className={styles.inputWrap}>
          <SearchIcon width={16} height={16} className={styles.inputIcon} />
          <input
            ref={inputRef}
            className={styles.input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t("bookmark.searchPlaceholder")}
          />
          <span className={styles.shortcutHint}>ESC</span>
        </div>

        <div className={styles.results} ref={listRef}>
          {results.length === 0 && query.trim() && (
            <div className={styles.empty}>{t("bookmark.noResults")}</div>
          )}
          {results.length === 0 && !query.trim() && (
            <div className={styles.empty}>{t("bookmark.searchHint")}</div>
          )}
          {results.map((bm, i) => (
            <div
              key={bm.id}
              className={`${styles.resultItem} ${i === activeIndex ? styles.resultItemActive : ""}`}
              onClick={() => handleClick(bm)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <img
                className={styles.favicon}
                src={resolveFavicon(bm.url)}
                alt=""
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div className={styles.meta}>
                <div className={styles.resultTitle}>{bm.title}</div>
                <div className={styles.resultUrl}>{bm.url}</div>
              </div>
              <span className={styles.boardLabel}>{boardNameById.get(bm.boardId) ?? "?"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
