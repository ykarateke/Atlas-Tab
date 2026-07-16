/**
 * Byte-accurate chunking for chrome.storage.sync.
 *
 * chrome.storage.sync has an 8KB-per-item limit and ~100KB total quota.
 * This module serializes a sync payload, splits it into chunks sized so
 * that each chunk's *stored* representation stays under the per-item limit,
 * and reassembles chunks on read (SYNC_AND_STORAGE.md § 2-3).
 */

const MAX_ITEM_BYTES = 8000; // safe margin under the 8192-byte limit
const CHUNK_KEY_PREFIX = "mz_c_";
const META_KEY_VERSION = "mz_v";
const META_KEY_COUNT = "mz_n";
const META_KEY_TS = "mz_ts";
const META_KEY_EMAIL = "mz_email";

export interface SyncMeta {
  version: number;
  chunkCount: number;
  timestamp: number;
  email: string;
}

/**
 * Encode a string so that the result's UTF-8 byte length is computed
 * correctly even for characters outside the BMP (JavaScript's `.length`
 * counts UTF-16 code units, not bytes).
 */
function utf8ByteLength(str: string): number {
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code < 0xd800 || code >= 0xe000) bytes += 3;
    else {
      // surrogate pair — count the second surrogate
      i++;
      bytes += 4;
    }
  }
  return bytes;
}

/**
 * Serialize a sync payload object and split it into byte-safe chunks.
 * Returns the chunks and the metadata needed to reconstruct them.
 */
export function encodeSyncPayload(
  payload: object,
  email: string,
  timestamp: number,
  version: number,
): { chunks: Record<string, string>; meta: SyncMeta } {
  const json = JSON.stringify(payload);
  const chunks: Record<string, string> = {};
  let start = 0;
  let chunkIndex = 0;

  while (start < json.length) {
    // Binary-search for the safe split point
    let end = Math.min(start + MAX_ITEM_BYTES, json.length);
    while (end > start && utf8ByteLength(json.slice(start, end)) > MAX_ITEM_BYTES - 100) {
      end = Math.floor((start + end) / 2);
    }
    // Don't split surrogate pairs
    if (end < json.length) {
      const code = json.charCodeAt(end - 1);
      if (code >= 0xd800 && code < 0xdc00) end--;
    }
    chunks[`${CHUNK_KEY_PREFIX}${chunkIndex}`] = json.slice(start, end);
    start = end;
    chunkIndex++;
  }

  return {
    chunks,
    meta: { version, chunkCount: chunkIndex, timestamp, email },
  };
}

/**
 * Reconstruct a sync payload from stored chunks and metadata.
 */
export function decodeSyncPayload(
  chunks: string[],
  _meta: SyncMeta,
): unknown {
  const json = chunks.join("");
  return JSON.parse(json);
}

/**
 * Build the full set of storage keys for a given sync payload.
 */
export function syncStorageKeys(): {
  chunkKeys: string[];
  metaKeys: string[];
} {
  return {
    chunkKeys: [], // dynamic — use count from meta
    metaKeys: [META_KEY_VERSION, META_KEY_COUNT, META_KEY_TS, META_KEY_EMAIL],
  };
}

export {
  CHUNK_KEY_PREFIX,
  META_KEY_VERSION,
  META_KEY_COUNT,
  META_KEY_TS,
  META_KEY_EMAIL,
};
