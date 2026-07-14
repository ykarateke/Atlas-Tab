# Atlas Tab — Documentation Index

This is the full doc set for the from-scratch rewrite of Atlas Tab, written after a complete audit of the current shipped extension (v1: `newtab.js`, `popup.js`, `background.js`, `analytics.js`, `i18n.js`, `manifest.json`, `style.css`). v1 remains at the repository root, unchanged; these docs describe v2, the planned rewrite.

**Start here, in this order:**

1. **[PRD.md](./PRD.md)** — Product Requirements Document. What Atlas Tab is, why it's being rewritten, what "done" means, and the scope decisions that bound everything else in this doc set. Read this first.
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Technical architecture: stack choice (TypeScript + React + Vite/CRXJS), project structure, and the two rendering constraints inherited from v1 that must not regress.
3. **[DATA_MODEL.md](./DATA_MODEL.md)** — The full v2 state schema (TypeScript/Zod), derived field-by-field from v1's runtime `appState` shape.
4. **[SYNC_AND_STORAGE.md](./SYNC_AND_STORAGE.md)** — Where data lives (`chrome.storage.local`/`sync`, IndexedDB, `localStorage`) and how cross-tab/cross-device sync and conflict resolution work.
5. **[FEATURE_SPECS.md](./FEATURE_SPECS.md)** — Per-domain functional spec and acceptance criteria; this is the QA checklist for feature parity.
6. **[ANALYTICS_PLAN.md](./ANALYTICS_PLAN.md)** — Event taxonomy and privacy stance (recreated — v1 referenced this file but never committed it).
7. **[NON_FUNCTIONAL_REQUIREMENTS.md](./NON_FUNCTIONAL_REQUIREMENTS.md)** — Performance, security, accessibility, i18n, reliability, and maintainability requirements.
8. **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)** — How existing users' v1 data upgrades to v2 without loss. The highest-risk part of this project — read before touching storage code.
9. **[ROADMAP.md](./ROADMAP.md)** — Phased build plan, plus the explicitly deferred backlog (per-board styling, calendar events, real sync merge, multi-browser, etc.) so known gaps stay tracked instead of silently disappearing or silently being "fixed" mid-rewrite.

## Key decisions already made (don't re-litigate without cause)

- **Scope:** v2 is feature-parity with v1, on a modern stack. No new user-facing features in the initial release. See [PRD.md § 7](./PRD.md#7-scope-decisions).
- **Stack:** TypeScript + React + Vite (CRXJS) + Zustand + Vitest/Playwright. See [ARCHITECTURE.md § 2](./ARCHITECTURE.md#2-stack-decision).
- **Known v1 tech debt** (per-board styling removal, calendar event stub, sync last-write-wins, dead `exportBookmarks()`, nav-search-bar ambiguity) is tracked, not fixed, in this rewrite. See [ROADMAP.md § 2](./ROADMAP.md#2-deferred--future-considerations).
- **Docs location:** in-repo, under `/docs`, alongside the current v1 source at the repository root.

## Open questions still needing an answer

See [PRD.md § 11](./PRD.md#11-open-questions): final framework sign-off (React vs. Preact), whether to reuse the existing Chrome Web Store listing (`key`/`update_url`), and whether to remove `atlas-tab.zip` / the committed `newtab-data.json` from the repository.
