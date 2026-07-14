# Atlas Tab — Analytics Plan

**Related:** [PRD.md](./PRD.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [NON_FUNCTIONAL_REQUIREMENTS.md](./NON_FUNCTIONAL_REQUIREMENTS.md)

v1's `analytics.js` references a file called `ANALYTICS_PLAN.md` that does not actually exist in the repository — it was apparently never committed. This document recreates it from the actual event catalog implemented in v1's `analytics.js`/`background.js`/`newtab.js`, so the plan and the implementation stay in sync going forward.

## 1. Why Measurement Protocol, not `gtag.js`

MV3's `content_security_policy.extension_pages` (`script-src 'self'`) forbids loading remote scripts, so `gtag.js` cannot be used. Both v1 and v2 instead POST directly to GA4's Measurement Protocol collect endpoint (`https://www.google-analytics.com/mp/collect`) via `fetch`, from two separate contexts:
- **Page context** (`packages/analytics`, used by `newtab` and `popup`): richer client-side state (engagement time, session id).
- **Service-worker context** (`apps/background`): no `localStorage`/DOM access, so it maintains its own minimal client-id lookup and sender for install/uninstall events only.

## 2. Identity & session model

| Concept | Storage | Behavior |
|---|---|---|
| `client_id` | `chrome.storage.local` (shared across page + service-worker contexts) | Persistent per-device/per-install identifier, generated once via `crypto.randomUUID()` |
| `session_id` | `localStorage`, 30-minute inactivity timeout | Deliberately **not** "one session per new tab opened" — a new-tab-replacement extension would otherwise generate an unrealistic number of sessions; the 30-minute window groups bursts of new-tab opens into one session |
| `engagement_time_msec` | Accumulated in memory, flushed on `visibilitychange`/`pagehide` | Real visible-time accounting instead of GA4's default 100ms fallback, so time-on-page metrics are meaningful |
| User properties | `{ signed_in: boolean }` | Set via a shared setter called after any auth-state change |

## 3. Event catalog

| Event | Trigger | Key params |
|---|---|---|
| `app_open` | Every new-tab page load | board count, bookmark count |
| `daily_active` | Once per UTC day per device (dedup via a date-stamped local flag) | — |
| `page_created` | New page added | — |
| `board_created` | New board added | board type |
| `activated_user` | First board **or** first bookmark ever created (fires once, whichever comes first) | `via: 'board' \| 'bookmark'` |
| `bookmark_added` | New bookmark saved from the board UI | — |
| `pomodoro_started` | Pomodoro timer starts | `phase` |
| `search_used` | A search is dispatched from any search surface | `source: 'navbar' \| 'widget'`, engine id |
| `weather_set` | Weather widget enabled or city changed | — |
| `wallpaper_changed` | Wallpaper changed | `type` |
| `signin_started` / `signin_success` / `signin_failed` | Google OAuth flow states | — |
| `guest_converted` | A guest user signs in later | — |
| `onboarding_shown` / `continue_as_guest` / `onboarding_abandoned` | First-run screen lifecycle | — |
| `tour_started` / `tour_step` / `tour_completed` / `tour_skipped` | Guided tour lifecycle | step index where applicable |
| `extension_installed` | Fresh install (service-worker context) | — |
| `js_error` | Any uncaught error or unhandled promise rejection anywhere in the page | source/message/stack, each truncated (60/120/300 chars) to avoid leaking large payloads or PII |
| `user_engagement` | Flushed accumulated visible-time ≥1s, on tab hide/unload | `engagement_time_msec` |

**v2 requirement:** implement this exact catalog first (parity), then treat any *additions* to it as a deliberate, reviewed change to this document — not an ad hoc `track()` call added inline during unrelated feature work.

## 4. Privacy stance

- No PII is sent beyond what's inherent to GA4's own collection (client id, coarse usage events). Bookmark URLs/titles/contents are **never** sent to analytics.
- `js_error` payloads are truncated specifically to reduce the risk of accidentally including sensitive data in a stack trace or error message.
- A documented developer opt-out exists (a local flag disabling all tracking) — preserve this for local development and testing, exposed consistently across both the page-context and service-worker senders.
- The GA4 Measurement Protocol `api_secret` is embedded in the client (necessarily, since there's no server). It grants **send-only** capability (cannot read reports or modify the GA property) — this is an accepted, documented limitation, not an oversight. **v2 action item:** rotate the secret when moving to the new codebase rather than reusing v1's committed value verbatim, since the current value has been present in a public/inspectable client for the lifetime of v1.

## 5. Funnels to monitor post-launch

- **Onboarding funnel:** `onboarding_shown` → `continue_as_guest` or `signin_success` → `tour_started` → `tour_completed`/`tour_skipped`.
- **Activation funnel:** `app_open` (first ever) → `activated_user`.
- **Sign-in funnel:** `signin_started` → `signin_success`/`signin_failed`, and separately `guest_converted` for later conversions.
- **Migration health (v2-specific, new):** add a `migration_completed` / `migration_failed` event pair (with the source schema version) so the v1→v2 upgrade rollout (see [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)) can be monitored in aggregate, not just via crash reports.

## 6. Open item

Confirm whether the existing GA4 property (`measurement_id` in v1) is reused for v2 (continuity of historical data) or whether v2 ships as a fresh property (cleaner slate, no v1/v2 data mixing). Recommendation: reuse the same property but add a `app_version` or `schema_version` param to every event so v1/v2 traffic can still be separated in analysis — avoids losing historical trend continuity while keeping the two eras distinguishable.
