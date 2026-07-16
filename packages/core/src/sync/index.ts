/**
 * chrome.storage.sync chunking, reconcile, and conflict policy
 * (SYNC_AND_STORAGE.md).
 *
 * This module is shared by the newtab app and popup app — the same
 * implementation is used identically by both, fixing v1's popup/newtab
 * duplication risk (ARCHITECTURE.md § 3).
 */

export {
  encodeSyncPayload,
  decodeSyncPayload,
  syncStorageKeys,
  CHUNK_KEY_PREFIX,
  META_KEY_VERSION,
  META_KEY_COUNT,
  META_KEY_TS,
  META_KEY_EMAIL,
} from "./chunking";
export type { SyncMeta } from "./chunking";

export {
  shouldReplaceLocal,
  stampSyncTs,
  stampWriter,
  getSyncTs,
  getWriterFromState,
  SYNC_TS_KEY,
} from "./reconcile";

export { getWriter, resetWriter } from "./stamp";
