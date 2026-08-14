alter table public.simulation_attempts
  add column if not exists level_number smallint;

do $$
begin
  alter table public.simulation_attempts
    add constraint simulation_attempts_level_number_check
    check (level_number between 1 and 7);
exception
  when duplicate_object then null;
end;
$$;

create index if not exists simulation_attempts_user_level_completed_idx
  on public.simulation_attempts (user_id, level_number, completed_at desc)
  where completed_at is not null and level_number is not null;

-- Legacy releases used case 001 for the first three routes and did not save
-- the route number. Preserve that progress by assigning the first three
-- completed attempts in chronological order to routes 1, 2 and 3.
with ranked_legacy_attempts as (
  select
    attempts.id,
    row_number() over (
      partition by attempts.user_id
      order by attempts.completed_at, attempts.id
    ) as route_number
  from public.simulation_attempts as attempts
  join public.scenarios as scenarios on scenarios.id = attempts.scenario_id
  where scenarios.slug = 'case-001-ambulatory-dispensing'
    and attempts.completed_at is not null
    and attempts.level_number is null
)
update public.simulation_attempts as attempts
set level_number = least(ranked.route_number, 3)::smallint
from ranked_legacy_attempts as ranked
where attempts.id = ranked.id;

update public.simulation_attempts as attempts
set level_number = case scenarios.slug
  when 'case-002-concentration-reinforcement' then 2
  when 'case-003-concentration-reinforcement' then 3
end
from public.scenarios as scenarios
where scenarios.id = attempts.scenario_id
  and attempts.level_number is null
  and scenarios.slug in (
    'case-002-concentration-reinforcement',
    'case-003-concentration-reinforcement'
  );

create or replace function private.complete_simulation_attempt(
  p_attempt_id uuid,
  p_scenario_slug text,
  p_level_number integer,
  p_correct_answers integer,
  p_incorrect_answers integer,
  p_started_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_scenario public.scenarios%rowtype;
  v_total_answers integer;
  v_score integer;
  v_xp_earned integer;
  v_inserted_attempt_id uuid;
  v_achievement_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not (
    (p_level_number = 1 and p_scenario_slug = 'case-001-ambulatory-dispensing')
    or (p_level_number = 2 and p_scenario_slug = 'case-002-concentration-reinforcement')
    or (p_level_number = 3 and p_scenario_slug = 'case-003-concentration-reinforcement')
    or (p_level_number = 4 and p_scenario_slug = 'case-004-concentration-reinforcement')
  ) then
    raise exception 'Scenario does not belong to training level';
  end if;

  select *
  into v_scenario
  from public.scenarios
  where slug = p_scenario_slug
    and is_active = true;

  if not found then
    raise exception 'Active scenario not found';
  end if;

  v_total_answers := p_correct_answers + p_incorrect_answers;

  if p_correct_answers < 0
    or p_incorrect_answers < 0
    or v_total_answers <> v_scenario.decision_count
    or v_scenario.decision_count <= 0 then
    raise exception 'Invalid simulation result';
  end if;

  if p_started_at > now()
    or p_started_at < now() - interval '24 hours' then
    raise exception 'Invalid simulation start time';
  end if;

  v_score := round(
    (p_correct_answers::numeric / v_scenario.decision_count) * 100
  );
  v_xp_earned := round(
    (p_correct_answers::numeric / v_scenario.decision_count) * v_scenario.xp_reward
  );

  insert into public.simulation_attempts (
    id,
    user_id,
    scenario_id,
    level_number,
    score,
    correct_answers,
    incorrect_answers,
    xp_earned,
    started_at,
    completed_at
  )
  values (
    p_attempt_id,
    v_user_id,
    v_scenario.id,
    p_level_number,
    v_score,
    p_correct_answers,
    p_incorrect_answers,
    v_xp_earned,
    p_started_at,
    now()
  )
  on conflict (id) do nothing
  returning id into v_inserted_attempt_id;

  if v_inserted_attempt_id is null then
    return false;
  end if;

  update public.profiles
  set xp = xp + v_xp_earned,
      level = ((xp + v_xp_earned) / 250) + 1
  where id = v_user_id;

  select id
  into v_achievement_id
  from public.achievements
  where name = 'Primera simulación';

  if v_achievement_id is not null then
    insert into public.user_achievements (user_id, achievement_id)
    values (v_user_id, v_achievement_id)
    on conflict (user_id, achievement_id) do nothing;
  end if;

  return true;
end;
$$;

revoke all on function private.complete_simulation_attempt(
  uuid,
  text,
  integer,
  integer,
  integer,
  timestamptz
) from public, anon;

grant execute on function private.complete_simulation_attempt(
  uuid,
  text,
  integer,
  integer,
  integer,
  timestamptz
) to authenticated;

create or replace function public.complete_simulation_attempt(
  p_attempt_id uuid,
  p_scenario_slug text,
  p_level_number integer,
  p_correct_answers integer,
  p_incorrect_answers integer,
  p_started_at timestamptz
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.complete_simulation_attempt(
    p_attempt_id,
    p_scenario_slug,
    p_level_number,
    p_correct_answers,
    p_incorrect_answers,
    p_started_at
  );
$$;

revoke all on function public.complete_simulation_attempt(
  uuid,
  text,
  integer,
  integer,
  integer,
  timestamptz
) from public, anon;

grant execute on function public.complete_simulation_attempt(
  uuid,
  text,
  integer,
  integer,
  integer,
  timestamptz
) to authenticated;
