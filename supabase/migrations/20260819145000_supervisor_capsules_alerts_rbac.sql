create table if not exists public.establishments (
  id text primary key,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint establishments_id_check check (id in (
    'hospital-tome','hospital-las-higueras','cesfam-bellavista','cesfam-alberto-reyes',
    'cosam','san-rafael','penco','lirquen'
  ))
);

insert into public.establishments (id, display_name) values
  ('hospital-tome','Hospital de Tomé'),
  ('hospital-las-higueras','Hospital Las Higueras'),
  ('cesfam-bellavista','CESFAM Bellavista'),
  ('cesfam-alberto-reyes','CESFAM Alberto Reyes'),
  ('cosam','COSAM'),
  ('san-rafael','San Rafael'),
  ('penco','Penco'),
  ('lirquen','Lirquén')
on conflict (id) do update set display_name = excluded.display_name;

alter table public.profiles add column if not exists is_training_active boolean not null default true;

create table if not exists public.profile_facility_memberships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  facility_id text not null references public.establishments(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, facility_id)
);

create table if not exists public.simulation_alerts (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.simulation_attempts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_event_id text not null,
  category text not null check (category in ('process-deviation','medication-discrepancy','storage-deviation','safety-barrier-failure')),
  kind text not null check (kind in ('patient','final-patient','prescription','prescription-status','medication','strength','pharmaceutical-form','quantity','omission','additional-product','storage','other')),
  origin_stage text not null,
  detected_at timestamptz not null,
  detected_by text not null,
  intercepted_by text,
  severity text not null check (severity in ('low','moderate','high')),
  reached_patient boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (attempt_id, source_event_id)
);

