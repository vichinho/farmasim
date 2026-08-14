insert into public.scenarios (
  module_id, slug, title, description, difficulty, xp_reward, decision_count, is_active
)
select
  modules.id,
  'case-006-multiple-errors',
  'Caso 006 - Discrepancias múltiples',
  'Escenario educativo ficticio con dos discrepancias potenciales.',
  9,
  100,
  9,
  true
from public.modules
where modules.sort_order = 0
on conflict (slug) where slug is not null do update
set
  module_id = excluded.module_id,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  xp_reward = excluded.xp_reward,
  decision_count = excluded.decision_count,
  is_active = excluded.is_active;

update public.scenarios
set decision_count = 8
where slug in (
  'case-001-ambulatory-dispensing',
  'case-002-concentration-reinforcement',
  'case-003-concentration-reinforcement',
  'case-004-concentration-reinforcement'
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
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not (
    (p_level_number = 1 and p_scenario_slug = 'case-001-ambulatory-dispensing')
    or (p_level_number = 2 and p_scenario_slug = 'case-002-concentration-reinforcement')
    or (p_level_number = 3 and p_scenario_slug = 'case-003-concentration-reinforcement')
    or (p_level_number = 4 and p_scenario_slug = 'case-004-concentration-reinforcement')
    or (p_level_number = 5 and p_scenario_slug = 'case-005-storage-review')
    or (p_level_number = 6 and p_scenario_slug = 'case-006-multiple-errors')
  ) then raise exception 'Scenario does not belong to training level'; end if;

  select * into v_scenario from public.scenarios
  where slug = p_scenario_slug and is_active = true;
  if not found then raise exception 'Active scenario not found'; end if;

  v_total_answers := p_correct_answers + p_incorrect_answers;
  if p_correct_answers < 0 or p_incorrect_answers < 0
    or v_total_answers <> v_scenario.decision_count
    or v_scenario.decision_count <= 0 then raise exception 'Invalid simulation result'; end if;
  if p_started_at > now() or p_started_at < now() - interval '24 hours' then
    raise exception 'Invalid simulation start time';
  end if;

  v_score := round((p_correct_answers::numeric / v_scenario.decision_count) * 100);
  v_xp_earned := round((p_correct_answers::numeric / v_scenario.decision_count) * v_scenario.xp_reward);
  insert into public.simulation_attempts (
    id, user_id, scenario_id, level_number, score, correct_answers,
    incorrect_answers, xp_earned, started_at, completed_at
  ) values (
    p_attempt_id, v_user_id, v_scenario.id, p_level_number, v_score,
    p_correct_answers, p_incorrect_answers, v_xp_earned, p_started_at, now()
  ) on conflict (id) do nothing returning id into v_inserted_attempt_id;
  if v_inserted_attempt_id is null then return false; end if;

  update public.profiles
  set xp = xp + v_xp_earned, level = ((xp + v_xp_earned) / 250) + 1
  where id = v_user_id;
  select id into v_achievement_id from public.achievements where name = 'Primera simulación';
  if v_achievement_id is not null then
    insert into public.user_achievements (user_id, achievement_id)
    values (v_user_id, v_achievement_id)
    on conflict (user_id, achievement_id) do nothing;
  end if;
  return true;
end;
$$;
