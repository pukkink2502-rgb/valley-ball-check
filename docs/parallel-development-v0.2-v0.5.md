# Parallel development V0.2–V0.5

Development authorised 2026-10-21. Work proceeds in parallel across four streams, with production held unchanged.

| Stream | Current backend foundation | Remaining functional work |
|---|---|---|
| V0.2 Quick Scoreboard Online | guest_sessions, guest_events; private RLS | secure token/API endpoints, concurrency control, streaming, retention job, multi-device tests |
| V0.3 Tournament Management | stages, pools, pool_teams, matches, match_sets, rule_profiles | organizer API, validated bracket/schedule, standings, approvals |
| V0.4 Official Scoresheet | match_roster_entries, match_events | immutable event command service, FIVB rule engine, Libero/rotation, approvals |
| V0.5 Live Draw/PDF/Graphics | draw_sessions, draw_events, report_exports, graphics_projects | server-random draws with proof, PDF renderer, layer editor |

## Security and rollout

All 19 tables in public have RLS enabled. New guest/session/event tables are denied to anon and authenticated by default; they are reserved for future audited backend commands. Do NOT add wide-open RLS to silence Security Advisor informational 'no policy' notices. Authenticated owner-scoped read policies exist for tournament reference tables. No actual guest API is live yet. Public UI remains local-only.

Database project: rwnvlxwdorsrxjuepcxp
Migration (applied): parallel_modules_foundation_v02_v05
GitHub branch: development/v0.1
Production branch main unchanged.

## Integration milestones

1. Build a secure backend control path for guest session lifecycle and score event mutation.
2. Implement shared Rule Engine used by Scoreboard and Official Scoresheet.
3. Implement organizer endpoints and safe publishing/approval transitions.
4. Implement draw, PDF and graphics against approved versions, with browser and permission tests.
5. Release preview after real end-to-end tests, only then promote to production.

## Safety

Never place secret Supabase service role credentials into browser source. Avoid password-free direct guest table access. Links must be scoped, hashed on the server, revocable, rate-limited and separate viewer/controller/recovery capabilities.