create table if not exists public.educational_capsules (
  id uuid primary key default gen_random_uuid(),
  facility_id text not null references public.establishments(id) on delete restrict,
  title text not null check (length(title) between 1 and 180),
  summary text,
  category text not null default 'general',
  content text,
  content_type text not null default 'text' check (content_type in ('text','image','pdf','link')),
  image_path text,
  pdf_path text,
  link_url text,
  related_medication_ids text[] not null default '{}',
  related_competency_ids text[] not null default '{}',
  related_module_id uuid references public.modules(id) on delete set null,
  author_id uuid not null references public.profiles(id) on delete restrict,
  reviewer_id uuid references public.profiles(id) on delete set null,
  version integer not null default 1 check (version > 0),
  status text not null default 'draft' check (status in ('draft','reviewed','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint educational_capsules_content_check check (
    content is not null or image_path is not null or pdf_path is not null or link_url is not null
  )
);

create table if not exists public.capsule_assignments (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.educational_capsules(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'assigned' check (status in ('assigned','opened','completed')),
  assigned_at timestamptz not null default now(),
  opened_at timestamptz,
  completed_at timestamptz,
  unique (capsule_id, user_id)
);

create table if not exists public.capsule_events (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.capsule_assignments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('capsule.assigned','capsule.opened','capsule.completed')),
  occurred_at timestamptz not null default now()
);

create table if not exists public.supervisor_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete restrict,
  facility_id text references public.establishments(id) on delete set null,
  action text not null check (action in ('capsule.created','capsule.updated','capsule.published','capsule.archived','training.assigned','capsule.assigned')),
  target_type text not null,
  target_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profile_facility_memberships_facility_idx on public.profile_facility_memberships(facility_id, user_id);
create index if not exists simulation_alerts_user_idx on public.simulation_alerts(user_id, detected_at desc);
create index if not exists simulation_alerts_attempt_idx on public.simulation_alerts(attempt_id);
create index if not exists educational_capsules_facility_idx on public.educational_capsules(facility_id, status, updated_at desc);
create index if not exists capsule_assignments_user_idx on public.capsule_assignments(user_id, status, assigned_at desc);
create index if not exists supervisor_audit_actor_idx on public.supervisor_audit_log(actor_id, created_at desc);

create or replace function private.current_profile_role()
returns public.profile_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function private.can_manage_facility(p_facility_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.current_profile_role() = 'admin'::public.profile_role
    or (
      private.current_profile_role() = 'supervisor'::public.profile_role
      and exists (
        select 1 from public.profile_facility_memberships m
        where m.user_id = (select auth.uid()) and m.facility_id = p_facility_id
      )
    ), false
  );
$$;

create or replace function private.can_supervise_user(p_target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.current_profile_role() = 'admin'::public.profile_role
    or (
      private.current_profile_role() = 'supervisor'::public.profile_role
      and exists (
        select 1
        from public.profile_facility_memberships supervisor_membership
        join public.profile_facility_memberships target_membership
          on target_membership.facility_id = supervisor_membership.facility_id
        where supervisor_membership.user_id = (select auth.uid())
          and target_membership.user_id = p_target_user_id
      )
    ), false
  );
$$;

create or replace function private.can_assign_capsule(p_capsule_id uuid, p_target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.educational_capsules c
    where c.id = p_capsule_id
      and private.can_manage_facility(c.facility_id)
      and private.can_supervise_user(p_target_user_id)
      and exists (
        select 1 from public.profile_facility_memberships m
        where m.user_id = p_target_user_id and m.facility_id = c.facility_id
      )
  );
$$;

create or replace function private.can_read_capsule_object(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.can_manage_facility(split_part(p_object_name, '/', 1))
    or exists (
      select 1
      from public.educational_capsules c
      join public.capsule_assignments a on a.capsule_id = c.id
      where a.user_id = (select auth.uid())
        and c.status = 'published'
        and (c.image_path = p_object_name or c.pdf_path = p_object_name)
    ), false
  );
$$;

revoke all on function private.current_profile_role() from public;
revoke all on function private.can_manage_facility(text) from public;
revoke all on function private.can_supervise_user(uuid) from public;
revoke all on function private.can_assign_capsule(uuid, uuid) from public;
revoke all on function private.can_read_capsule_object(text) from public;
grant execute on function private.current_profile_role() to authenticated;
grant execute on function private.can_manage_facility(text) to authenticated;
grant execute on function private.can_supervise_user(uuid) to authenticated;
grant execute on function private.can_assign_capsule(uuid, uuid) to authenticated;
grant execute on function private.can_read_capsule_object(text) to authenticated;

alter table public.establishments enable row level security;
alter table public.profile_facility_memberships enable row level security;
alter table public.simulation_alerts enable row level security;
alter table public.educational_capsules enable row level security;
alter table public.capsule_assignments enable row level security;
alter table public.capsule_events enable row level security;
alter table public.supervisor_audit_log enable row level security;

create policy "Authenticated users can view establishments" on public.establishments
for select to authenticated using (true);

create policy "Users and supervisors can view scoped memberships" on public.profile_facility_memberships
for select to authenticated using (user_id = (select auth.uid()) or private.can_supervise_user(user_id));
create policy "Supervisors can add scoped memberships" on public.profile_facility_memberships
for insert to authenticated with check (private.can_manage_facility(facility_id));
create policy "Supervisors can update scoped memberships" on public.profile_facility_memberships
for update to authenticated using (private.can_manage_facility(facility_id)) with check (private.can_manage_facility(facility_id));
create policy "Supervisors can delete scoped memberships" on public.profile_facility_memberships
for delete to authenticated using (private.can_manage_facility(facility_id));

create policy "Supervisors can view scoped profiles" on public.profiles
for select to authenticated using (private.can_supervise_user(id));
create policy "Supervisors can view scoped attempts" on public.simulation_attempts
for select to authenticated using (private.can_supervise_user(user_id));
create policy "Supervisors can view scoped progress" on public.user_module_progress
for select to authenticated using (private.can_supervise_user(user_id));

create policy "Users can view own simulation alerts" on public.simulation_alerts
for select to authenticated using (user_id = (select auth.uid()));
create policy "Supervisors can view scoped simulation alerts" on public.simulation_alerts
for select to authenticated using (private.can_supervise_user(user_id));

create policy "Supervisors manage facility capsules" on public.educational_capsules
for all to authenticated
using (private.can_manage_facility(facility_id))
with check (private.can_manage_facility(facility_id) and author_id = (select auth.uid()));
create policy "Learners view assigned published capsules" on public.educational_capsules
for select to authenticated using (
  status = 'published' and exists (
    select 1 from public.capsule_assignments a
    where a.capsule_id = id and a.user_id = (select auth.uid())
  )
);

create policy "Learners view own capsule assignments" on public.capsule_assignments
for select to authenticated using (user_id = (select auth.uid()));
create policy "Supervisors view scoped capsule assignments" on public.capsule_assignments
for select to authenticated using (private.can_supervise_user(user_id));
create policy "Supervisors assign capsules" on public.capsule_assignments
for insert to authenticated with check (
  assigned_by = (select auth.uid()) and private.can_assign_capsule(capsule_id, user_id)
);
create policy "Supervisors update scoped capsule assignments" on public.capsule_assignments
for update to authenticated using (private.can_assign_capsule(capsule_id, user_id))
with check (private.can_assign_capsule(capsule_id, user_id));

create policy "Learners view own capsule events" on public.capsule_events
for select to authenticated using (user_id = (select auth.uid()));
create policy "Supervisors view scoped capsule events" on public.capsule_events
for select to authenticated using (private.can_supervise_user(user_id));

create policy "Supervisors view scoped audit log" on public.supervisor_audit_log
for select to authenticated using (private.can_manage_facility(facility_id));

insert into storage.buckets (id, name, public)
values ('educational-capsules','educational-capsules',false)
on conflict (id) do update set public = false;

create policy "Supervisors upload capsule files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'educational-capsules' and private.can_manage_facility(split_part(name, '/', 1))
);
create policy "Authorized users read capsule files" on storage.objects
for select to authenticated using (
  bucket_id = 'educational-capsules' and private.can_read_capsule_object(name)
);
create policy "Supervisors update capsule files" on storage.objects
for update to authenticated using (
  bucket_id = 'educational-capsules' and private.can_manage_facility(split_part(name, '/', 1))
) with check (
  bucket_id = 'educational-capsules' and private.can_manage_facility(split_part(name, '/', 1))
);
create policy "Supervisors delete capsule files" on storage.objects
for delete to authenticated using (
  bucket_id = 'educational-capsules' and private.can_manage_facility(split_part(name, '/', 1))
);

