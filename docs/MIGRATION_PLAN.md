# Atlas Tab — Migration Plan

**Related:** [DATA_MODEL.md](./DATA_MODEL.md) · [SYNC_AND_STORAGE.md](./SYNC_AND_STORAGE.md) · [PRD.md](./PRD.md)

Existing users must not lose data when the extension auto-updates from v1 to v2 through the Chrome Web Store. This is the single highest-risk part of the rewrite (see [PRD.md § Risks](./PRD.md#10-risks)) and must be treated as such: tested, staged, and reversible.

## 1. Trigger point

On extension startup (service worker `onInstalled` with `reason: 'update'`, and/or on first `newtab`/`popup` load after update), check the stored state's shape:
- If `schemaVersion` is absent (v1 never wrote this field) **and** an `appState` key exists in `chrome.storage.local` → this is a v1 → v2 upgrade. Run migration.
- If `schemaVersion` is present and equals the current v2 schema version → no migration needed.
- If `schemaVersion` is present but older than current → run the relevant incremental v2→v2.x migration (future-proofing; none exist yet at initial launch).

## 2. Migration steps

1. **Snapshot first.** Copy the raw pre-migration `appState` (and `appState_<email>` for any signed-in account, and `faviconCache`) to a backup key (e.g. `appState_v1_backup`) before mutating anything. Never migrate in place without a backup — if migration logic has a bug, the user's original data must still be recoverable.
2. **Normalize legacy shapes**, mirroring v1's own `normalizeState()` defensive back-filling, then map into the v2 schema (see [DATA_MODEL.md](./DATA_MODEL.md)):
   - Legacy `x`/`y` pixel board positions and `order` → `col`/`row` integer grid (v1 already had this migration path for very old data; v2 must handle both "very old v1" and "recent v1" shapes).
   - Boards with no `type` field → explicit `type: 'bookmarks'`.
   - Strip any lingering `board.boardStyle` (already dead in v1, must not resurrect as a v2 field — see [DATA_MODEL.md § 3](./DATA_MODEL.md#3-boards)).
   - Scattered top-level settings flags (`openInNewTab`, `hideExtraBookmarks`, `maxBookmarksShown`, `showDescriptions`, `sidebarAlwaysExpanded`, `quickSaveBoard`, `maxBoardCols`, `boardWidth`, `clockEnabled`, `navSearchEnabled`, `navSearchEngine`) → consolidated into `settings` (see [DATA_MODEL.md § 11](./DATA_MODEL.md#11-settings-v2-consolidation-of-scattered-v1-top-level-flags)).
   - `trash`, `focusStats`, `pomTimers` (rename to `pomodoroTimers`), `weather`, `user`, `locale`, `themeStyle`, `wallpaperHistory`/`currentWallId` (consolidate into `wallpaper`) → map field-for-field per [DATA_MODEL.md](./DATA_MODEL.md).
3. **Validate.** Run the fully-mapped object through the v2 Zod schema's `.safeParse()`. If validation fails, do **not** partially apply — fall back to the pre-migration backup, surface a `migration_failed` analytics event (see [ANALYTICS_PLAN.md § 5](./ANALYTICS_PLAN.md#5-funnels-to-monitor-post-launch)) with the validation error, and keep the extension usable on... a compatibility path (see §4) rather than crashing to a blank new-tab page.
4. **Write.** Save the validated v2 state with `schemaVersion` set to the current version. Emit `migration_completed`.
5. **Sync data.** If the user is signed in, the same legacy-v1-chunk-format-cleanup already exists as a v1 behavior (see [SYNC_AND_STORAGE.md § 3](./SYNC_AND_STORAGE.md#3-legacy-v1-chunk-format)) — v2's first sync write after migration should read any legacy chunk format remotely, migrate it the same way, and clean up old keys, exactly as v1 already does when upgrading its own chunk format. Do not assume the local device and a second, not-yet-updated device won't both be reading/writing sync data during a staged rollout — see §5.

## 3. Idempotency & retry safety

Migration must be safe to run more than once without corrupting data (e.g. if the service worker restarts mid-migration, per MV3's ephemeral service-worker lifecycle). Concretely: check for `schemaVersion` presence as the very first step and no-op immediately if already migrated, and make the backup-snapshot step itself idempotent (don't overwrite an existing backup with an already-migrated state on a second run).

## 4. Failure fallback

If migration validation fails (§2 step 3), the extension should not simply crash. Recommended fallback: load a minimal safe default state (equivalent to a fresh install's `DEFAULTS`) so the user has a working new-tab page, while the original pre-migration data remains untouched in the backup key — and surface a clear, dismissible in-app notice ("we couldn't fully restore your saved boards — your data is safe and our team has been notified") rather than silently losing data from the user's point of view.

## 5. Staged rollout

Because Chrome Web Store updates roll out gradually across the install base, some users will be on v1 and others on v2 simultaneously for a period, including potentially the *same* user's synced data being read by both an updated and a not-yet-updated device:
- v2's sync payload format should remain **readable-but-ignorable** by v1 during the rollout window if at all feasible (e.g. avoid repurposing a v1 field name for a different meaning) — if a genuinely breaking sync-format change is unavoidable, document it here explicitly and treat cross-version sync conflicts during rollout as an accepted, time-boxed risk rather than an oversight.
- Monitor `migration_completed` vs. `migration_failed` event volume closely during the first days of rollout (see [ANALYTICS_PLAN.md](./ANALYTICS_PLAN.md)) before widening the rollout percentage.

## 6. Testing requirements

- Unit tests covering the mapping logic in §2 for: a fresh-default v1 install, a heavily-customized v1 install (multiple pages, all board types, wallpaper history, sync enabled), and at least one deliberately malformed/corrupted input (to verify the §4 fallback path triggers correctly rather than throwing).
- An end-to-end test that loads a real captured v1 `appState` fixture (anonymized, not the accidentally-committed `newtab-data.json` — see [NON_FUNCTIONAL_REQUIREMENTS.md § 2](./NON_FUNCTIONAL_REQUIREMENTS.md#2-security--privacy)) through the full migration path and asserts the resulting v2 state renders correctly.
