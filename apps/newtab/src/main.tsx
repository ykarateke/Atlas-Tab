import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./theme.css";
import { App } from "./App";
import { preloadWallpaper } from "./applyWallpaper";
import { runMigration } from "@atlas-tab/core";

async function boot() {
  // Run v1→v2 migration if needed (idempotent — checks schemaVersion first)
  try {
    const storageAdapter = {
      get: (key: string) =>
        new Promise<unknown>((resolve) =>
          chrome.storage.local.get(key, (r) => resolve(r[key])),
        ),
      set: (key: string, value: unknown) =>
        new Promise<void>((resolve) =>
          chrome.storage.local.set({ [key]: value }, () => resolve()),
        ),
    };
    await runMigration(storageAdapter);
  } catch {
    // Migration failure is non-fatal; default state loads anyway
  }

  // Preload wallpaper before mounting React to prevent flash of unstyled
  // background (FEATURE_SPECS.md § Preload flash prevention).
  try {
    const raw = await new Promise<unknown>((resolve) =>
      chrome.storage.local.get("appState", (r) => resolve(r.appState ?? null)),
    );
    const currentId =
      raw && typeof raw === "object"
        ? ((raw as Record<string, unknown>).wallpaper as Record<string, unknown> | undefined)
            ?.currentId as string | null | undefined
        : null;
    await preloadWallpaper(currentId ?? null);
  } catch {
    // Preload failure is non-fatal; default CSS background applies
  }

  const container = document.getElementById("root");
  if (!container) {
    throw new Error("Root element not found");
  }

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void boot();
