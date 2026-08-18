create table public.simulation_checkpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null
    check (char_length(session_id) between 1 and 200),
  scenario_definition_id text not null
    check (char_length(scenario_definition_id) between 1 and 200),
  scenario_definition_version integer not null
    check (scenario_definition_version > 0),
  checkpoint_version smallint not null
    check (checkpoint_version > 0),
  checkpoint jsonb not null
    check (jsonb_typeof(checkpoint) = 'object'),
  saved_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, session_id),
  check ((checkpoint ->> 'checkpointVersion') = checkpoint_version::text),
  check ((checkpoint -> 'session' ->> 'id') = session_id),
  check ((checkpoint -> 'definition' ->> 'id') = scenario_definition_id),
  check (jsonb_typeof(checkpoint -> 'events') = 'array')
);

create index simulation_checkpoints_user_updated_idx
  on public.simulation_checkpoints (user_id, updated_at desc);

create index simulation_checkpoints_user_scenario_updated_idx
  on public.simulation_checkpoints (
    user_id,
    scenario_definition_id,
    updated_at desc
  );

create trigger simulation_checkpoints_set_updated_at
before update on public.simulation_checkpoints
for each row execute function private.set_updated_at();

alter table public.simulation_checkpoints enable row level security;

grant select, insert, update, delete
  on public.simulation_checkpoints
  to authenticated;

create policy "Users can read their own simulation checkpoints"
on public.simulation_checkpoints
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own simulation checkpoints"
on public.simulation_checkpoints
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own simulation checkpoints"
on public.simulation_checkpoints
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own simulation checkpoints"
on public.simulation_checkpoints
for delete
to authenticated
using ((select auth.uid()) = user_id);
