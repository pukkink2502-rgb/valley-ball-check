-- Execute manually in existing Supabase project BEFORE using the court-side selector.
-- This migration is not applied by the GitHub code push.
begin;
create table if not exists public.match_court_sides (
 match_id uuid not null references public.matches(id) on delete cascade,
 set_number smallint not null check(set_number between 1 and 5),
 left_team_id uuid not null references public.teams(id),
 set_by uuid not null references auth.users(id),
 set_at timestamptz not null default now(),
 primary key(match_id,set_number)
);
alter table public.match_court_sides enable row level security;
revoke all on public.match_court_sides from public,anon,authenticated;
create or replace function public.set_match_court_side(p_match uuid,p_set integer,p_left_team uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare m public.matches%rowtype;actor uuid:=(select auth.uid());owner_id uuid;
begin
 if actor is null then raise exception 'LOGIN_REQUIRED' using errcode='42501';end if;
 select * into m from public.matches where id=p_match for update;
 if not found then raise exception 'MATCH_NOT_FOUND' using errcode='22023';end if;
 select created_by into owner_id from public.tournaments where id=m.tournament_id;
 if owner_id is distinct from actor and not exists(
   select 1 from public.tournament_members where tournament_id=m.tournament_id
   and user_id=actor and status='active' and role_code='scorekeeper')
 then raise exception 'NOT_SCOREKEEPER' using errcode='42501';end if;
 if m.status in ('approved','pending_approval','void') then raise exception 'MATCH_LOCKED' using errcode='22023';end if;
 if p_set not in (1,m.best_of) then raise exception 'ONLY_FIRST_OR_DECIDING_SET' using errcode='22023';end if;
 if p_left_team not in (m.team_a_id,m.team_b_id) then raise exception 'TEAM_NOT_IN_MATCH' using errcode='22023';end if;
 if exists(select 1 from public.match_sets where match_id=p_match and set_number=p_set and (points_a>0 or points_b>0))
 then raise exception 'SET_ALREADY_STARTED' using errcode='22023';end if;
 insert into public.match_court_sides(match_id,set_number,left_team_id,set_by)
 values(p_match,p_set,p_left_team,actor)
 on conflict(match_id,set_number) do update set left_team_id=excluded.left_team_id,set_by=actor,set_at=now();
 return jsonb_build_object('set',p_set,'left_team_id',p_left_team);
end $$;
revoke all on function public.set_match_court_side(uuid,integer,uuid) from public;
grant execute on function public.set_match_court_side(uuid,integer,uuid) to authenticated;
-- Keep the existing private function's access checks.
create or replace function public.official_match_snapshot(p_match uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare s jsonb; sides jsonb;
begin
 s:=vbc_private.official_match_snapshot(p_match);
 select coalesce(jsonb_agg(jsonb_build_object('set',x.set_number,
  'left_team_id',x.left_team_id,'set_at',x.set_at) order by x.set_number),'[]'::jsonb)
 into sides from public.match_court_sides x where x.match_id=p_match;
 return s||jsonb_build_object('court_sides',sides);
end $$;
revoke all on function public.official_match_snapshot(uuid) from public;
grant execute on function public.official_match_snapshot(uuid) to authenticated;
commit;