create or replace function private.touch_capsule_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  if row(new.*) is distinct from row(old.*) then
    new.version := greatest(old.version + 1, new.version);
  end if;
  return new;
end;
$$;

create trigger educational_capsules_touch_updated_at
before update on public.educational_capsules
for each row execute function private.touch_capsule_updated_at();

create or replace function private.audit_capsule_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := 'capsule.created';
  elsif new.status = 'published' and old.status is distinct from 'published' then
    v_action := 'capsule.published';
  elsif new.status = 'archived' and old.status is distinct from 'archived' then
    v_action := 'capsule.archived';
  else
    v_action := 'capsule.updated';
  end if;
  insert into public.supervisor_audit_log(actor_id, facility_id, action, target_type, target_id)
  values ((select auth.uid()), new.facility_id, v_action, 'educational_capsule', new.id::text);
  return new;
end;
$$;

create trigger educational_capsules_audit
after insert or update on public.educational_capsules
for each row execute function private.audit_capsule_change();

create or replace function private.audit_capsule_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_facility text;
begin
  select facility_id into v_facility from public.educational_capsules where id = new.capsule_id;
  insert into public.capsule_events(assignment_id, user_id, event_type, occurred_at)
  values (new.id, new.user_id, 'capsule.assigned', new.assigned_at);
  insert into public.supervisor_audit_log(actor_id, facility_id, action, target_type, target_id, metadata)
  values (new.assigned_by, v_facility, 'capsule.assigned', 'capsule_assignment', new.id::text, jsonb_build_object('userId', new.user_id));
  return new;
