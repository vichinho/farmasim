alter table public.simulation_attempts
  add column if not exists criterion_results jsonb not null default '[]'::jsonb
  check (jsonb_typeof(criterion_results) = 'array');

create or replace function private.complete_simulation_attempt(
  p_attempt_id uuid,
  p_scenario_slug text,
  p_level_number integer,
  p_correct_answers integer,
  p_incorrect_answers integer,
  p_started_at timestamptz,
  p_criterion_results jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted boolean;
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if jsonb_typeof(p_criterion_results) <> 'array' then
    raise exception 'Invalid criterion results';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_criterion_results) as item
    where jsonb_typeof(item) <> 'object'
      or not (item ? 'criterionId')
      or not (item ? 'status')
      or item ->> 'criterionId' not in (
        'criterion-1-request-identity-document',
        'criterion-2-system-identity-match',
        'criterion-3-identify-all-prescriptions',
        'criterion-4-confirm-prescription-issued',
        'criterion-5-compare-prepared-items',
        'criterion-6-recheck-identity-before-handoff',
        'criterion-7-provide-corresponding-instructions'
      )
      or item ->> 'status' not in ('met', 'reinforcement', 'intercepted')
  ) then
    raise exception 'Invalid criterion results';
  end if;

  if p_scenario_slug = 'case-001-ambulatory-dispensing' and (
    jsonb_array_length(p_criterion_results) <> 7
    or (select count(distinct item ->> 'criterionId') from jsonb_array_elements(p_criterion_results) as item) <> 7
  ) then
    raise exception 'Case 001 must include the seven criterion results';
  end if;

  if p_scenario_slug <> 'case-001-ambulatory-dispensing'
    and jsonb_array_length(p_criterion_results) <> 0 then
    raise exception 'This scenario does not accept criterion results';
  end if;

  v_inserted := private.complete_simulation_attempt(
    p_attempt_id,
    p_scenario_slug,
    p_level_number,
    p_correct_answers,
    p_incorrect_answers,
    p_started_at
  );

  if not v_inserted then
    return false;
  end if;

  update public.simulation_attempts
  set criterion_results = p_criterion_results
  where id = p_attempt_id
    and user_id = v_user_id;

  return true;
end;
$$;

revoke all on function private.complete_simulation_attempt(
  uuid,
  text,
  integer,
  integer,
  integer,
  timestamptz,
  jsonb
) from public, anon;

grant execute on function private.complete_simulation_attempt(
  uuid,
  text,
  integer,
  integer,
  integer,
  timestamptz,
  jsonb
) to authenticated;

create or replace function public.complete_simulation_attempt(
  p_attempt_id uuid,
  p_scenario_slug text,
  p_level_number integer,
  p_correct_answers integer,
  p_incorrect_answers integer,
  p_started_at timestamptz,
  p_criterion_results jsonb
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
    p_started_at,
    p_criterion_results
  );
$$;

revoke all on function public.complete_simulation_attempt(
  uuid,
  text,
  integer,
  integer,
  integer,
  timestamptz,
  jsonb
) from public, anon;

grant execute on function public.complete_simulation_attempt(
  uuid,
  text,
  integer,
  integer,
  integer,
  timestamptz,
  jsonb
) to authenticated;
