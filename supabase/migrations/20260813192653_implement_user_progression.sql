alter table public.scenarios
  add column slug text,
  add column decision_count smallint not null default 0
    check (decision_count >= 0);

create unique index scenarios_slug_idx
  on public.scenarios (slug)
  where slug is not null;

alter table public.simulation_attempts
  add constraint simulation_attempts_score_percentage_check
  check (score between 0 and 100) not valid;

alter table public.simulation_attempts
  validate constraint simulation_attempts_score_percentage_check;

with training_module as (
  insert into public.modules (
    title,
    description,
    sort_order,
    difficulty,
    xp_reward,
    is_active
  )
  values (
    'Primeros pasos',
    'Contenido demostrativo y completamente ficticio de FarmaSim.',
    0,
    1,
    100,
    true
  )
  on conflict (sort_order) do update
  set title = excluded.title,
      description = excluded.description,
      difficulty = excluded.difficulty,
      xp_reward = excluded.xp_reward,
      is_active = excluded.is_active
  returning id
)
insert into public.scenarios (
  module_id,
  slug,
  title,
  description,
  difficulty,
  xp_reward,
  decision_count,
  is_active
)
select
  id,
  'first-attention',
  'Tu primera atención',
  'Escenario ficticio para practicar una comunicación clara y respetuosa.',
  1,
  100,
  4,
  true
from training_module
on conflict (slug) where slug is not null do update
set module_id = excluded.module_id,
    title = excluded.title,
    description = excluded.description,
    difficulty = excluded.difficulty,
    xp_reward = excluded.xp_reward,
    decision_count = excluded.decision_count,
    is_active = excluded.is_active;

insert into public.achievements (name, description, icon, xp_reward)
values (
  'Primera simulación',
  'Completaste tu primera simulación en FarmaSim.',
  'sparkles',
  0
)
on conflict (name) do update
set description = excluded.description,
    icon = excluded.icon,
    xp_reward = excluded.xp_reward;

revoke insert on public.simulation_attempts from authenticated;

drop policy if exists "Users can create their own simulation attempts"
  on public.simulation_attempts;

create function private.complete_simulation_attempt(
  p_attempt_id uuid,
  p_scenario_slug text,
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
  timestamptz
) from public, anon;

grant usage on schema private to authenticated;
grant execute on function private.complete_simulation_attempt(
  uuid,
  text,
  integer,
  integer,
  timestamptz
) to authenticated;

create function public.complete_simulation_attempt(
  p_attempt_id uuid,
  p_scenario_slug text,
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
  timestamptz
) from public, anon;

grant execute on function public.complete_simulation_attempt(
  uuid,
  text,
  integer,
  integer,
  timestamptz
) to authenticated;
