import { appStateSchema, type AppState } from "../schema/app-state";
import { createDefaultAppState } from "../state/default-state";
import type { AppStateStorage } from "../state/persistence";
import { loadAppState, saveAppState, APP_STATE_STORAGE_KEY } from "../state/persistence";

/**
 * Export the full app state as a downloadable JSON file.
 * Strips runtime-only fields (isDemo markers) before serialization.
 */
export function exportAppState(state: AppState): Blob {
  const cleaned = {
    ...state,
    bookmarks: state.bookmarks.map((bm) => {
      const { isDemo, ...rest } = bm as BookmarkWithDemo;
      return rest;
    }),
  };
  const json = JSON.stringify(cleaned, null, 2);
  return new Blob([json], { type: "application/json" });
}

interface BookmarkWithDemo {
  id: string;
  boardId: string;
  url: string;
  title: string;
  description?: string;
  order: number;
  isDemo?: boolean;
}

/**
 * Validate and import a previously exported JSON file.
 * Runs the payload through the Zod schema before accepting it.
 * Returns the parsed state, or null if validation fails.
 */
export function importAppState(jsonString: string): AppState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;

  const result = appStateSchema.safeParse(parsed);
  if (!result.success) return null;

  // Require at least pages/boards/bookmarks arrays to be present
  const s = result.data;
  if (!Array.isArray(s.pages) || !Array.isArray(s.boards) || !Array.isArray(s.bookmarks)) {
    return null;
  }

  return s;
}

/**
 * Import Chrome native bookmarks tree via chrome.bookmarks.getTree.
 * Returns an array of drafts that can be used with addBoard/addBookmark.
 */
export interface ChromeBookmarkImport {
  boardName: string;
  bookmarks: Array<{ url: string; title: string }>;
}

export function extractChromeBookmarks(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  folderIds?: Set<string>,
): ChromeBookmarkImport[] {
  const imports: ChromeBookmarkImport[] = [];

  for (const node of nodes) {
    // If folderIds is specified, only process matching folders
    if (node.children && (!folderIds || folderIds.has(node.id))) {
      const bookmarks = node.children
        .filter((child): child is chrome.bookmarks.BookmarkTreeNode & { url: string } =>
          !!child.url
        )
        .map((child) => ({
          url: child.url,
          title: child.title || child.url,
        }));

      if (bookmarks.length > 0) {
        imports.push({
          boardName: node.title || "Imported",
          bookmarks,
        });
      }
    }

    // Recurse into children
    if (node.children) {
      imports.push(...extractChromeBookmarks(node.children, folderIds));
    }
  }

  return imports;
}
