# Atlas Tab — Feature Specifications

**Related:** [PRD.md](./PRD.md) · [DATA_MODEL.md](./DATA_MODEL.md) · [SYNC_AND_STORAGE.md](./SYNC_AND_STORAGE.md)

This is the acceptance-criteria-level detail behind [PRD.md § 6 Functional Requirements](./PRD.md#6-functional-requirements-by-domain). Each section states current v1 behavior (the parity bar) and any v2-specific implementation notes. Use this as the QA checklist before v2 ships to existing users.

---

## Pages & Workspace

- A page has a name and an order; the topbar shows all pages as tabs.
- Users can add a page (`+` control), rename (double-click tab or context menu), reorder via drag & drop with a live drop-indicator, and delete (context menu) — **except** the last remaining page, which cannot be deleted.
- The active page persists across sessions (`activePageId`).
- Tab row supports horizontal overflow with a custom scrollbar (drag-thumb + click-to-jump), not the native browser scrollbar.

**Acceptance:** creating, renaming, reordering, and deleting pages behaves identically to v1; deleting the only page is blocked with the same guard.

---

## Boards

- Boards live on an **integer column/row grid** per page — not free pixel positioning (see [ARCHITECTURE.md § 5](./ARCHITECTURE.md#5-rendering-constraints-carried-forward-from-v1-must-not-regress) for why this is a hard visual requirement, not a style choice).
- Column count auto-fits the viewport width unless the user pins a manual column count or board width in Settings.
- Adding a board: via a grid `+` cell or a floating action button. **A newly created board with no name typed before it loses focus is discarded, not saved** — this is an intentional guard against accidental empty-board creation from a stray click, and must be preserved.
- Renaming: double-click title or the board's `···` menu.
- Deleting: via `···` menu.
  - A bookmarks-board containing links → board + its bookmarks move to Trash.
  - A bookmarks-board with **no** links, or any non-bookmarks board type (notes/calendar/pomodoro/search) → deleted permanently, no trash entry.
- Drag & drop: reorder within a column, move across columns (column drop-zones activate only during an active board drag), drop into an empty grid cell.
- **Board types:** `bookmarks` (default), `notes`, `calendar`, `pomodoro`, `search` — see dedicated sections below.

**Acceptance:** all board CRUD and drag/drop behaviors match v1 exactly, including the discard-if-unnamed guard and the trash-vs-permanent-delete branching.

---

## Bookmarks

- **Add:** two-step flow — paste/type a URL, then a title auto-derived from the hostname (editable) plus an optional description.
- **Edit:** same fields, pre-filled.
- **Delete:** always moves to Trash (never a permanent-delete option directly on a single bookmark).
- **Open:** click opens per the `openInNewTab` setting (new tab vs. same tab); context menu additionally offers "Open" (forced background tab) and "Open Incognito" (`chrome.windows.create({ incognito: true })`).
- **Drag & drop:** reorder within a board, move to a different board; dropping directly on a board body (not between two items) appends to the end.
- **Hide-extra-bookmarks:** optional per-board collapsing to show only the first N (5/10/15/20, configurable) with a "show N more" expander; expanded state is UI-only and resets on reload (not persisted).

**Acceptance:** identical CRUD/open/drag semantics to v1, including the collapse-and-expand behavior and its non-persistence.

---

## Favicons

Six-tier fallback chain, walked in order until one loads successfully:
1. Hardcoded brand-icon map for Google products (Gmail/Calendar/Drive/Docs/Sheets/Slides/Maps/etc.) — needed because bare-domain favicon services collapse all `google.com` subpaths to a generic "G" icon.
2. The site's own `/favicon.ico`.
3. Google's `faviconV2` full-URL icon API.
4. DuckDuckGo's icon service.
5. Same chain retried against the bookmark's **root domain** (handles subdomain favicon gaps).
6. Chrome's own internal favicon cache (`chrome-extension://<id>/_favicon/...`, via the `favicon` permission) as a guaranteed-last fallback.

- Every resolved icon is **re-encoded to a 48px PNG data URL** before caching (raw cached `.ico` bytes were found in v1 development to sometimes render transparent — re-encoding avoids that class of bug; preserve this step, don't "simplify" it away).
- Cache is keyed by hostname (Google products additionally key by hostname + first path segment, since e.g. `mail.google.com` and `docs.google.com` need distinct icons under one apex domain), with a 30-day TTL background refresh and a version-bump mechanism to invalidate all cached entries at once if the pipeline logic changes.

**Acceptance:** no bookmark ever shows a broken-image icon; the fallback chain order and root-domain retry match v1; cache persists across sessions.

---

## Search

Three independent, non-overlapping search surfaces — do not conflate them:

1. **Global bookmark search overlay** — `Ctrl/Cmd+K`, filters all bookmarks by title/URL substring (case-insensitive), capped at 24 results, arrow-key navigation, Enter opens the selected result in a new tab.
2. **Search board** (`type: 'search'`) — a board embedded on the grid with its own mini search input and its own engine selector, independent of any other search surface.
3. **Nav search bar** — a topbar-level search pill with its own engine picker. **v1 status is ambiguous:** the code path (default-enabled flag, render call, widget-gallery toggle) is present and wired, but project documentation calls it "disabled." Resolve this ambiguity explicitly before v2 implementation — see the decision checklist below — rather than guessing.

**Search engines** (shared list across surfaces 2 and 3): Default (uses the browser's native default engine via `chrome.search.query`), Google, Yandex, Bing, DuckDuckGo, YouTube, Ecosia.

**Decision needed before implementation:** confirm with the product owner whether the nav search bar ships enabled-by-default in v2. Do not silently pick a default — this is a case where v1's own code and docs disagree, and it should not be resolved by assumption. Record the answer in [PRD.md § Open Questions](./PRD.md#11-open-questions) once decided.

---

## Widgets

### Weather
- Data source: Open-Meteo forecast + geocoding APIs (no API key required).
- Shows current temperature, feels-like, weather condition, wind speed.
- City search with debounced autocomplete and arrow-key selection.
- Unit (metric/imperial) follows `locale.tempUnit` by default, with a per-widget override.
- 30-minute client-side cache; clicking the widget opens a detail popup with a manual refresh action.

### Pomodoro / Focus Timer
- Board-level widget; configurable focus/short-break/long-break durations and cycles-before-long-break.
- **Wall-clock-accurate countdown**: persists `startedAt` + `startedTimeLeftSeconds` and recomputes elapsed time from real elapsed wall-clock time on reload — **not** a naive per-second decrementing counter, so the timer stays correct across a tab close/reopen or a browser restart mid-session.
- Audio cues on phase start/end via the Web Audio API.
- Logs completed (and partial) focus minutes to `focusStats`.
- A header "focus stats" summary widget shows today's total focus time and opens a week/month bar-chart popup; this summary widget is only shown at all if at least one pomodoro board exists anywhere in the workspace.

### Notes
- Freeform textarea per `notes` board, resizable height via a drag handle, autosaves ~600ms after the user stops typing.

### Calendar
- Month-view grid with prev/next navigation, today/weekend highlighting.
- **v1 parity note (important):** event-dot rendering code exists but there is no UI anywhere to create an event, and the event data isn't even persisted — it resets every reload. **v2 ships this as a display-only month view, matching v1's actual (not intended) behavior.** Event authoring is an explicitly deferred feature (see [ROADMAP.md](./ROADMAP.md)) — do not partially implement it in v2 under the assumption it was "almost done" in v1; it wasn't wired to persistence at all.

### Clock
- 12h/24h + date, updates on the minute boundary, format follows `locale` settings (not UI language).

---

## Wallpapers & Theming

- **Bundled presets:** 14 shipped images + 2 CSS-gradient presets.
- **Custom upload:** image (jpg/png) or video (mp4). Images stored as data URLs; videos stored as raw `Blob` (avoids base64 bloat) — both in IndexedDB, with pointer metadata in `chrome.storage.local` (see [SYNC_AND_STORAGE.md § 7](./SYNC_AND_STORAGE.md#7-wallpaper-storage-split--parity-requirement)).
- **History:** last 20 uploads retained, oldest evicted (including its IndexedDB entry) when a 21st is added; each history entry can be deleted manually.
- **Auto style analysis:** on any wallpaper change, sample pixels via canvas to detect average brightness (drives `isDark`) and a dominant accent color (highest-saturation pixel within a defined luminance band); auto-derive a `themeStyle` and open the Style Editor for the user to confirm/adjust. For video wallpapers, capture a representative frame first — **wait for an actually-presented frame** (e.g. `requestVideoFrameCallback` or a double-rAF pattern), not just the `seeked` event, since `seeked` alone was found in v1 to fire before paint and produce black/blank thumbnail captures.
- **Preload flash prevention:** a synchronous pre-render step paints the correct wallpaper (image/bundled) before the app's framework boots, or hides the page while an already-in-flight IndexedDB read resolves (video/gradient) — see [SYNC_AND_STORAGE.md § 7](./SYNC_AND_STORAGE.md#7-wallpaper-storage-split--parity-requirement). This must run before any component tree mounts.
- **Theming model:** one global `themeStyle` (accent color, board tint color/opacity/blur, dark/light flag, text size S/M/L, text weight normal/bold) applied everywhere via a Style Editor modal, opened automatically after choosing a wallpaper or manually from Settings → Appearance. **Per-board custom styling is not part of v2** (removed in v1 due to a backdrop-filter visual bug; deferred, see [ROADMAP.md](./ROADMAP.md)).
- Text scale/weight are a **global sticky preference independent of wallpaper** — switching wallpapers must not reset the user's chosen text size/weight.

---

## Trash

- Deleted boards (with bookmark counts) and deleted bookmarks are listed with per-item Restore and permanent-delete (✕) actions, plus an "Empty trash" action with a confirmation step.
- No keyboard undo (Ctrl+Z) — Trash is the sole undo mechanism, and it is manual.

---

## Sync & Identity

Fully specified in [SYNC_AND_STORAGE.md](./SYNC_AND_STORAGE.md). Summary for QA purposes:
- Sync is opt-in via Google sign-in only; guest users never touch `chrome.storage.sync`.
- Sign-in uses `chrome.identity.getAuthToken` with `profile email` scopes only — no other Google API access (no Drive, no Calendar, nothing beyond identifying the user).
- Signing in loads/creates a per-account local snapshot (`appState_<email>`); signing out snapshots current state back to that key and resets to defaults for the guest session.
- Cross-tab and cross-device updates are deferred while the user is mid-interaction (typing, dragging, or with a popup/modal open) and flushed automatically afterward.

---

## Quick Save (toolbar popup)

- Opens via toolbar icon click or the `Ctrl+Shift+P` keyboard command (user-remappable via Chrome's extension-shortcuts page; Settings has a deep link to it).
- Prefills URL and a **cleaned title** from the active tab: strips whitespace, removes unread-count badges like `(394)`/`[12]`, leading bullet markers, and — if the title contains an `@` — splits on separator characters and drops any segment that is exactly an email address (handles the common case of a mail-client tab title showing the signed-in account).
- Shows a page selector only if more than one page exists; shows a board selector filtered to real `bookmarks`-type boards only (excludes notes/search/calendar/pomodoro boards).
- Remembers the last-used destination board (`settings.quickSaveBoardId`) as the default next time.
- Saves by appending a new bookmark with the next `order` value on the target board, then closes automatically (~800ms after a success message).
- **v2 architecture requirement:** this entire flow must call into `packages/core`'s shared mutation functions (bookmark creation, ID generation, title cleaning) rather than re-implementing them locally — this is the direct fix for the v1 popup/newtab duplication risk (see [ARCHITECTURE.md § 3](./ARCHITECTURE.md#3-project-structure-monorepo)).

---

## Import / Export

- **Import from Chrome Bookmarks:** reads the native bookmark tree (`chrome.bookmarks.getTree`), lets the user pick a folder; imports create a new board (placed in the first column that still fits the viewport) and bulk-add its bookmarks. Offered as an optional step in first-run onboarding (skipped automatically if the user has zero native bookmarks).
- **Export:** a "Download" action in Settings exports the **entire** app state as `newtab-data.json`, for backup/restore purposes (not just bookmarks).
- **Import (restore) from JSON:** an "Upload" action reads a previously exported file, validates that `pages`/`boards`/`bookmarks` arrays are present (in v2: full schema validation via the Zod schema, see [DATA_MODEL.md § 15](./DATA_MODEL.md#15-validation--import-boundary)), confirms with the user, then fully overwrites current state.
- **Not carried forward as dead code:** v1 has an unused `exportBookmarks()` function (bookmarks-only export, not wired to any UI button). v2 should either wire up a real "export bookmarks only" option if desired, or simply not include the dead function — do not carry forward unreferenced code (see [ROADMAP.md](./ROADMAP.md) if a bookmarks-only export is later prioritized as a real feature).

---

## Settings

Sections, in order (parity with v1):
1. **Account** — sign-in/out, download/upload backup.
2. **Appearance** — accent/board color, opacity, blur (duplicates the Style Editor controls inline).
3. **Board text** — size (S/M/L), weight (normal/bold).
4. **General** — open-in-new-tab, hide-extra-bookmarks + count, show-descriptions.
5. **Boards layout** — max columns ("Auto" or a fixed 4–9), board width slider (max dynamically capped by what the current column count can actually fit).
6. **Quick Save** — destination page/board defaults, shortcut display + "change" deep link to Chrome's shortcuts page.
7. **Language** — Auto / English / Русский / Türkçe.
8. **Region** — auto-detect button, plus advanced manual overrides (time format, date format, week start, temperature unit).
9. **Sidebar** — always-expanded toggle.
10. **Support** — version number, contact link.

---

## Onboarding

- First-run screen: "Sign in with Google" or "Continue without signing in" (guest), with an error/retry sub-state for failed sign-in.
- A 9-step guided product tour with spotlight masking over target elements and an inline drag-and-drop illustration.
- The tour includes a conditional "import your bookmarks" step, skipped if the user has no native Chrome bookmarks; this step pauses the tour and opens the real Import modal rather than simulating it.

---

## i18n / Localization

- UI language: English, Russian, **and Turkish** (v1's own architecture doc under-documents this as "en/ru" only — v2 docs and code must reflect all three actively-maintained languages).
- Language selection: "Auto" (browser-detected) or manual override, persisted independently of `locale` (date/time/temperature formatting).
- Missing translation keys **fall back to English silently** rather than showing a raw key — preserve this graceful-degradation behavior.
- Russian and Turkish each need correct pluralization handling (Russian's 1 / 2–4 / 5+ forms with the "not 11–14" exception; Turkish has no grammatical plural distinction, so both branches can be identical).
- Changing language currently requires a full reload in v1 (no live re-render) — v2 may improve this to a live re-render if trivial within the chosen framework's i18n tooling, but it is **not required** for parity (note as a nice-to-have only if free).

---

## Analytics

Fully specified in [ANALYTICS_PLAN.md](./ANALYTICS_PLAN.md).

---

## Explicitly out of scope for v2 (cross-reference)

See [PRD.md § 8 Non-Goals](./PRD.md#8-non-goals-v2-launch) and [ROADMAP.md](./ROADMAP.md) for the full deferred list: per-board custom styling, calendar event authoring, sync field-level merge, other-browser support, custom backend sync, tags/labels.
