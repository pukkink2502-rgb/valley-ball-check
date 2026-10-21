# Parallel development V0.2–V0.5

Status: **development preview**, not production. Branch `development/v0.1`.

| Stream | Completed this iteration | Next |
|---|---|---|
| V0.2 Quick Scoreboard Online | guest_score_create, guest_score_command, guest_score_recover SQL RPCs; guest-score Edge Function v1 (ACTIVE); online UI, viewer/controller/recovery capability links; poll interval 3.5s; optimistic revision updates | Verify browser/device end-to-end; add production-grade abuse limits, scheduled retention cleanup, push-based realtime, comprehensive integration tests |
| V0.3 Tournament Management | 14 foundation tables across all streams, including tournament stages, pools, matches, sets; shared standings/point ratio rule engine in lib/volleyball-rules.mjs | Approved results API, court and rest scheduling, round-robin/brackets, role-scoped organizer UI |
| V0.4 Official Scoresheet | Match events / roster schema and shared set validation rules | Event ledger, substitutions, Libero, rotation and scorekeeper approval rules |
| V0.5 Live Draw, PDF, Graphics | Draw event, export job and graphics schema | Server-verified draw fairness, PDF renderer, editor with bound facts and output |

## Test evidence
- Supabase transactional rollback tests: created guest game, added 25 points, confirmed set, undid confirmation; passed (no test data retained).
- JS shared-rule inline checks: 8/8 passed; Node tests available in `tests/rules.test.mjs` (not yet executed in repository CI).
- GitHub source syntax checked, Vercel Git preview deployment shows READY.
- **Not yet verified:** browser-origin request to Edge Function, live two-device demonstration, cross-origin CORS runtime, end-to-end role enforcement, retention cleanup, mobile visual tests.

## Security
- Supabase tables RLS enabled; guest_session, guest_events and limiter rows inaccessible to public `anon`/`authenticated` Data API roles.
- Scoped API token hashes stored server-side; client receives separate random secrets in URL fragment (not the query string).
- `guest-score` Edge Function uses server secret only and checks the capability token before reading or applying mutations. Writes use a locked SQL RPC with revision check and idempotency ID.
- An IP-derived rate limit is preliminary and its headers may be spoofable. **Do not call this service production-hardened.** Enforce a platform-verified limiter/CAPTCHA and monitoring before general availability.
- Deletion at end of guest retention is not yet scheduled; must implement and test automated cleanup before production.
- Viewer UI intentionally hides command controls. Backend must reject viewer-token writes regardless of UI.
- The SQL regression tests were wrapped in `BEGIN/ROLLBACK`.
- Never commit server secrets to a browser bundle or GitHub.

Supabase ref: `rwnvlxwdorsrxjuepcxp`
Branch: `development/v0.1`
Production main: unchanged.


## 2026-10-21 — Tournament management and retention update

- Database migration `tournament_draft_atomic_builder_v04` applied.
- Authenticated RPC `public.create_tournament_draft` creates tournament, stage, A–D pools, teams, registrations and round-robin matches in one database transaction.
- New RLS policies allow only tournament owners to insert drafts, pool memberships and unapproved scheduled fixtures.
- Anonymous users cannot execute the tournament creation function (verified with Postgres privilege query).
- Authenticated users can execute it; full sign-up/login and end-to-end creation still require browser testing.
- `tournament-manager.js` and the new "จัดการแข่งขันออนไลน์" page use Supabase Auth and the RPC. All rendered team names use DOM `textContent`.
- New pg_cron job `vbc_guest_retention_cleanup_daily` is active and removes expired guest sessions and stale guest creation-rate records; cascading FKs remove guest events.
- Supabase read-back verified one active cron job, and existing user guest sessions left untouched.
- WARNING: Vercel preview READY is a build/deployment status, **not** proof of completed real-browser or cross-device functionality.
