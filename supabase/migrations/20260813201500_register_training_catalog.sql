with training_module as (
  select id
  from public.modules
  where sort_order = 0
  limit 1
), training_cases (slug, title, description, difficulty, xp_reward, decision_count) as (
  values
    (
      'case-001-ambulatory-dispensing',
      'Caso 001 - Dispensación ambulatoria',
      'Caso ficticio para practicar selección, verificación y recuperación de errores.',
      1::smallint,
      100,
      6::smallint
    ),
    (
      'case-002-concentration-reinforcement',
      'Caso 002 - Refuerzo de concentración',
      'Contexto ficticio para reforzar la comparación de concentraciones.',
      1::smallint,
      100,
      6::smallint
    ),
    (
      'case-003-concentration-reinforcement',
      'Caso 003 - Cambio de disposición',
      'Práctica ficticia de la misma competencia en un contexto diferente.',
      1::smallint,
      100,
      6::smallint
    ),
    (
      'case-004-concentration-reinforcement',
      'Caso 004 - Consolidación',
      'Escenario ficticio para consolidar la verificación de concentración.',
      1::smallint,
      100,
      6::smallint
    )
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
  training_module.id,
  training_cases.slug,
  training_cases.title,
  training_cases.description,
  training_cases.difficulty,
  training_cases.xp_reward,
  training_cases.decision_count,
  true
from training_module
cross join training_cases
on conflict (slug) where slug is not null do update
set title = excluded.title,
    description = excluded.description,
    difficulty = excluded.difficulty,
    xp_reward = excluded.xp_reward,
    decision_count = excluded.decision_count,
    is_active = excluded.is_active;
