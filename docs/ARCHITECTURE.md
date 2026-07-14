# Atlas Tab — Technical Architecture

**Related:** [PRD.md](./PRD.md) · [DATA_MODEL.md](./DATA_MODEL.md) · [SYNC_AND_STORAGE.md](./SYNC_AND_STORAGE.md) · [NON_FUNCTIONAL_REQUIREMENTS.md](./NON_FUNCTIONAL_REQUIREMENTS.md)

## 1. Why rewrite the architecture, specifically

The v1 implementation is a single 5,278-line `newtab.js` with no types, no build step, and no tests, plus a second script (`popup.js`) that independently re-implements the same state read/write logic (ID generation, title cleaning, `_writer` stamping) because there is no shared module system. Concretely, this rewrite exists to fix:

- **No single source of truth for the data model.** Any change to the bookmark/board schema must be hand-mirrored in `popup.js`, which is easy to forget (already flagged as a live risk in the codebase research).
- **No types.** State shape (`pages → boards → bookmarks`, `themeStyle`, `pomTimers`, etc.) is documented only in comments and inferred from `normalizeState()`'s defensive back-filling.
- **No tests.** Sync reconciliation, favicon fallback, drag/drop reflow, and migration/normalization logic all currently rely entirely on manual testing.
- **No build step.** Every file is hand-authored and loaded as-is by the browser; there's no dead-code elimination, no bundling, no minification pipeline to reason about.
- **Full-subtree re-render on every mutation.** `renderBoards()`/`renderPages()` tear down and rebuild DOM subtrees from scratch on essentially every state change — acceptable at personal-bookmark-manager scale but not a foundation to build on.

## 2. Stack decision

### 2.1 Recommendation

| Layer | Choice | Rationale |
|---|---|---|
| Language | **TypeScript** (strict mode) | Non-negotiable given the schema-drift problem above |
| UI framework | **React 18+** | Largest ecosystem, best MV3-extension tooling support (CRXJS), easiest to hire/onboard for; component model maps naturally onto boards/bookmarks/widgets |
| Build tool | **Vite** + `@crxjs/vite-plugin` | Purpose-built for MV3 extensions: HMR in the extension context, manifest-driven multi-entry build (newtab page, popup, background service worker) from one config |
| State management | **Zustand** | Small, no-boilerplate, plays well with a `chrome.storage`-backed persistence middleware; avoids Redux ceremony for what is fundamentally one normalized state tree |
| Styling | **CSS Modules** or **vanilla-extract** (decide during implementation) + a small design-token file for theme variables (replaces the current single 2,482-line global `style.css`) | Component-scoped styles prevent the "one giant stylesheet with comment-delimited sections" problem seen in v1 |
| Testing | **Vitest** (unit/integration) + **Testing Library** (component) + **Playwright** (E2E against a loaded unpacked extension) | Vitest shares Vite's config/transform pipeline; Playwright has first-class Chrome-extension-loading support |
| Linting/formatting | **ESLint** (typescript-eslint) + **Prettier** | Baseline hygiene the current repo has none of |
| Package manager | **pnpm** | Fast, disk-efficient, good workspace support for the monorepo layout below |

### 2.2 Framework decision — detail

React was chosen over Preact/Svelte for this project specifically because:
- CRXJS (the Vite MV3 plugin) has the most mature React integration and examples.
- The component surface here is DOM-heavy and stateful (drag & drop, popups, modals) rather than raw-performance-critical — React's overhead is not a real constraint at this app's scale (tens of boards, at most low hundreds of bookmarks).
- Broadest hiring/contribution pool if this project ever needs another contributor.

