# Valley Ball Check — Development v0.1

Development branch: `development/v0.1`.

## Preview deployment

- Vercel preview: https://valley-ball-check-eqb4v1x8e-pukkink.vercel.app
- GitHub commit of functional page: `75507faedd36b30944ab262875f28703f8195197`.
- Git integration auto-builds new previews when this branch changes.
- Vercel Deployment Protection / SSO may require signing in as an authorized project member.
- This is **not** the production website. `main` is unchanged.

## Functional local-only MVP

- Responsive dashboard and navigation in Thai.
- Best-of-3 (25/25/15) and best-of-5 (25/25/25/25/15), 2-point margin.
- Manual score controls, set/match detection, undo, team naming, display-side swap, deciding-set side-switch prompt, fullscreen.
- Browser-local autosave using `localStorage` (no cross-device synchronization).
- Tournament draft grouping (1–4 groups, 2–64 teams), round-robin fixtures, CSV export with spreadsheet-injection mitigation.

## Not implemented yet

- Cloud Guest sessions, live viewer/control/recovery links, server-side retention and rate limits.
- Official FIVB scoresheet, Libero/substitution/rotation rules, approvals, official standings.
- Verified Live Draw, multi-court scheduling, audit trail, PDF/graphic editor.
- Supabase integration/authentication and production release.

Do not rely on this MVP for official tournament records: the scores are stored in the current browser only and are lost if local storage is cleared. Browser storage is not the 30-day Guest retention system described in the specification.

## Supabase

Dedicated project ref: `rwnvlxwdorsrxjuepcxp` (not the unrelated preorder project). Five foundation tables have been created with RLS: `profiles`, `tournaments`, `teams`, `tournament_teams`, `tournament_members`. The MVP frontend does not access them.

## Release checklist

1. Run real-browser usability tests on Android and desktop.
2. Verify preview access and static asset loading.
3. Build secure Guest backend with scoped permissions, tokens, auditability and expiry.
4. Complete acceptance tests and authorise production release. Never merge to `main` without validation.
