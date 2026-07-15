import { useState } from "react";
import type { FormEvent } from "react";
import { SEARCH_ENGINES, SEARCH_ENGINE_LABEL_KEYS, type SearchEngine } from "@atlas-tab/core";
import { useTranslation } from "../../i18n/I18nContext";
import { SearchIcon } from "../../icons/Icons";
import styles from "./NavSearchBar.module.css";

export interface NavSearchBarProps {
  engineId: SearchEngine["id"];
  onSearch: (query: string, engineId: SearchEngine["id"]) => void;
  onEngineChange: (engineId: SearchEngine["id"]) => void;
}

// Topbar-level search pill with its own engine picker, independent of the
// global bookmark search overlay and the search board type
// (FEATURE_SPECS.md § Search — the three surfaces are deliberately separate).
export function NavSearchBar({ engineId, onSearch, onEngineChange }: NavSearchBarProps) {
  const t = useTranslation();
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const engine = SEARCH_ENGINES.find((e) => e.id === engineId) ?? SEARCH_ENGINES[0]!;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onSearch(trimmed, engineId);
    setQuery("");
  }

  return (
    <form className={styles.wrap} onSubmit={handleSubmit}>
      <SearchIcon width={14} height={14} className={styles.icon} />
      <input
        className={styles.input}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("navSearch.placeholder")}
      />
      <div className={styles.engineWrap}>
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
                  className={e.id === engineId ? styles.engineActive : ""}
                  onClick={() => {
                    onEngineChange(e.id);
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
  );
}
