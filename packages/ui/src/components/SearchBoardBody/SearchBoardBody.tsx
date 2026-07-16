import { useState, type FormEvent } from "react";
import { buildSearchUrl, SEARCH_ENGINES, SEARCH_ENGINE_LABEL_KEYS, type SearchEngine } from "@atlas-tab/core";
import { useTranslation } from "../../i18n/I18nContext";
import { SearchIcon } from "../../icons/Icons";
import styles from "./SearchBoardBody.module.css";

export interface SearchBoardBodyProps {
  searchEngineId: SearchEngine["id"];
  onSearchEngineChange: (engineId: SearchEngine["id"]) => void;
}

/**
 * Mini search input + engine picker embedded in a board on the grid,
 * independent of the topbar NavSearchBar and the global Ctrl+K overlay
 * (FEATURE_SPECS.md § Search — the three surfaces are deliberately separate).
 */
export function SearchBoardBody({ searchEngineId, onSearchEngineChange }: SearchBoardBodyProps) {
  const t = useTranslation();
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const engine = SEARCH_ENGINES.find((e) => e.id === searchEngineId) ?? SEARCH_ENGINES[0]!;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const url = buildSearchUrl(engine.id, trimmed);
    if (url) {
      chrome.tabs.create({ url });
    } else {
      // "default" engine — route through the browser's own default search
      chrome.search.query({ text: trimmed, disposition: "NEW_TAB" });
    }
    setQuery("");
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <SearchIcon width={14} height={14} className={styles.icon} />
        <input
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("navSearch.placeholder")}
          autoFocus
        />
        <div className={styles.pickerWrap}>
          <button
            type="button"
            className={styles.engineBtn}
            aria-label={t("navSearch.engineAria")}
            onClick={() => setPickerOpen((o) => !o)}
          >
            {t(SEARCH_ENGINE_LABEL_KEYS[engine.id])}
          </button>
          {pickerOpen && (
            <ul className={styles.engineMenu} role="menu">
              {SEARCH_ENGINES.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    role="menuitem"
                    className={e.id === searchEngineId ? styles.engineActive : ""}
                    onClick={() => {
                      onSearchEngineChange(e.id);
                      setPickerOpen(false);
                    }}
                  >
                    {t(SEARCH_ENGINE_LABEL_KEYS[e.id])}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
    </div>
  );
}
