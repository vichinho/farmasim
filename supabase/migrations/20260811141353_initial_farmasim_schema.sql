create schema if not exists private;
revoke all on schema private from public;

create type public.profile_role as enum ('learner', 'supervisor', 'admin');
create type public.progress_status as enum ('not_started', 'in_progress', 'completed');
create type public.scenario_node_type as enum ('dialogue', 'choice', 'feedback', 'result');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Usuario',
  avatar_url text,
  role public.profile_role not null default 'learner',
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  sort_order integer not null check (sort_order >= 0),
  difficulty smallint not null check (difficulty between 1 and 5),
  xp_reward integer not null default 0 check (xp_reward >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (sort_order)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  description text not null default '',
  content text not null default '',
  duration_minutes smallint not null check (duration_minutes > 0),
  xp_reward integer not null default 0 check (xp_reward >= 0),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (module_id, sort_order)
);

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  description text not null default '',
  difficulty smallint not null check (difficulty between 1 and 5),
  xp_reward integer not null default 0 check (xp_reward >= 0),
  initial_node_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.scenario_nodes (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.scenarios (id) on delete cascade,
  type public.scenario_node_type not null,
  character_name text,
  text text not null default '',
  image_url text,
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (scenario_id, sort_order)
);

alter table public.scenarios
  add constraint scenarios_initial_node_id_fkey
  foreign key (initial_node_id)
  references public.scenario_nodes (id)
  on delete set null;

create table public.scenario_choices (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.scenario_nodes (id) on delete cascade,
  text text not null,
  next_node_id uuid references public.scenario_nodes (id) on delete set null,
  is_correct boolean not null default false,
  feedback text not null default '',
  xp_reward integer not null default 0 check (xp_reward >= 0),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (node_id, sort_order)
);

create table public.user_module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  status public.progress_status not null default 'not_started',
  progress_percentage numeric(5, 2) not null default 0
    check (progress_percentage between 0 and 100),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);

create table public.simulation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_id uuid not null references public.scenarios (id) on delete restrict,
  score integer not null default 0 check (score >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  incorrect_answers integer not null default 0 check (incorrect_answers >= 0),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  check (completed_at is null or completed_at >= started_at)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon text not null,
  xp_reward integer not null default 0 check (xp_reward >= 0),
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create index lessons_module_sort_order_idx on public.lessons (module_id, sort_order);
create index scenarios_module_id_idx on public.scenarios (module_id);
create index scenario_nodes_scenario_sort_order_idx on public.scenario_nodes (scenario_id, sort_order);
create index scenario_choices_node_sort_order_idx on public.scenario_choices (node_id, sort_order);
create index user_module_progress_user_id_idx on public.user_module_progress (user_id);
create index simulation_attempts_user_completed_at_idx
  on public.simulation_attempts (user_id, completed_at desc);
create index user_achievements_user_id_idx on public.user_achievements (user_id);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger user_module_progress_set_updated_at
before update on public.user_module_progress
for each row execute function private.set_updated_at();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Usuario')
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.scenarios enable row level security;
alter table public.scenario_nodes enable row level security;
alter table public.scenario_choices enable row level security;
alter table public.user_module_progress enable row level security;
alter table public.simulation_attempts enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select on public.modules, public.lessons, public.scenarios,
  public.scenario_nodes, public.scenario_choices, public.achievements to authenticated;
grant select, insert, update on public.user_module_progress to authenticated;
grant select, insert on public.simulation_attempts to authenticated;
grant select on public.user_achievements to authenticated;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Authenticated users can read active modules"
on public.modules for select to authenticated
using (is_active = true);

create policy "Authenticated users can read lessons"
on public.lessons for select to authenticated
using (exists (
  select 1 from public.modules
  where modules.id = lessons.module_id and modules.is_active = true
));

create policy "Authenticated users can read active scenarios"
on public.scenarios for select to authenticated
using (is_active = true);

create policy "Authenticated users can read scenario nodes"
on public.scenario_nodes for select to authenticated
using (exists (
  select 1 from public.scenarios
  where scenarios.id = scenario_nodes.scenario_id and scenarios.is_active = true
));

create policy "Authenticated users can read scenario choices"
on public.scenario_choices for select to authenticated
using (exists (
  select 1
  from public.scenario_nodes
  join public.scenarios on scenarios.id = scenario_nodes.scenario_id
  where scenario_nodes.id = scenario_choices.node_id and scenarios.is_active = true
));

create policy "Authenticated users can read achievements"
on public.achievements for select to authenticated
using (true);

create policy "Users can read their own module progress"
on public.user_module_progress for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own module progress"
on public.user_module_progress for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own module progress"
on public.user_module_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can read their own simulation attempts"
on public.simulation_attempts for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own simulation attempts"
on public.simulation_attempts for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can read their own achievements"
on public.user_achievements for select to authenticated
using ((select auth.uid()) = user_id);
