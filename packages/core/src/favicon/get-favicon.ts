import { getCachedFavicon, setCachedFavicon, type FaviconCacheStorage } from "./cache";
import { getFaviconCacheKey, resolveFavicon, type ResolveFaviconOptions } from "./resolve";

// The single entry point real callers use: cache-first, falling back to the
// six-tier resolution chain and caching whatever it finds (FEATURE_SPECS.md §
// Favicons — "cache persists across sessions").
export async function getFavicon(
  storage: FaviconCacheStorage,
  bookmarkUrl: string,
  options: ResolveFaviconOptions,
): Promise<string | null> {
  const cacheKey = getFaviconCacheKey(bookmarkUrl);
  const cached = await getCachedFavicon(storage, cacheKey);
  if (cached) return cached;

  const resolved = await resolveFavicon(bookmarkUrl, options);
  if (resolved) await setCachedFavicon(storage, cacheKey, resolved);
  return resolved;
}
