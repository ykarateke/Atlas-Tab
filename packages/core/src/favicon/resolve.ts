import { lookupGoogleBrandIcon, requiresPathSegmentDisambiguation } from "./google-brand-map";

// Every resolved icon must be re-encoded to a 48px PNG data URL before
// caching — raw cached .ico bytes were found in v1 to sometimes render
// transparent (FEATURE_SPECS.md § Favicons). This step needs a real document
// (Image + canvas), so it's injected rather than implemented here, keeping
// this module DOM-free and unit-testable with a mocked step.
export type FaviconFetchStep = (url: string) => Promise<string | null>;

export interface ResolveFaviconOptions {
  fetchAndEncode: FaviconFetchStep;
  // Tier 6 (chrome-extension://<id>/_favicon/...) needs the running
  // extension's own id, so its URL is built by the caller.
  buildExtensionFaviconUrl?: (pageUrl: string) => string;
}

function firstPathSegment(url: URL): string | null {
  return url.pathname.split("/").filter(Boolean)[0] ?? null;
}

// Naive last-two-labels heuristic (no public-suffix-list parsing) — good
// enough for the common case this tier exists to fix (a subdomain like
// blog.example.com missing a favicon that example.com has); it does not
// correctly handle multi-part TLDs like "example.co.uk". Revisit with a PSL
// library if that proves to matter in practice.
function getRootDomain(hostname: string): string {
  const labels = hostname.split(".");
  return labels.length <= 2 ? hostname : labels.slice(-2).join(".");
}

function buildTierUrls(hostname: string, pathSegment: string | null): string[] {
  const urls: string[] = [];
  const brandIcon = lookupGoogleBrandIcon(hostname, pathSegment);
  if (brandIcon) urls.push(brandIcon);

  urls.push(`https://${hostname}/favicon.ico`);
  urls.push(
    `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(`https://${hostname}`)}&size=48`,
  );
  urls.push(`https://icons.duckduckgo.com/ip3/${hostname}.ico`);

  return urls;
}

export function getFaviconCacheKey(bookmarkUrl: string): string {
  const url = new URL(bookmarkUrl);
  if (requiresPathSegmentDisambiguation(url.hostname)) {
    const segment = firstPathSegment(url);
    if (segment) return `${url.hostname}/${segment}`;
  }
  return url.hostname;
}

// Walks the six-tier fallback chain in order (FEATURE_SPECS.md § Favicons)
// until one tier's fetchAndEncode succeeds, returning a 48px PNG data URL.
export async function resolveFavicon(
  bookmarkUrl: string,
  options: ResolveFaviconOptions,
): Promise<string | null> {
  const url = new URL(bookmarkUrl);
  const pathSegment = firstPathSegment(url);

  for (const tierUrl of buildTierUrls(url.hostname, pathSegment)) {
    const result = await options.fetchAndEncode(tierUrl);
    if (result) return result;
  }

  // Tier 5: retry the same chain against the root domain.
  const rootDomain = getRootDomain(url.hostname);
  if (rootDomain !== url.hostname) {
    for (const tierUrl of buildTierUrls(rootDomain, null)) {
      const result = await options.fetchAndEncode(tierUrl);
      if (result) return result;
    }
  }

  // Tier 6: Chrome's own internal favicon cache, a guaranteed-last fallback.
  if (options.buildExtensionFaviconUrl) {
    return options.fetchAndEncode(options.buildExtensionFaviconUrl(bookmarkUrl));
  }

  return null;
}
