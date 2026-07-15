import type { AppStateStorage } from "@atlas-tab/core";

// chrome.storage.local implementation of the generic get/set storage
// interface packages/core's persistence and favicon-cache modules depend on
// (kept adapter-shaped so those modules stay testable without chrome.*).
export const chromeStorageAdapter: AppStateStorage = {
  get: (key) =>
    new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => resolve(result[key]));
    }),
  set: (key, value) =>
    new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => resolve());
    }),
};
