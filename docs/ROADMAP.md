# Atlas Tab — Roadmap & Deferred Backlog

**Related:** [PRD.md](./PRD.md)

## 1. Phased plan for the rewrite

### Phase 0 — Foundations
- Set up the monorepo (`packages/core`, `packages/ui`, `packages/analytics`, `apps/newtab`, `apps/popup`, `apps/background`) per [ARCHITECTURE.md](./ARCHITECTURE.md).
- Define and validate the Zod schema from [DATA_MODEL.md](./DATA_MODEL.md).
- Build the migration module and its test suite ([MIGRATION_PLAN.md](./MIGRATION_PLAN.md)) — do this early, not last, since it's the highest-risk item and benefits from the longest test-and-fix runway.

### Phase 1 — Core workspace
- Pages, boards (all 5 types), bookmarks, drag & drop, favicon pipeline, trash.
- Integer-grid layout + backdrop-filter isolation carried forward per [ARCHITECTURE.md § 5](./ARCHITECTURE.md#5-rendering-constraints-carried-forward-from-v1-must-not-regress).

### Phase 2 — Widgets & theming
- Weather, pomodoro, notes, calendar (display-only), clock.
- Wallpapers (bundled + upload + auto-analysis), global Style Editor/theming.

### Phase 3 — Sync, identity, settings, popup
- Google sign-in, `chrome.storage.sync` chunking/reconcile per [SYNC_AND_STORAGE.md](./SYNC_AND_STORAGE.md).
- Full Settings surface.
- Quick Save popup, sharing `packages/core` with the new-tab app.

### Phase 4 — Onboarding, i18n, analytics, polish
- Onboarding + guided tour.
- English/Russian/Turkish string parity.
- Analytics event catalog per [ANALYTICS_PLAN.md](./ANALYTICS_PLAN.md).
- Import/export.

### Phase 5 — Migration rollout
- Staged Web Store rollout per [MIGRATION_PLAN.md § 5](./MIGRATION_PLAN.md#5-staged-rollout), monitored via `migration_completed`/`migration_failed` events before widening.

Each phase should close with the corresponding checklist items in [FEATURE_SPECS.md](./FEATURE_SPECS.md) passing manual QA.

---

## 2. Deferred / Future Considerations

Everything in this section was identified during the v1 codebase analysis and **explicitly deferred** from v2's initial scope (confirmed with the product owner, 2026-07-14 — see [PRD.md § Scope Decisions](./PRD.md#7-scope-decisions)). These are not silently dropped; they are a labeled backlog for future prioritization.

| Item | What it would take | Why it's deferred for now |
|---|---|---|
| **Per-board custom styling** | Re-introduce per-board accent/tint/opacity/blur, this time solving the `backdrop-filter` raster-sharing artifact properly (e.g. per-board `isolation: isolate` contexts verified under many simultaneously-customized boards, or an alternative to `backdrop-filter` entirely) | v1 removed this after a visual bug; re-adding it safely needs dedicated design/engineering time beyond a straight re-platform |
| **Calendar event authoring** | Real event CRUD UI + persistence (`CalendarBoard` would need an `events[]` field, not just display) | v1 never actually finished this — it's a genuinely new feature, not a restoration, and was scoped out of a "no new features" rewrite |
| **Sync conflict merge (field-level or CRDT)** | Replace last-write-wins with a real merge strategy for concurrent multi-device edits | Meaningful design effort (conflict UX, data model changes) beyond a re-platform; last-write-wins is retained as a known, documented limitation |
| **Multi-browser support (Firefox/Edge/Safari)** | WebExtensions API compatibility layer, per-browser manifest handling, cross-browser identity/sync equivalents | Explicitly considered and deferred during PRD scoping; Chrome-only for v2 |
| **Custom backend / account system for sync** | Real API + database replacing `chrome.storage.sync`'s ~100KB ceiling | Explicitly considered and deferred; no backend exists today and none is introduced by this rewrite |
| **Tags/labels system** | Cross-board bookmark tagging + filtering, in addition to board-based grouping | Explicitly considered and deferred |
| **`exportBookmarks()`-style bookmarks-only export** | A real, UI-wired "export just my bookmarks" option (v1 had this coded but never wired to a button) | Not prioritized; may be trivial to add later given the export infrastructure already exists for full-state export |
| **Nav search bar default/inclusion decision** | Resolve the v1 doc-vs-code ambiguity about whether it ships enabled | Tracked as an open question in [PRD.md § 11](./PRD.md#11-open-questions) / [FEATURE_SPECS.md § Search](./FEATURE_SPECS.md#search) — needs a decision before Phase 1, not deferred to "later," but noted here since it surfaced from the same v1 audit |
| **Sync quota headroom for large libraries** | Either compress the sync payload further, cap boards/bookmarks count, or accept local-only for very large libraries | No user-reported problem yet; watch and revisit if it becomes real |

When any of these is picked up, promote it out of this table into its own section of [PRD.md](./PRD.md) with proper requirements, rather than implementing ad hoc against this one-line description.
