import { useEffect, useState, type FormEvent } from "react";
import { loadAppState, addBookmark, saveAppState } from "@atlas-tab/core";
import type { AppState } from "@atlas-tab/core";
import styles from "./App.module.css";

/**
 * Quick Save popup — saves the current tab as a bookmark.
 *
 * v2 architecture requirement: this entire flow calls into `@atlas-tab/core`'s
 * shared mutation functions rather than re-implementing them locally
 * (ARCHITECTURE.md § 3 / FEATURE_SPECS.md § Quick Save).
 */
export function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [tabUrl, setTabUrl] = useState("");
  const [tabTitle, setTabTitle] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      // Load state
      const adapter: chromeStorageAdapter = {
        get: (key) =>
          new Promise((resolve) => chrome.storage.local.get(key, (r) => resolve(r[key]))),
        set: (key, value) =>
          new Promise((resolve) => chrome.storage.local.set({ [key]: value }, () => resolve())),
      };
      const appState = await loadAppState(adapter);
      setState(appState);

      // Set default board from quickSaveBoardId
      const defaultBoard = appState.settings.quickSaveBoardId;
      if (defaultBoard && appState.boards.some((b) => b.id === defaultBoard && b.type === "bookmarks")) {
        setSelectedBoardId(defaultBoard);
      } else {
        const firstBookmarkBoard = appState.boards.find((b) => b.type === "bookmarks");
        if (firstBookmarkBoard) setSelectedBoardId(firstBookmarkBoard.id);
      }

      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url && tab?.title) {
        setTabUrl(tab.url);
        setTabTitle(cleanTitle(tab.title, tab.url));
      }
    }
    init();
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!state || !selectedBoardId || !tabUrl.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const adapter: chromeStorageAdapter = {
        get: (key) =>
          new Promise((resolve) => chrome.storage.local.get(key, (r) => resolve(r[key]))),
        set: (key, value) =>
          new Promise((resolve) => chrome.storage.local.set({ [key]: value }, () => resolve())),
      };

      const current = await loadAppState(adapter);
      const next = addBookmark(current, {
        boardId: selectedBoardId,
        url: tabUrl,
        title: tabTitle || tabUrl,
      });
      await saveAppState(adapter, next);

      setSaved(true);
      setTimeout(() => window.close(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  if (!state) return null;

  const bookmarkBoards = state.boards.filter((b) => b.type === "bookmarks");
  const pages = state.pages.sort((a, b) => a.order - b.order);

  return (
    <main className={styles.wrap}>
      <h1 className={styles.title}>Quick Save</h1>

      {saved ? (
        <p className={styles.saved}>✓ Saved</p>
      ) : (
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>URL</label>
            <input className={styles.input} value={tabUrl} onChange={(e) => setTabUrl(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Title</label>
            <input className={styles.input} value={tabTitle} onChange={(e) => setTabTitle(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Board</label>
            <select
              className={styles.select}
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
            >
              {pages.map((page) => {
                const pageBoards = bookmarkBoards.filter((b) => b.pageId === page.id);
                if (pageBoards.length === 0) return null;
                return (
                  <optgroup key={page.id} label={page.name}>
                    {pageBoards.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.saveBtn} disabled={saving || !selectedBoardId}>
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </main>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

interface chromeStorageAdapter {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

/**
 * Clean a tab title for bookmark storage, mirroring v1's title-cleaning
 * logic (FEATURE_SPECS.md § Quick Save — strips unread counts, email
 * addresses in @-separated titles, leading bullets, etc.).
 */
function cleanTitle(title: string, _url: string): string {
  let result = title.trim();

  // Strip unread-count patterns like (394) or [12] at the start
  result = result.replace(/^\((\d+)\)\s*/, "");
  result = result.replace(/^\[(\d+)\]\s*/, "");

  // Strip leading bullet markers
  result = result.replace(/^[•·●○◆◇]\s*/, "");

  // If the title contains @, split on separator chars and drop any segment
  // that looks like an email address
  if (result.includes("@")) {
    const parts = result.split(/[•·●○◆◇\-–—|/]+/);
    const filtered = parts.filter((part) => {
      const trimmed = part.trim();
      if (!trimmed) return false;
      // Drop if it looks like an email
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
      return true;
    });
    result = filtered.join(" • ").trim();
  }

  return result || "Untitled";
}
