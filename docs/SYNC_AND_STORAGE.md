# Atlas Tab — Storage & Sync Design

**Related:** [DATA_MODEL.md](./DATA_MODEL.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)

This document specifies where data lives and how it moves between tabs and devices. Every mechanism here is a **direct carry-forward of v1's design**, re-specified so it can be implemented from a typed, tested module (`packages/core/sync`) instead of re-derived ad hoc. Deviations are called out explicitly; anything not called out should be treated as "same behavior as v1."

## 1. Storage layers

| Layer | Contents | Why |
|---|---|---|
| `chrome.storage.local` | Full `AppState` (minus large binary wallpaper data), under a single key | Primary source of truth for the signed-out/local case; effectively unlimited size via the `unlimitedStorage` permission |
| `chrome.storage.local` (per-account) | `appState_<email>` — a full separate snapshot per signed-in Google account | Lets a user sign out/in or switch accounts without merging unrelated accounts' data (v1 behavior, unchanged) |
| `chrome.storage.local` | `faviconCache` — separate key, see [DATA_MODEL.md §14](./DATA_MODEL.md#14-favicon-cache-separate-storage-key-not-part-of-appstate) | Kept separate so favicon cache churn doesn't inflate the size/change-frequency of the main state write |
| `chrome.storage.sync` | Chunked subset of `AppState` (see §3) | Only used when the user is signed in; ~100KB total quota, 8KB per item |
| IndexedDB (`atlas-tab-db` / `wallpapers` store) | Wallpaper image data URLs / video Blobs | Wallpaper bytes can exceed practical `chrome.storage` item sizes; IndexedDB has no comparable per-item ceiling |
| `localStorage` | Current wallpaper's *fast-path* preview (image/bundled only) + UI language override + analytics session bookkeeping | Read synchronously by the pre-render script before the app boots, to paint the correct background with zero flash (see [FEATURE_SPECS.md § Wallpapers](./FEATURE_SPECS.md#wallpapers--theming)) |

## 2. Why not sync everything through `chrome.storage.sync` directly

`chrome.storage.sync` has a hard ~100KB total quota and an 8KB-per-item limit. A user's full state (boards, bookmarks, focus stats, wallpaper history metadata) can exceed 8KB as a single JSON blob well before it's large in absolute terms. v1 solves this with **byte-accurate chunking** — this is preserved in v2:

- Serialize the sync-relevant subset of state to a JSON string.
- Split it into chunks sized so that each chunk's *stored* representation (accounting for JSON string-escaping — a `"` or `\` costs 2 bytes stored, a control character costs 6) stays under the per-item quota, not just the raw character count. This distinction matters: a naive character-count split can still overflow the actual quota.
- Store chunks under keys `mz_c_0 .. mz_c_N`, plus metadata keys: `mz_v` (payload format version), `mz_n` (chunk count), `mz_ts` (write timestamp), `mz_email` (ownership check, so a stray sync payload from a different account is never applied).

**Fields included in the sync payload** (v1 parity): pages, activePageId, themeStyle, most user settings, focusStats, boards, bookmarks, trash. **Not included:** anything derived/cached (favicon cache, weather cache) or purely local bookkeeping (`_writer`).

## 3. Legacy v1 chunk format

v1 shipped an earlier, unchunked-by-version sync format (separate `mz_meta`/`mz_boards`/`mz_trash`/`mz_bk_*`/`mz_bd_*` keys) before the current `mz_c_*` scheme. v2 must be able to **read** this legacy format for users upgrading directly from an old v1 build with stale synced data, and **clean it up** (delete the legacy keys) on its first successful v2-format write — same as v1 does today. See [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) for the full upgrade sequencing.

## 4. Conflict resolution: last-write-wins (explicit decision, not a gap)

**v2 retains v1's conflict policy as-is: last-write-wins by timestamp, no field-level merge.** This was evaluated during PRD scoping and explicitly deferred (see [PRD.md § Scope Decisions](./PRD.md#7-scope-decisions) and [ROADMAP.md](./ROADMAP.md)) rather than treated as a defect to fix in this rewrite. Document this clearly in any user-facing sync help text: editing the same board on two offline devices between sync windows will silently keep only the more-recently-written device's version.

Mechanism (unchanged from v1):
- On any local save while signed in, schedule a sync write ~3 seconds later (debounced, so rapid successive edits coalesce into one sync write).
- On receiving a `chrome.storage.onChanged` event for the `sync` area, compare timestamps (`mz_ts` vs. local `_syncTs`); if remote is newer, overwrite local state wholesale with the remote payload.
- On explicit sign-in, compare the newly-signed-in account's remote `meta.ts` against any existing local `_syncTs` for that account and take whichever is newer.

## 5. Multi-tab / multi-write disambiguation (`_writer` stamping)

Every local write stamps a `_writer` field with a per-tab-session random identifier before saving. This lets the `chrome.storage.onChanged` listener distinguish:
- **"This is my own write echoing back"** (ignore — no need to re-render or re-fetch what we just wrote), from
- **"This is a genuine external write"** (another tab, the Quick Save popup, or a synced remote change — must reconcile).

This must remain a **shared, single implementation** in `packages/core/sync`, used identically by the `newtab` app and the `popup` app — this is the direct fix for v1's popup/newtab duplication risk (see [ARCHITECTURE.md § 3](./ARCHITECTURE.md#3-project-structure-monorepo)).

## 6. Deferred reconciliation (don't yank focus mid-interaction)

If an external state change arrives while the user is actively interacting with the UI — a focused `input`/`textarea`/`select`/`contenteditable`, an in-progress board or bookmark drag, or any open popup/menu/modal — the reconcile must **not** apply immediately. Instead:
- Stash only the *latest* pending external change (superseding any earlier stashed one).
- Apply it automatically on the next `focusout`, `dragend`, or `click` once the user is no longer mid-interaction.

This prevents the exact class of bug where a live sync update resets an open dropdown's position or clears mid-typed text — a real v1 design consideration that must be preserved, not simplified away.

## 7. Wallpaper storage split — parity requirement

Because `localStorage` cannot hold a `Blob` (video wallpapers) and reading IndexedDB requires an async round-trip, v1 uses a two-tier approach that v2 must preserve:
- **Image / bundled wallpapers:** a small pointer + the actual data URL is mirrored into `localStorage` so a synchronous pre-render script can paint it before any JS framework boots.
- **Video / gradient wallpapers:** cannot be prepared synchronously. The pre-render script instead hides the page (`opacity: 0`) and kicks off the IndexedDB read *immediately*, in parallel with the rest of the app's script loading/parsing, so the main app can `await` an already-in-flight read instead of starting one from scratch. This parallelization detail is a deliberate perf optimization, not incidental — preserve it (see [FEATURE_SPECS.md § Wallpapers](./FEATURE_SPECS.md#wallpapers--theming) and [ARCHITECTURE.md](./ARCHITECTURE.md) for how this interacts with the framework's boot sequence).

## 8. Quota risk (carried forward, not solved)

`focusStats` is explicitly capped (1000 entries, FIFO eviction) specifically to bound its contribution to the sync payload size. There is **no cap** on the number of boards or bookmarks — a very large personal library could eventually exceed the ~100KB sync quota even though local storage has no such limit. v1 does not solve this and v2 is not required to either (see [ROADMAP.md](./ROADMAP.md) for "sync quota headroom" as a future consideration) — but the sync module should **fail loudly** (surface a user-visible error/toast) rather than silently drop data if a sync write is rejected for exceeding quota, which is a testable improvement over v1's current (unverified) behavior in that failure case.