end;
$$;

create trigger capsule_assignments_audit
after insert on public.capsule_assignments
for each row execute function private.audit_capsule_assignment();

create or replace function public.open_capsule_assignment(p_assignment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_user uuid := (select auth.uid()); v_changed boolean := false;
begin
  update public.capsule_assignments
  set status = case when status = 'assigned' then 'opened' else status end,
      opened_at = coalesce(opened_at, now())
  where id = p_assignment_id and user_id = v_user and status <> 'completed'
  returning true into v_changed;
  if coalesce(v_changed,false) and not exists (
    select 1 from public.capsule_events where assignment_id = p_assignment_id and event_type = 'capsule.opened'
  ) then
    insert into public.capsule_events(assignment_id,user_id,event_type) values (p_assignment_id,v_user,'capsule.opened');
  end if;
  return coalesce(v_changed,false);
end;
$$;

create or replace function public.complete_capsule_assignment(p_assignment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_user uuid := (select auth.uid()); v_changed boolean := false;
begin
  update public.capsule_assignments
  set status = 'completed', opened_at = coalesce(opened_at, now()), completed_at = coalesce(completed_at, now())
  where id = p_assignment_id and user_id = v_user
  returning true into v_changed;
  if coalesce(v_changed,false) and not exists (
    select 1 from public.capsule_events where assignment_id = p_assignment_id and event_type = 'capsule.completed'
  ) then
    insert into public.capsule_events(assignment_id,user_id,event_type) values (p_assignment_id,v_user,'capsule.completed');
  end if;
  return coalesce(v_changed,false);
end;
$$;

grant execute on function public.open_capsule_assignment(uuid) to authenticated;
grant execute on function public.complete_capsule_assignment(uuid) to authenticated;
revoke all on function public.open_capsule_assignment(uuid) from anon;
revoke all on function public.complete_capsule_assignment(uuid) from anon;

create or replace function public.record_simulation_alerts(p_attempt_id uuid, p_alerts jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_user uuid := (select auth.uid()); v_count integer := 0;
begin
  if v_user is null or not exists (
    select 1 from public.simulation_attempts a where a.id = p_attempt_id and a.user_id = v_user
  ) then
    raise exception 'Attempt not accessible';
  end if;
  if jsonb_typeof(p_alerts) <> 'array' then raise exception 'Invalid alerts'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_alerts) item
    where jsonb_typeof(item) <> 'object'
      or coalesce(item->>'sourceEventId','') = ''
      or coalesce(item->>'category','') not in ('process-deviation','medication-discrepancy','storage-deviation','safety-barrier-failure')
      or coalesce(item->>'kind','') not in ('patient','final-patient','prescription','prescription-status','medication','strength','pharmaceutical-form','quantity','omission','additional-product','storage','other')
      or coalesce(item->>'severity','') not in ('low','moderate','high')
      or coalesce(item->>'originStage','') = ''
      or coalesce(item->>'detectedBy','') = ''
      or coalesce(item->>'detectedAt','') = ''
  ) then raise exception 'Invalid alerts'; end if;

  insert into public.simulation_alerts(
    attempt_id,user_id,source_event_id,category,kind,origin_stage,detected_at,detected_by,intercepted_by,severity,reached_patient,metadata
  )
  select p_attempt_id, v_user,
    item->>'sourceEventId', item->>'category', item->>'kind', item->>'originStage',
    (item->>'detectedAt')::timestamptz, item->>'detectedBy', nullif(item->>'interceptedBy',''),
    item->>'severity', coalesce((item->>'reachedPatient')::boolean,false), coalesce(item->'metadata','{}'::jsonb)
  from jsonb_array_elements(p_alerts) item
  on conflict (attempt_id, source_event_id) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.record_simulation_alerts(uuid,jsonb) to authenticated;
revoke all on function public.record_simulation_alerts(uuid,jsonb) from anon;
