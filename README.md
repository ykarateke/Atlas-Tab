<div align="center">
  <img src="public/icons/icon128.png" width="96" height="96" alt="Atlas Tab logo" />

# Atlas Tab

A calm, personal new-tab page for Chrome — pages, boards, and bookmarks,
with weather, pomodoro, notes, and calendar widgets.

This is a from-scratch **MV3** rewrite of the original Atlas Tab (formerly
_Markmez_), rebuilt on TypeScript + React + Vite instead of the original
vanilla JS codebase. Full specs live in [`docs/`](./docs).
</div>

---

## What it is

Atlas Tab replaces Chrome's new-tab page with a customizable, glassmorphic
workspace: multiple **pages**, each holding a free-form grid of **boards**
(bookmark folders, notes, a calendar, a pomodoro timer, a search box), plus
optional top-bar widgets (clock, weather, a Google-powered search bar). Every
board and bookmark can be dragged anywhere on the grid — not just reordered
within a column, but freely repositioned across columns.

## Current features

- **Pages** — add, rename, reorder, and delete pages (last page is
  protected from deletion).
- **Boards** — five types, all freely drag-and-drop placeable across the
  grid's columns and rows:
  - **Bookmarks** — add/edit/delete links, six-tier favicon fallback chain
    (with caching), collapsible "show more" for long lists, open in new
    tab / background / incognito.
  - **Notes** — freeform autosaving text.
  - **Calendar** — month view (display-only for now).
  - **Pomodoro** — wall-clock-accurate focus timer (survives tab
    backgrounding/throttling; never drifts from real elapsed time).
  - **Search** — a per-board mini search box, any of 7 engines.
- **Drag & drop** — boards and bookmarks can be moved to any column/row or
  any other board, not just reordered in place (built on `dnd-kit`, with a
  shared drop-target context so cross-column/cross-board moves are
  reliable).
- **Trash** — deleted boards/bookmarks are recoverable (restore or
  permanently delete, with an "empty trash" action) rather than lost
  immediately.
- **Widget Gallery** — a discoverable surface for adding boards and
  toggling optional widgets (Clock, Weather, Nav Search Bar) onto the page.
- **Nav search bar** — a top-bar Google (or 6 other engines) search box,
  on by default.
- **Style Editor** — live theming: accent color, board tint/opacity/blur,
  text size/weight, 25 bundled wallpapers, and column count/board width
  layout controls (ported from v1's column-fitting algorithm). While
  dragging the opacity/blur sliders, the editor itself fades out so you can
  see the effect on the boards behind it in real time.
- **Layout engine** — auto-fitting column grid (or a manual column
  count/board width pin), with integer-pixel positioning to avoid
  `backdrop-filter` seam artifacts.
- **i18n** — full English/Turkish UI translation.
- **Local persistence** — debounced `chrome.storage.local` writes,
  validated through a Zod schema on load (bad/partial data falls back to
  defaults instead of corrupting state).

## Planned / roadmap

Tracked in full in [`docs/ROADMAP.md`](./docs/ROADMAP.md). Not yet built:

- **Sync & identity** — Google sign-in, `chrome.storage.sync` chunking and
  cross-device reconciliation.
- **Settings surface** — a dedicated settings screen beyond the Style
  Editor (today's layout/theme controls).
- **Quick Save popup** — the toolbar popup is currently a scaffold; it will
  share `packages/core` mutations with the new-tab app.
- **Onboarding** — a first-run guided tour.
- **Russian locale** — full en/ru/tr string parity (en/tr exist today).
- **Analytics** — a GA4 Measurement Protocol event catalog (privacy stance
  defined in [`docs/ANALYTICS_PLAN.md`](./docs/ANALYTICS_PLAN.md)).
- **Import/export** — full-state and bookmarks-only export.
- **v1 migration** — staged Web Store rollout that upgrades existing users'
  v1 data losslessly ([`docs/MIGRATION_PLAN.md`](./docs/MIGRATION_PLAN.md)).

**Explicitly deferred backlog** (known gaps, not forgotten — see
[`docs/ROADMAP.md § 2`](./docs/ROADMAP.md#2-deferred--future-considerations)):
per-board custom styling, real calendar event authoring, sync conflict
merge beyond last-write-wins, multi-browser support (Firefox/Edge/Safari),
and a tags/labels system.

## Tech stack

- **TypeScript** (strict mode) across the whole monorepo.
- **React 18** + **Vite** with **CRXJS** for the MV3 build pipeline.
- **Zustand** wrapping pure `(state, action) => newState` reducers in
  `packages/core` — state logic is framework-agnostic and independently
  testable.
- **Zod** — schema-first data model; state loaded from storage is validated,
  not just cast.
- **`dnd-kit`** for drag-and-drop (accessible, keyboard-operable).
- **CSS Modules** for styling — a glassmorphic theme (`backdrop-filter` +
  `isolation: isolate`, ported from and improving on v1's rendering
  approach).
- **Vitest** + **React Testing Library** for tests (currently 200+ tests
  across reducers, favicon resolution, i18n, and every UI component).
- **ESLint** (`eslint-plugin-react-hooks` strict / React Compiler rules) +
  **Prettier**.

## Project structure

```
apps/
  newtab/       # the new-tab page (main app)
  popup/        # toolbar "Quick Save" popup (scaffold, Phase 3)
  background/   # MV3 service worker (scaffold)
packages/
  core/         # schema, state reducers, favicon/weather/i18n logic — no DOM
  ui/           # presentational React components (props/callbacks in, no store)
  analytics/    # GA4 client (scaffold, Phase 4)
docs/           # full product/architecture/spec documentation — start at docs/README.md
public/         # extension icons, bundled wallpapers
```

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full rationale
behind this structure.

## Getting started

Requires Node 20+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev      # starts the CRXJS dev server
```

Then load the extension unpacked in Chrome:
`chrome://extensions` → enable **Developer mode** → **Load unpacked** →
select the `dist/` folder (or the Vite dev output, per CRXJS's workflow).

```bash
pnpm build       # production build → dist/
pnpm typecheck    # tsc -b --noEmit across the monorepo
pnpm lint         # eslint .
pnpm test         # vitest run
pnpm test:watch   # vitest, watch mode
```

## Documentation

Full specs, architecture decisions, and the phased build plan live in
[`docs/`](./docs) — start at [`docs/README.md`](./docs/README.md).
