import type { SearchEngine } from "./schema/search-engine";
import type { TranslationKey } from "./i18n/translator";

// Shared across the search board type and the nav search bar
// (FEATURE_SPECS.md § Search). "default" has no template — it's routed
// through chrome.search.query (the browser's own default engine) instead of
// a URL, so it has no queryUrlTemplate.
export const SEARCH_ENGINES: SearchEngine[] = [
  { id: "default", labelKey: "searchEngine.default" },
  {
    id: "google",
    labelKey: "searchEngine.google",
    queryUrlTemplate: "https://www.google.com/search?q={query}",
  },
  {
    id: "yandex",
    labelKey: "searchEngine.yandex",
    queryUrlTemplate: "https://yandex.com/search/?text={query}",
  },
  {
    id: "bing",
    labelKey: "searchEngine.bing",
    queryUrlTemplate: "https://www.bing.com/search?q={query}",
  },
  {
    id: "duckduckgo",
    labelKey: "searchEngine.duckduckgo",
    queryUrlTemplate: "https://duckduckgo.com/?q={query}",
  },
  {
    id: "youtube",
    labelKey: "searchEngine.youtube",
    queryUrlTemplate: "https://www.youtube.com/results?search_query={query}",
  },
  {
    id: "ecosia",
    labelKey: "searchEngine.ecosia",
    queryUrlTemplate: "https://www.ecosia.org/search?q={query}",
  },
];

export const SEARCH_ENGINE_LABEL_KEYS: Record<SearchEngine["id"], TranslationKey> = {
  default: "searchEngine.default",
  google: "searchEngine.google",
  yandex: "searchEngine.yandex",
  bing: "searchEngine.bing",
  duckduckgo: "searchEngine.duckduckgo",
  youtube: "searchEngine.youtube",
  ecosia: "searchEngine.ecosia",
};

// Returns null for "default" (or any engine without a template) — the
// caller is expected to fall back to chrome.search.query in that case.
export function buildSearchUrl(engineId: SearchEngine["id"], query: string): string | null {
  const engine = SEARCH_ENGINES.find((e) => e.id === engineId);
  if (!engine?.queryUrlTemplate) return null;
  return engine.queryUrlTemplate.replace("{query}", encodeURIComponent(query));
}
