import { faviconCacheSchema, type FaviconCache } from "../schema/favicon-cache";

export interface FaviconCacheStorage {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

export const FAVICON_CACHE_STORAGE_KEY = "faviconCache";
// Bump this to invalidate every cached entry at once if the resolution
// pipeline logic changes (FEATURE_SPECS.md § Favicons) — a stored cache
// written under an older version is treated as empty rather than migrated.
export const CURRENT_FAVICON_CACHE_VERSION = 1;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function readCache(storage: FaviconCacheStorage): Promise<FaviconCache> {
  const raw = await storage.get(FAVICON_CACHE_STORAGE_KEY);
  const parsed = faviconCacheSchema.safeParse(raw);
  if (!parsed.success || parsed.data.version !== CURRENT_FAVICON_CACHE_VERSION) {
    return { version: CURRENT_FAVICON_CACHE_VERSION, entries: {} };
  }
  return parsed.data;
}

export async function getCachedFavicon(
  storage: FaviconCacheStorage,
  key: string,
): Promise<string | null> {
  const cache = await readCache(storage);
  const entry = cache.entries[key];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null;
  return entry.dataUrl;
}

export async function setCachedFavicon(
  storage: FaviconCacheStorage,
  key: string,
  dataUrl: string,
): Promise<void> {
  const cache = await readCache(storage);
  const next: FaviconCache = {
    version: CURRENT_FAVICON_CACHE_VERSION,
    entries: { ...cache.entries, [key]: { dataUrl, cachedAt: Date.now() } },
  };
  await storage.set(FAVICON_CACHE_STORAGE_KEY, next);
}