This is a **recommendation pending final sign-off** (see [PRD.md § Open Questions](./PRD.md#11-open-questions)) — Preact (smaller bundle) remains a reasonable fallback if new-tab load-time budget (see [NON_FUNCTIONAL_REQUIREMENTS.md](./NON_FUNCTIONAL_REQUIREMENTS.md)) proves tight in practice.

## 3. Project structure (monorepo)

```
atlas-tab/
├── manifest.config.ts          # CRXJS manifest definition (typed, generates manifest.json)
├── vite.config.ts
├── packages/
│   ├── core/                   # Framework-agnostic: schema, types, state mutations, migration
│   │   ├── src/
│   │   │   ├── schema/         # Zod schemas + inferred TS types (see DATA_MODEL.md)
│   │   │   ├── state/          # Pure reducer-style mutation functions (addBookmark, moveBoardTo, ...)
│   │   │   ├── sync/           # chrome.storage.sync chunking, reconcile, conflict policy
│   │   │   ├── favicon/        # Fallback-chain resolution + cache, no DOM dependency
│   │   │   ├── migration/      # v1 legacy -> v2 schema migration (see MIGRATION_PLAN.md)
│   │   │   └── i18n/           # String tables + t()/interpolate, framework-agnostic
│   │   └── package.json
│   ├── ui/                     # Shared React components (Board, Bookmark, widgets, modals)
│   └── analytics/              # GA4 Measurement Protocol client, shared by newtab/popup/background
├── apps/
│   ├── newtab/                 # New-tab page app (imports packages/core + packages/ui)
│   ├── popup/                  # Quick Save popup app (imports the SAME packages/core mutation
│   │                           #   functions — this is the fix for the v1 popup/newtab drift risk)
│   └── background/             # MV3 service worker (install/uninstall analytics, alarms if needed)
├── public/
│   └── wallpapers/             # Bundled wallpaper assets (unchanged from v1)
└── docs/                       # This doc set
```

**The core fix this structure delivers:** `popup` and `newtab` both depend on `packages/core` for every state mutation (adding a bookmark, computing `quickSaveBoard` defaults, generating IDs). There is exactly one implementation of "what does adding a bookmark do to the state," used by both entry points — eliminating the v1 class of bug where popup.js and newtab.js could silently diverge.

## 4. State management design

- `packages/core/state` exposes pure functions: `(state, action) => newState`, fully unit-testable without any browser API.
- A thin Zustand store in each app (`newtab`, `popup`) wraps these pure functions and persists to `chrome.storage.local` via a middleware, mirroring v1's debounced `saveState()` but now type-checked and shared.
- Cross-tab/cross-device reconciliation (`chrome.storage.onChanged` listener, "defer while user is busy" logic, `_writer` tab-stamping) is reimplemented as a single tested module in `packages/core/sync`, not duplicated per app.
- Rendering is React's normal reconciliation — this replaces v1's manual `innerHTML` teardown-and-rebuild-on-every-change pattern with virtual-DOM diffing, which is the direct fix for the "full subtree re-render" performance note from the v1 research.

## 5. Rendering constraints carried forward from v1 (must not regress)

Two v1 workarounds are **product/visual requirements**, not implementation debt — they must be re-derived, not dropped, or the board UI will visibly regress:

1. **Integer pixel positioning for board columns.** Sub-pixel board edges combined with `backdrop-filter: blur()` produce a visible light "halo" at board borders. v2's layout component must compute and apply whole-pixel positions (e.g. round column offsets before they hit `style.left`/`transform`), the same way v1's `renderBoards()` does.
2. **Stacking-context isolation for blurred elements.** v1 applies `isolation: isolate` on `.topbar` and `.board` so `backdrop-filter` doesn't raster-share across stacked blurred elements. v2's design-token/component layer must apply the CSS equivalent per component.

Document any deviation from these two constraints explicitly if the new styling approach (CSS Modules/vanilla-extract) changes how blur/positioning is computed — do not silently drop them and rediscover the halo bug.

## 6. MV3 platform constraints (unchanged, must be respected)

- **No remote code execution.** `content_security_policy.extension_pages` forbids remote scripts — this is why v1's analytics hand-rolls GA4 Measurement Protocol calls via `fetch` instead of loading `gtag.js`, and v2 must do the same (see [ANALYTICS_PLAN.md](./ANALYTICS_PLAN.md)).
- **Service worker, not persistent background page.** `packages/analytics` and any background logic must be written assuming the worker can be killed and restarted at any time — no reliance on in-memory state surviving between events.
- **`chrome.storage.sync` quota (~100KB total, 8KB/item)** is a hard platform ceiling, independent of framework choice — the chunking strategy in [SYNC_AND_STORAGE.md](./SYNC_AND_STORAGE.md) must be preserved.

## 7. Build & tooling

- `pnpm install && pnpm dev` — Vite dev server with CRXJS HMR for the unpacked extension.
- `pnpm build` — production build emitting a load-unpacked-ready `dist/` (and the zip artifact for Web Store upload — see [ROADMAP.md](./ROADMAP.md) regarding removing the currently-committed `atlas-tab.zip` from source control in favor of a build/CI artifact).
- `pnpm test` — Vitest unit/integration suite (target: `packages/core` at >80% coverage per [PRD.md § Success Metrics](./PRD.md#53-success-metrics)).
- `pnpm test:e2e` — Playwright suite driving a loaded unpacked build for the parity checklist in [FEATURE_SPECS.md](./FEATURE_SPECS.md).
- CI (recommended, not yet configured): lint + typecheck + unit tests + build on every PR; Playwright suite on merge to main.

## 8. What is explicitly NOT changing in this rewrite

Per [PRD.md § Scope Decisions](./PRD.md#7-scope-decisions): the *product surface* (features, visual language, data model semantics) is not changing. This document only concerns *how* that surface is built, not *what* it does. Any temptation during implementation to "fix" a v1 behavior (per-board styling, calendar events, sync merge strategy) should be redirected to [ROADMAP.md](./ROADMAP.md) rather than implemented ad hoc mid-rewrite.
