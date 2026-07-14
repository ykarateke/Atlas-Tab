# Atlas Tab — Non-Functional Requirements

**Related:** [PRD.md](./PRD.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)

## 1. Performance

- **First paint of the correct wallpaper** must occur before any component framework boot — this is a hard requirement inherited from v1's preload mechanism (see [FEATURE_SPECS.md § Wallpapers](./FEATURE_SPECS.md#wallpapers--theming)), not a nice-to-have. A regression here (flash of blank/wrong background on every new tab) would be immediately visible to every user, every new tab.
- **New-tab time-to-interactive** should not regress vs. the v1 baseline. Because v1 has no build step, there is no existing bundle-size number to beat — establish a baseline by measuring the current unpacked extension's new-tab load time before considering the rewrite complete, and budget the v2 bundle against it.
- **Render cost on mutation:** v1 tears down and rebuilds the boards DOM subtree on nearly every state change. v2's move to a virtual-DOM framework (React, see [ARCHITECTURE.md](./ARCHITECTURE.md)) should improve this, but verify with the profiler on a workspace with a realistic number of boards/bookmarks (tens of boards, low hundreds of bookmarks) rather than assuming the framework switch alone guarantees an improvement.
- **Favicon resolution** must remain cache-backed so steady-state renders do not re-fetch network resources (unchanged requirement from v1).
- No virtualization is required at current expected scale (personal bookmark manager, not an enterprise-scale list) — but note this as a scaling ceiling in [ROADMAP.md](./ROADMAP.md) if it's ever revisited.

## 2. Security & Privacy

- Maintain MV3's CSP posture: no remote code execution, no `eval`, no remotely-hosted scripts.
- OAuth scope stays minimal (`profile email` only) — no expansion to Drive/Calendar/etc. without a deliberate, documented product reason.
- Bookmark data (URLs, titles, descriptions) must never be transmitted to analytics or any third party beyond the sync mechanism the user explicitly opts into (Google sign-in + `chrome.storage.sync`).
- Any state imported from a JSON backup file must be schema-validated (see [DATA_MODEL.md § 15](./DATA_MODEL.md#15-validation--import-boundary)) before being applied — reject or sanitize malformed/unexpected data rather than trusting it blindly, which is stronger than v1's current defensive-but-informal `normalizeState()` approach.
- Rotate the GA4 Measurement Protocol `api_secret` for the new build rather than reusing v1's value (see [ANALYTICS_PLAN.md § 4](./ANALYTICS_PLAN.md#4-privacy-stance)).
- Do not commit real user data to the repository. (Note: v1's repo currently has `newtab-data.json`, which research identified as an apparently-real personal backup with real bookmarks — v2's repo should not repeat this; use a synthetic fixture if a sample dataset is needed.)

## 3. Accessibility

Not formally specified in v1 (no accessibility audit exists in the current codebase). For v2, establish a baseline:
- All interactive controls (buttons, drag handles, menu items) must be keyboard-reachable and have accessible names — this was not verifiable in v1's vanilla DOM approach without a dedicated audit, and should be a deliberate improvement given the framework/component rewrite provides the opportunity.
- Respect `prefers-reduced-motion` for wallpaper transitions and tour/spotlight animations.
- Color contrast: the theming system allows arbitrary user-chosen accent/board colors over arbitrary wallpapers, which makes guaranteed contrast impossible in the general case (same constraint as v1) — but default/bundled wallpaper + theme combinations should meet WCAG AA at minimum.

## 4. Internationalization

- Three UI languages at launch: English, Russian, Turkish (see [FEATURE_SPECS.md § i18n](./FEATURE_SPECS.md#i18n--localization)) — full parity, not a subset.
- All user-facing strings must go through the i18n layer; no hardcoded UI strings in components (a stricter requirement than v1, enforceable via lint rule once the framework is in place).
- Regional display formatting (`locale` settings) remains independent from UI language, per the existing v1 design — do not merge these two concepts.

## 5. Reliability

- Sync failures (quota exceeded, network error) must surface a visible, actionable error to the user rather than failing silently — a deliberate improvement over v1's unverified failure-mode behavior (see [SYNC_AND_STORAGE.md § 8](./SYNC_AND_STORAGE.md#8-quota-risk-carried-forward-not-solved)).
- Migration from v1 legacy state must be idempotent and safe to retry (see [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)) — a crash mid-migration must not leave the user in a half-migrated, unreadable state.
- Crash-free rate / uncaught JS error rate (tracked via the `js_error` analytics event) should be at or below the v1 baseline, measured over the first weeks post-launch.

## 6. Browser & Platform Support

- Chrome only for v2 launch (Manifest V3), per [PRD.md § Non-Goals](./PRD.md#8-non-goals-v2-launch). Firefox/Edge/Safari WebExtensions support is a deferred consideration (see [ROADMAP.md](./ROADMAP.md)), not built for speculatively in this rewrite — avoid premature cross-browser abstraction that isn't needed yet.
- Support the current Chrome MV3 baseline (no reliance on deprecated MV2-only APIs).

## 7. Maintainability (the actual point of this rewrite)

- TypeScript strict mode across all packages.
- Automated test coverage per [PRD.md § Success Metrics](./PRD.md#53-success-metrics): >80% on `packages/core`, 100% on sync/reconcile/migration logic specifically (the highest-risk, least-visible-when-broken logic in the app).
- Lint + typecheck + test must run in CI on every change (see [ARCHITECTURE.md § 7](./ARCHITECTURE.md#7-build--tooling)) — v1 has none of this today.
- No dead code left in the shipped bundle — a build-time check (unused export detection or equivalent) is recommended given v1 shipped at least one confirmed-dead function (`exportBookmarks()`) undetected for an unknown period.
