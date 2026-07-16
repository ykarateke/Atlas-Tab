/**
 * Per-tab-session writer stamping for multi-tab disambiguation
 * (SYNC_AND_STORAGE.md § 5).
 *
 * Every local write stamps a `_writer` field with a random per-tab-session
 * identifier. This lets the chrome.storage.onChanged listener distinguish
 * "my own write echoing back" from "genuine external write."
 */

const WRITER_KEY = "_writer";

let _writer: string | null = null;

/**
 * Get (or create) the per-tab-session writer id.
 * Persisted in sessionStorage so it survives soft navigations within
 * the same tab but resets on tab close (matching v1 behavior).
 */
export function getWriter(): string {
  if (_writer) return _writer;

  // Try sessionStorage first (survives client-side navigations)
  try {
    const stored = sessionStorage.getItem(WRITER_KEY);
    if (stored) {
      _writer = stored;
      return _writer;
    }
  } catch {
    // sessionStorage may throw in some extension contexts
  }

  _writer = crypto.randomUUID();
  try {
    sessionStorage.setItem(WRITER_KEY, _writer);
  } catch {
    // Non-fatal
  }
  return _writer;
}

/**
 * Reset the writer (used when the extension wants to force a new identity,
 * e.g. after a storage corruption recovery).
 */
export function resetWriter(): void {
  _writer = null;
  try {
    sessionStorage.removeItem(WRITER_KEY);
  } catch {
    // Non-fatal
  }
}
