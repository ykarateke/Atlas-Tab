/**
 * Last-write-wins conflict resolution by timestamp
 * (SYNC_AND_STORAGE.md § 4).
 *
 * v2 retains v1's conflict policy as-is: no field-level merge.
 * The more recent write (by `_syncTs`) replaces the older one wholesale.
 */

export const SYNC_TS_KEY = "_syncTs";

/**
 * Check whether a remote update is newer than the local state and should
 * replace it. Returns true if remote should win.
 */
export function shouldReplaceLocal(
  localSyncTs: number | undefined | null,
  remoteTimestamp: number,
): boolean {
  // No local timestamp means we've never synced — remote wins
  if (localSyncTs === undefined || localSyncTs === null) return true;
  // Remote is newer (or equal) — remote wins (last-write-wins)
  return remoteTimestamp >= localSyncTs;
}

/**
 * Stamp a state object with the current sync timestamp.
 * Returns a new object with _syncTs set.
 */
export function stampSyncTs<T extends Record<string, unknown>>(
  state: T,
  timestamp?: number,
): T & { _syncTs: number } {
  return { ...state, _syncTs: timestamp ?? Date.now() };
}

/**
 * Stamp a state object with the current writer id.
 */
export function stampWriter<T extends Record<string, unknown>>(
  state: T,
  writer: string,
): T & { _writer: string } {
  return { ...state, _writer: writer };
}

/**
 * Extract _syncTs from a state object if present.
 */
export function getSyncTs(state: Record<string, unknown>): number | undefined {
  return state._syncTs as number | undefined;
}

/**
 * Extract _writer from a state object if present.
 */
export function getWriterFromState(state: Record<string, unknown>): string | undefined {
  return state._writer as string | undefined;
}
