# Valley Ball Check

An integrated Thai-language volleyball tournament management website.

**Web:** https://valley-ball-check.vercel.app

## Available modules

- **Dashboard** — quick entry to all modules.
- **Quick Scoreboard (local)** — BO3/BO5 scoreboard with win-by-two rule, set handling, undo, screen swap, fullscreen and browser autosave.
- **Scoreboard Online** — shared Guest game with separate Viewer / Controller / Recovery links. Server-authorized score changes and version/revision conflict protection. Viewers poll about every 3.5 seconds; links expire per retention policy.
- **Tournament Builder (local draft)** — split teams into groups A–D and generate round-robin matchups; CSV export.
- **Tournament Manager (cloud)** — Supabase Email/Password Auth, create tournaments with team registrations, pools and scheduled fixture drafts.
- **Official Scoresheet** — official-event log, scoring, rosters, team six-player lineups, substitutions, rotation events, timeouts, Libero audit entries, sanctions and a separate approver role. Results are not considered official until independently approved.
- **Position Check** — manually entered 6-position coordinates checked for relative lineup order.
- **Live Draw** — server-generated random draw, persisted draw order and an audit ticket per pick. Not yet a public commit/reveal lottery.
- **Graphic Studio** — tournament-backed fixture/result/team poster templates, logo upload, themes, 9:16 and 1:1 outputs, PNG/PDF export, save/load poster configuration.
- **Public Program / Standings** — public view for published tournaments, standings calculated from approved matches, schedules, CSV and print-to-PDF. Court/time scheduling uses estimated match durations, court collision and team rest checks.

## Accounts and approvals

Organizer creates a tournament. To score official games, a designated `scorekeeper` uses Official Scoresheet; the organizer also has scoring access. For the result to become approved, the organizer must assign another signed-up account the **approver** role; this must be a different person than the user who first scored the match. Owners can assign roles by email in the Official Scoresheet.

## Safety model

- Database access uses Supabase Auth, RLS, per-tournament checks and locked server transactions.
- Sensitive definer routines are in a private non-API schema; public-facing RPC wrappers execute with invoker privileges.
- Public tournament access returns only published tournament names, teams and fixture/result data.
- Guest controller/recovery capabilities are separately generated random tokens; hashes remain on the server.
- Automatic database guest retention cleanup uses Supabase Cron.
- Browser JavaScript contains only a publishable Supabase key, never a service secret.

## Limitations and issues under development

This is a **public functional release for hands-on verification**, not an assertion that every advanced rule interpretation is certified. Position checks require manual coordinates, Libero replacements are logged but the complete sequence and eligibility engine is not yet implemented, and the substitution pilot/custom profiles require further rule-validation tests. The draw stores a server-issued audit log but does not yet implement public commit/reveal proofs.

**Known fixture ordering issue (intentionally NOT changed yet):** Round-robin pairing generation may list the same team's matches consecutively. Pair completeness is correct, but pair *ordering* is not fair/suitable and needs a future scheduler/round-robin ordering fix. The product owner explicitly asked to park this issue while shipping the entire suite. Scheduling validators do **not** silently reorder the existing fixtures.

Production manual smoke checks are still required for all workflows and on different mobile devices. GitHub CI validates JavaScript syntax and the volleyball standings/unit rules.

Supabase Auth Security Advisor may require enabling leaked password protection in the Supabase dashboard; see the project Security Advisor. Do not mistake green deployment status for full mobile/browser acceptance.

## Development

Repository: `pukkink2502-rgb/valley-ball-check`

- `lib/volleyball-rules.mjs`: reusable rules and standings.
- `tests/rules.test.mjs`: automated rule-regression tests.
- `supabase/functions/guest-score/index.ts`: Guest Score API source.
- UI: `index.html` + `online.js`, `tournament-manager.js`, `official-ui.js`, `position-check.js`, `draw-ui.js`, `graphics-ui.js`, `public-standings-ui.js` and `suite-core.js`.

Production branch is `main`; development branch is `development/v0.1`.


## Competition formats, scheduling and user-controlled rounds

Tournament Manager supports:
- **Group round robin**: 1–4 pools, round robin *within each pool*; when 2 pools are used, the organizer may automatically add two semifinals, third-place and final with **unresolved participant placeholders**. The organizer explicitly resolves these placeholders to real teams when prior results are known.
- **Complete round robin**: one pool where all teams play each other; aggregate standings are computed from approved results.
- **Single elimination**: power-of-two entrants (2, 4, 8, 16, 32, 64), automatic successive rounds ending with a final. Match participants in later rounds are placeholders until qualified.
- **Custom**: no default games; organizers create stages and pairs themselves.
- **Extra stages and matches**: organizers can always add the next stage or pair to drafts and published tournaments. Draft pair participants are editable until scored.
- **Fair pair sequencing**: round-robin pairings are arranged by rounds with cross-pool interleaving and back-to-back team warnings. When unavoidable because of group counts, this is reported rather than hidden. Manual up/down controls can adjust the original sequence in an unstarted draft.
- **Time-level validation remains separate**: no algorithm can guarantee actual 45/60-minute rest without clocks, match durations and playing courts; the schedule-entry RPC checks court conflicts and the minimum rest period.
- **Pool-specific standings**: group standings are separate for pools A–D, whereas round-robin matches are aggregated for a full round robin. Knockout matches do not contaminate league standings.

Deletion now permits **draft tournaments with planned times but no scores or actual starts**, requiring confirmation; started/scored or published tournaments remain protected. This was changed to address `ACTIVE_MATCHES_CANNOT_DELETE` on safe drafts.

All production publishes are gated by GitHub CI and a Supabase transaction-based integration test; real-device and live multi-user acceptance testing remains a separate validation step.
