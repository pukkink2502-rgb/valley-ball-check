-- Applied to live Supabase on 2026-10-22.
-- The public delete_tournament_draft(uuid) RPC remains compatible.
-- Owner-only, atomic full-tournament delete, including all scored/approved matches.
-- Table foreign keys cascade child records. Independent drawing workspaces are unlinked.
create or replace function vbc_private.delete_tournament_draft(p_tournament uuid)
returns jsonb
language plpgsql security definer
set search_path to ''
as $$
declare
  tournament_row public.tournaments%rowtype;
  actor uuid := (select auth.uid());
  match_count integer;
  set_count integer;
  event_count integer;
  unlinked_draws integer;
begin
  if actor is null or p_tournament is null then
    raise exception 'OWNER_REQUIRED' using errcode='42501';
  end if;

  select * into tournament_row
    from public.tournaments
    where id = p_tournament
    for update;
  if not found or tournament_row.created_by is distinct from actor then
    raise exception 'OWNER_REQUIRED' using errcode='42501';
  end if;

  select count(*) into match_count from public.matches where tournament_id=p_tournament;
  select count(*) into set_count
    from public.match_sets s join public.matches m on m.id=s.match_id
    where m.tournament_id=p_tournament;
  select count(*) into event_count
    from public.match_events e join public.matches m on m.id=e.match_id
    where m.tournament_id=p_tournament;

  -- This relationship has no ON DELETE CASCADE and its column is nullable.
  update public.draw_workspaces set saved_tournament_id=null
    where saved_tournament_id=p_tournament;
  get diagnostics unlinked_draws = row_count;

  -- Cascades to tournament stages, pools, matches, sets, points/events,
  -- roster/lineups, service rotation, libero, graphics and reports.
  delete from public.tournaments where id=p_tournament;

  return jsonb_build_object(
    'deleted',true,
    'tournament_name',tournament_row.name,
    'matches_deleted',match_count,
    'sets_deleted',set_count,
    'events_deleted',event_count,
    'draw_workspaces_unlinked',unlinked_draws
  );
end
$$;
