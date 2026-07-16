/**
 * GA4 Measurement Protocol client (hand-rolled fetch calls, no remote-code
 * gtag.js per MV3 CSP).
 *
 * Events are batched and sent via navigator.sendBeacon when possible,
 * falling back to fetch.
 *
 * See ANALYTICS_PLAN.md for the full event catalog.
 */

// Set these via environment or build-time injection
const API_SECRET = ""; // GA4 Measurement Protocol API secret
const MEASUREMENT_ID = ""; // e.g. "G-XXXXXXXXXX"

const GA4_ENDPOINT = "https://www.google-analytics.com/g/collect";

interface GA4Event {
  name: string;
  params?: Record<string, string | number | boolean>;
}

let clientId: string | null = null;

function getClientId(): string {
  if (clientId) return clientId;
  try {
    const stored = localStorage.getItem("ga_clientId");
    if (stored) {
      clientId = stored;
      return clientId;
    }
  } catch {
    // localStorage may not be available
  }
  clientId = crypto.randomUUID();
  try {
    localStorage.setItem("ga_clientId", clientId);
  } catch {
    // Non-fatal
  }
  return clientId;
}

/**
 * Send an analytics event.
 * If API_SECRET is not configured, events are silently dropped (dev mode).
 */
export function sendAnalytics(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (!API_SECRET || !MEASUREMENT_ID) return;

  const payload = {
    client_id: getClientId(),
    events: [
      {
        name: eventName,
        params: {
          ...params,
          session_id: getClientId().slice(0, 8),
          engagement_time_msec: 100,
        },
      } as GA4Event,
    ],
  };

  const body = JSON.stringify(payload);

  try {
    navigator.sendBeacon(GA4_ENDPOINT, body);
  } catch {
    // Fallback to fetch
    fetch(GA4_ENDPOINT, {
      method: "POST",
      body,
      keepalive: true,
    }).catch(() => {
      // Silently drop — analytics failure must never affect app functionality
    });
  }
}

/**
 * Pre-defined event helpers for key actions.
 */
export const Analytics = {
  pageView: () => sendAnalytics("page_view"),

  migrationCompleted: (schemaVersion: number) =>
    sendAnalytics("migration_completed", { schema_version: schemaVersion }),

  migrationFailed: (errorCount: number) =>
    sendAnalytics("migration_failed", { error_count: errorCount }),

  boardCreated: (boardType: string) =>
    sendAnalytics("board_created", { board_type: boardType }),

  boardDeleted: () => sendAnalytics("board_deleted"),

  bookmarkAdded: () => sendAnalytics("bookmark_added"),

  bookmarkOpened: (source: "board" | "search") =>
    sendAnalytics("bookmark_opened", { source }),

  signIn: () => sendAnalytics("sign_in"),

  signOut: () => sendAnalytics("sign_out"),

  syncCompleted: (chunkCount: number) =>
    sendAnalytics("sync_completed", { chunk_count: chunkCount }),

  wallpaperChanged: (type: string) =>
    sendAnalytics("wallpaper_changed", { wallpaper_type: type }),

  error: (errorType: string, message: string) =>
    sendAnalytics("error", { error_type: errorType, error_message: message }),
};
