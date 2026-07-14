# Atlas Tab — Product Requirements Document (v2 Rewrite)

**Status:** Draft for review
**Owner:** TBD
**Last updated:** 2026-07-14
**Related docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [DATA_MODEL.md](./DATA_MODEL.md) · [FEATURE_SPECS.md](./FEATURE_SPECS.md) · [SYNC_AND_STORAGE.md](./SYNC_AND_STORAGE.md) · [NON_FUNCTIONAL_REQUIREMENTS.md](./NON_FUNCTIONAL_REQUIREMENTS.md) · [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) · [ROADMAP.md](./ROADMAP.md) · [ANALYTICS_PLAN.md](./ANALYTICS_PLAN.md)

---

## 1. Summary

Atlas Tab is a Chrome new-tab-replacement extension: a calm, personal start page organized as **pages → boards → bookmarks**, with a handful of productivity widgets (weather, pomodoro focus timer, notes, calendar, mini search) layered on top of a customizable wallpaper/theme system, plus optional Google-account cross-device sync.

**v1 (current, shipped)** is a single 5,278-line vanilla-JS file (`newtab.js`) with no build step, no types, no tests, and a second, independently-duplicated copy of the data-writing logic in the toolbar popup (`popup.js`). It works, and the product surface is good, but the codebase has accumulated dead code, undocumented duplication, and a few stalled features (see [§3](#3-current-state-v1-assessment)).

**v2 (this rewrite)** re-implements the *same product surface* — full feature parity, no shrinkage — on a modern, typed, componentized, testable stack (see [ARCHITECTURE.md](./ARCHITECTURE.md)). Per explicit decision (see [§7](#7-scope-decisions)), v2 is **not** adding new user-facing features and is **not** committing to fixing the known v1 tech-debt items in its first release — it is a clean-room re-platform. Known gaps and possible enhancements are captured as an explicitly deferred backlog in [ROADMAP.md](./ROADMAP.md) so they aren't lost, but they are out of scope unless re-prioritized later.

---

## 2. Problem Statement & Vision

**Problem.** Every new tab is a moment of choice: check email, keep working, get distracted. Atlas Tab's bet is that a calm, personally-organized, visually pleasing start page reduces that friction — bookmarks grouped the way the user actually thinks about them (not a flat bar or a folder tree), with just enough ambient utility (time, weather, a focus timer) to make the new-tab page a place worth landing on rather than a page to close.

**Vision.** Atlas Tab should feel like *your* desk: a small number of boards you glance at daily, styled the way you like, fast enough that you never notice it's there, and available identically wherever you're signed in.

**Why rewrite now.** The current implementation cannot safely grow: one 5,278-line file with no types and no tests means every change risks silent regressions (the research for this PRD already found: a per-board styling feature quietly removed, a calendar widget that renders event UI with no way to create an event, an export function that's wired to nothing, and a doc/code mismatch over whether the nav search bar is enabled). A typed, componentized, tested codebase is a prerequisite for any future feature work — including the ideas already parked in [ROADMAP.md](./ROADMAP.md).

---

## 3. Current State (v1) Assessment

This section is the "as-is" reference so nothing gets silently dropped in the rewrite. Full mechanism-level detail lives in [FEATURE_SPECS.md](./FEATURE_SPECS.md); this is the executive summary.

### 3.1 What v1 does today (feature parity baseline for v2)

| Domain | Current capability |
|---|---|
| **Workspace** | Multi-page tabs; each page holds a grid of boards positioned by integer column/row (not free pixel placement — this was a deliberate fix for a `backdrop-filter` rendering artifact, see [ARCHITECTURE.md §Rendering constraints](./ARCHITECTURE.md#rendering-constraints)) |
| **Boards** | 5 types: plain bookmark board, notes, calendar (display-only, see gap below), pomodoro timer, mini search. CRUD, rename, drag-reorder/move across columns |
| **Bookmarks** | Add (URL + auto-derived title + optional description), edit, delete (to trash), reorder/move via drag & drop, open in new/current tab, open incognito |
| **Favicons** | 6-tier fallback chain (hardcoded Google-product map → own `/favicon.ico` → Google faviconV2 → DuckDuckGo → root-domain retry → Chrome's internal favicon cache), all normalized to cached PNG data URLs |
| **Widgets** | Weather (Open-Meteo, no API key), Pomodoro focus timer (wall-clock-accurate, survives reload, logs stats), Notes (autosaving freeform text), Calendar (month view — **event creation UI does not exist**, dots render from data with no way to add it), Clock |
| **Wallpapers** | 14 bundled images + 2 gradient presets + user-uploaded image/video; auto color/brightness analysis derives an accent + board tint theme on upload |
| **Theming** | One global `themeStyle` (accent color, board tint color/opacity/blur, dark/light flag, text size/weight) applied everywhere. **Per-board styling existed and was removed** due to a `backdrop-filter` visual bug with many customized boards |
| **Search** | Global `Ctrl/Cmd+K` bookmark search overlay; per-board "search board" widget; a topbar "nav search bar" whose enabled/disabled status is inconsistently documented vs. its actual (wired) code path |
| **Trash** | Soft-delete for boards (with their bookmarks) and individual bookmarks; manual restore or permanent delete; no keyboard undo |
| **Sync** | Optional, gated by Google sign-in; syncs the whole relevant state through `chrome.storage.sync` using a custom byte-aware chunking scheme to work around the 8KB-per-item quota; conflict resolution is last-write-wins by timestamp (no field merge) |
| **Identity** | Google OAuth (`profile email` scopes only) purely to identify the user and gate sync — no other Google API usage |
| **Quick Save popup** | Toolbar-icon popup (own keyboard shortcut) to save the current tab as a bookmark without opening the new tab page |
| **Import/Export** | Import folders from native Chrome Bookmarks; export/import full app state as JSON for backup/restore |
| **Settings** | Account, Appearance, board text size/weight, general toggles, board layout (columns/width), Quick Save destination, language (en/ru/tr), region/locale formatting, sidebar behavior |
| **Onboarding** | Sign-in-or-guest first-run screen + a 9-step guided product tour |
| **i18n** | English, Russian, Turkish UI strings; separate from auto-detected regional date/time/temperature formatting |
| **Analytics** | GA4 via Measurement Protocol (no `gtag.js`, MV3 CSP disallows it); funnels for onboarding, sign-in, activation, and per-feature usage events |

### 3.2 Known v1 issues (explicitly deferred, not v2 scope)

Captured in full in [ROADMAP.md § Deferred / Future Considerations](./ROADMAP.md#deferred--future-considerations). Summary: per-board custom styling is gone, calendar event creation was never finished, sync conflict handling is last-write-wins only, `exportBookmarks()` is dead code, the nav search bar's intended state is ambiguous, and there is no automated test suite of any kind. **Decision for this rewrite (confirmed 2026-07-14): none of these are v2 launch blockers.** They are preserved as backlog, not silently dropped and not silently fixed.

---

## 4. Target Users & Personas

Atlas Tab is a **single-user personal productivity tool** — there is no team/sharing/collaboration model today, and none is being added in v2.

- **The organizer** — has 20-100 bookmarks they actually use, wants them grouped by project/topic instead of a flat bookmarks bar, and opens a new tab many times a day.
- **The multi-device user** — uses Chrome across a work laptop and a personal laptop (or reinstalls periodically) and wants their boards to follow them via Google sign-in.
- **The focus-timer user** — uses the pomodoro board as a lightweight, always-visible timer without installing a separate app.
- **The aesthetic user** — cares about wallpaper/theme fit and about the new tab page not looking like a spreadsheet.

---

## 5. Goals & Success Metrics

### 5.1 Product goals (unchanged from v1 — this is a re-platform, not a repositioning)
- Every v1 feature in [§3.1](#31-what-v1-does-today-feature-parity-baseline-for-v2) is present and behaviorally equivalent in v2 (see [FEATURE_SPECS.md](./FEATURE_SPECS.md) for the acceptance-level detail per feature).
- No regression in new-tab load latency or perceived responsiveness (see [NON_FUNCTIONAL_REQUIREMENTS.md](./NON_FUNCTIONAL_REQUIREMENTS.md)).
- Existing users' data migrates automatically and losslessly on upgrade (see [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)).

### 5.2 Engineering goals (the actual point of this rewrite)
- Typed data model with a single source of truth shared by the new-tab page and the popup (eliminates the current dual-implementation risk in `popup.js` vs `newtab.js`).
- Componentized UI with unit/integration test coverage for state logic (sync reconciliation, favicon fallback chain, layout/positioning, trash/restore) — none of which has any test today.
- A build pipeline (bundling, type-checking, linting) replacing the current "no build tool, no package.json" setup.
- No feature or dead-code drift silently accumulating — every intentionally-deferred item is tracked in [ROADMAP.md](./ROADMAP.md) instead of living as an undocumented stub.

### 5.3 Success metrics
| Metric | Target |
|---|---|
| Feature parity checklist ([FEATURE_SPECS.md](./FEATURE_SPECS.md)) items passing manual QA | 100% before v2 ships to existing users |
| Automated test coverage on state/reducer logic (`packages/core` per [ARCHITECTURE.md](./ARCHITECTURE.md)) | >80% lines, 100% of sync/reconcile/migration logic |
| New-tab first-paint time (wallpaper visible) | ≤ current v1 baseline (measure before rewrite as reference) |
| Data-loss incidents during migration rollout | 0 |
| Crash-free / uncaught-JS-error rate (from analytics `js_error` event) | ≤ current v1 baseline |

---

## 6. Functional Requirements (by domain)

Each row is a P0 (must ship, blocks release) unless noted. Full acceptance criteria live in [FEATURE_SPECS.md](./FEATURE_SPECS.md); this is the index.

| # | Domain | Requirement | Priority |
|---|---|---|---|
| F1 | Workspace | Multi-page tabs with add/rename/reorder/delete (min. 1 page always exists) | P0 |
| F2 | Boards | Create/rename/delete/reorder/move boards on an integer grid per page; 5 board types (plain, notes, calendar, pomodoro, search) | P0 |
| F3 | Bookmarks | Add/edit/delete/reorder/move bookmarks within and across boards | P0 |
| F4 | Favicons | Multi-tier fallback resolution with local caching; never show a broken image | P0 |
| F5 | Weather widget | City search, current conditions from Open-Meteo, unit preference, periodic refresh | P0 |
| F6 | Pomodoro widget | Configurable focus/break/cycle lengths, wall-clock-accurate countdown surviving reload, audio cues, session stats history + chart | P0 |
| F7 | Notes widget | Freeform autosaving text per board | P0 |
| F8 | Calendar widget | Month view navigation, today/weekend highlighting — **as a v1-parity display-only widget**; event creation remains out of scope per [§7](#7-scope-decisions) | P0 (display only) |
| F9 | Wallpapers | Bundled presets + custom image/video upload, history, auto theme-from-wallpaper analysis | P0 |
| F10 | Theming | Global accent/board tint/opacity/blur/text-size/weight, light/dark handling | P0 |
| F11 | Search | Global bookmark search overlay (`Ctrl/Cmd+K`), per-board search widget | P0 |
| F12 | Trash | Soft-delete + restore + permanent delete for boards and bookmarks | P0 |
| F13 | Sync | Optional Google-sign-in-gated cross-device sync via `chrome.storage.sync`, last-write-wins conflict policy (explicitly retained, see [SYNC_AND_STORAGE.md](./SYNC_AND_STORAGE.md)) | P0 |
| F14 | Quick Save | Toolbar popup to save current tab without opening new-tab page, sharing the same typed data layer as the main app | P0 |
| F15 | Import/Export | Import from native Chrome Bookmarks; export/import full-state JSON backup | P0 |
| F16 | Settings | Full settings surface at parity with v1 (see [FEATURE_SPECS.md § Settings](./FEATURE_SPECS.md#settings)) | P0 |
| F17 | Onboarding | Sign-in-or-guest first run + guided tour | P1 |
| F18 | i18n | English, Russian, Turkish, with graceful fallback to English for missing keys | P0 |
| F19 | Analytics | GA4 Measurement Protocol event tracking at parity with v1's event catalog, revised per [ANALYTICS_PLAN.md](./ANALYTICS_PLAN.md) | P1 |
| F20 | Data migration | Detect and upgrade any existing v1 `appState` on first v2 load, with a pre-migration backup | P0 |

---

## 7. Scope Decisions

Decisions below were confirmed with the product owner on 2026-07-14 and should not be re-litigated without a deliberate scope-change conversation:

1. **Documentation language:** all technical docs in English; product/technical split was considered but a single-language doc set was chosen for consistency.
2. **Target stack:** modern typed stack — TypeScript + a component framework + Vite-based build (final framework choice and rationale in [ARCHITECTURE.md](./ARCHITECTURE.md)) — replacing the current no-build vanilla setup.
3. **Feature scope:** v2 is feature-parity with v1. No new user-facing features are in scope for the initial release. Known v1 tech debt (per-board styling removal, calendar event stub, sync merge strategy, dead `exportBookmarks()` code, nav-search-bar ambiguity) is **explicitly deferred** — not fixed, not silently dropped — and lives in [ROADMAP.md](./ROADMAP.md) as a labeled backlog for future prioritization.
4. **Docs location:** this doc set lives in `/docs` in the existing Atlas Tab repository (the rewrite is expected to happen in-repo, e.g. on a branch or in a new source directory, not a separate repository).

---

## 8. Non-Goals (v2 launch)

- No team/multi-user features, sharing, or collaboration.
- No new browser targets beyond Chrome (Firefox/Edge/Safari WebExtensions support was considered and explicitly deferred — see [ROADMAP.md](./ROADMAP.md)).
- No custom backend/account system to replace `chrome.storage.sync` (considered and deferred).
- No tags/labels system beyond the existing board-based grouping (considered and deferred).
- No real (field-level/CRDT) sync conflict merging — last-write-wins is retained by decision, not oversight.
- No monetization/paywall of any kind (matches v1's "free forever" model; no gating scaffolding should be added).

---

## 9. Assumptions & Constraints

- Ships as a Chrome Manifest V3 extension; must operate within MV3 service-worker and CSP constraints (no remote code execution, e.g. why analytics uses Measurement Protocol over `fetch` instead of `gtag.js`).
- Single-user, client-only architecture: all durable state lives in `chrome.storage.local`/`chrome.storage.sync` plus IndexedDB for large binary wallpaper data — there is no application backend today and none is introduced by this rewrite.
- `chrome.storage.sync` has an effectively fixed ~100KB total quota per user; this is a hard ceiling on how much state can sync, independent of local storage (which is unlimited via the `unlimitedStorage` permission).
- Existing users must not lose data on upgrade — the extension auto-updates in place via the Chrome Web Store, so migration must run unattended (see [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)).

---

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Migration bug corrupts/loses existing users' boards on upgrade | High | Pre-migration snapshot backup, staged rollout, migration covered by automated tests (see [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)) |
| Feature parity gaps discovered post-launch (5,278-line v1 has many small behaviors) | Medium | [FEATURE_SPECS.md](./FEATURE_SPECS.md) acceptance criteria derived directly from v1 source reading, manual QA pass against the parity checklist before release |
| New framework/bundle size regresses new-tab load time | Medium | Perf budget + measurement baseline in [NON_FUNCTIONAL_REQUIREMENTS.md](./NON_FUNCTIONAL_REQUIREMENTS.md) |
| `popup.js` / `newtab.js` logic drift re-emerges in the new architecture if the shared core isn't actually shared | Medium | Architecture mandates a single shared package for state/schema/mutations, imported by both surfaces (see [ARCHITECTURE.md](./ARCHITECTURE.md)) |
| GA4 API secret exposure (client-side secret is technically extractable, as in v1) | Low | Accepted risk, same as v1 (send-only scope); document explicitly in [ANALYTICS_PLAN.md](./ANALYTICS_PLAN.md) rather than silently carrying it forward |

---

## 11. Open Questions

- Final component framework choice (React vs. Preact vs. Svelte) — see [ARCHITECTURE.md § Decision](./ARCHITECTURE.md#framework-decision) for the recommendation and tradeoffs; needs sign-off before implementation starts.
- Should the Chrome Web Store `key`/`update_url` and existing listing be reused for v2, or does this ship as an update to the existing listing? (Flagged in research as sensitive — needs an explicit answer, not an assumption.)
- Should `atlas-tab.zip` and the committed `newtab-data.json` (looks like accidentally-committed personal data) be removed from the repository as part of this work? Recommended yes, needs confirmation.
