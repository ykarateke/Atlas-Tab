import { defineManifest } from "@crxjs/vite-plugin";

// Phase 0 scaffold manifest — permissions/oauth2 client_id are finalized in Phase 3
// (Google sign-in, chrome.storage.sync) per ARCHITECTURE.md § 6 and PRD.md.
export default defineManifest({
  manifest_version: 3,
  name: "Atlas Tab",
  version: "0.0.0",
  description:
    "A calm, personal new-tab page: pages, boards, and bookmarks, with weather, pomodoro, notes, and calendar widgets.",
  icons: {
    16: "public/icons/icon16.png",
    32: "public/icons/icon32.png",
    48: "public/icons/icon48.png",
    128: "public/icons/icon128.png",
  },
  action: {
    default_popup: "apps/popup/index.html",
    default_icon: {
      16: "public/icons/icon16.png",
      32: "public/icons/icon32.png",
      48: "public/icons/icon48.png",
      128: "public/icons/icon128.png",
    },
  },
  chrome_url_overrides: {
    newtab: "apps/newtab/index.html",
  },
  background: {
    service_worker: "apps/background/src/index.ts",
    type: "module",
  },
  permissions: ["storage", "identity", "unlimitedStorage", "search", "favicon"],
});
