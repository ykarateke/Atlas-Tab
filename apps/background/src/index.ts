/**
 * MV3 service worker entry — install/uninstall events and alarms.
 *
 * The worker can be killed and restarted at any time; no in-memory state may
 * be relied on to survive between events (ARCHITECTURE.md § 6).
 */

// Only runs in the extension background context
if (typeof chrome !== "undefined" && chrome.runtime?.onInstalled) {
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      console.log("[Atlas Tab] Fresh install — no migration needed");
    } else if (details.reason === "update") {
      console.log(`[Atlas Tab] Updated from ${details.previousVersion} to ${chrome.runtime.getManifest().version}`);
      // Migration is handled on first newtab/popup load via packges/core/migration
    }
  });
}

export {};
