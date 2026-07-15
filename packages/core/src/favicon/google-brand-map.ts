// Bare-domain favicon services collapse every google.com subpath to a generic
// "G" icon, so Google products need a hardcoded brand map instead
// (FEATURE_SPECS.md § Favicons, tier 1). `docs.google.com` hosts Docs/Sheets/
// Slides on one hostname, disambiguated by the first path segment — the same
// reason the cache itself keys Google entries by hostname+path segment
// (DATA_MODEL.md § 14).
//
// The icon here is a generated placeholder (colored square + initial), not a
// real Google brand asset — swap `svgIconDataUrl` below for real bundled
// artwork under `public/icons/google/` when available; the pipeline shape
// (lookup -> data URL -> same re-encode step as every other tier) won't change.
interface GoogleBrandEntry {
  hostname: string;
  pathSegment?: string;
  label: string;
  colorHex: string;
}

const GOOGLE_BRAND_ICONS: GoogleBrandEntry[] = [
  { hostname: "mail.google.com", label: "M", colorHex: "#EA4335" },
  { hostname: "calendar.google.com", label: "C", colorHex: "#1A73E8" },
  { hostname: "drive.google.com", label: "D", colorHex: "#34A853" },
  { hostname: "docs.google.com", pathSegment: "document", label: "D", colorHex: "#4285F4" },
  { hostname: "docs.google.com", pathSegment: "spreadsheets", label: "S", colorHex: "#0F9D58" },
  { hostname: "docs.google.com", pathSegment: "presentation", label: "S", colorHex: "#F4B400" },
  { hostname: "maps.google.com", label: "M", colorHex: "#34A853" },
];

function svgIconDataUrl(label: string, colorHex: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">` +
    `<rect width="48" height="48" rx="8" fill="${colorHex}"/>` +
    `<text x="24" y="32" font-family="sans-serif" font-size="24" fill="#fff" ` +
    `text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function lookupGoogleBrandIcon(hostname: string, firstPathSegment: string | null): string | null {
  const match = GOOGLE_BRAND_ICONS.find(
    (entry) => entry.hostname === hostname && (!entry.pathSegment || entry.pathSegment === firstPathSegment),
  );
  return match ? svgIconDataUrl(match.label, match.colorHex) : null;
}

// True for hostnames (e.g. docs.google.com) that host multiple Google
// products distinguished only by path — the favicon cache must key these by
// hostname + first path segment, not hostname alone (DATA_MODEL.md § 14).
export function requiresPathSegmentDisambiguation(hostname: string): boolean {
  return GOOGLE_BRAND_ICONS.some((entry) => entry.hostname === hostname && entry.pathSegment);
}
