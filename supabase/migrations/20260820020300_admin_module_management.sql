create policy "Admins can view all scenarios"
on public.scenarios
for select
to authenticated
using (private.current_profile_role() = 'admin'::public.profile_role);

create policy "Admins can view all modules"
on public.modules
for select
to authenticated
using (private.current_profile_role() = 'admin'::public.profile_role);

create or replace function private.write_admin_audit(
  p_actor_id uuid,
  p_action text,
  p_target_type text,
  p_target_id text,
  p_facility_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.supervisor_audit_log(actor_id, facility_id, action, target_type, target_id, metadata)
  values (p_actor_id, p_facility_id, p_action, p_target_type, p_target_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

revoke all on function private.write_admin_audit(uuid,text,text,text,text,jsonb) from public;
revoke all on function private.write_admin_audit(uuid,text,text,text,text,jsonb) from anon;
revoke all on function private.write_admin_audit(uuid,text,text,text,text,jsonb) from authenticated;

create or replace function public.admin_update_profile(p_user_id uuid, p_role text, p_is_training_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_old_role public.profile_role;
begin
  if v_actor is null or private.current_profile_role() <> 'admin'::public.profile_role then raise exception 'admin_required'; end if;
  if p_role not in ('learner','supervisor','admin') then raise exception 'invalid_role'; end if;
  select role into v_old_role from public.profiles where id = p_user_id for update;
  if v_old_role is null then raise exception 'profile_not_found'; end if;
  if p_user_id = v_actor and p_role <> 'admin' then raise exception 'cannot_remove_own_admin_role'; end if;
  if v_old_role = 'admin'::public.profile_role and p_role <> 'admin' and (select count(*) from public.profiles where role = 'admin'::public.profile_role) <= 1 then raise exception 'cannot_remove_last_admin'; end if;
  update public.profiles set role = p_role::public.profile_role, is_training_active = p_is_training_active, updated_at = now() where id = p_user_id;
  perform private.write_admin_audit(v_actor, 'admin.profile.updated', 'profile', p_user_id::text, null, jsonb_build_object('old_role', v_old_role::text, 'new_role', p_role, 'is_training_active', p_is_training_active));
end;
$$;
revoke all on function public.admin_update_profile(uuid,text,boolean) from public;
revoke all on function public.admin_update_profile(uuid,text,boolean) from anon;
grant execute on function public.admin_update_profile(uuid,text,boolean) to authenticated;

create or replace function public.admin_set_primary_facility(p_user_id uuid, p_facility_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_actor uuid := (select auth.uid());
begin
  if v_actor is null or private.current_profile_role() <> 'admin'::public.profile_role then raise exception 'admin_required'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then raise exception 'profile_not_found'; end if;
  if not exists (select 1 from public.establishments where id = p_facility_id and is_active) then raise exception 'active_facility_not_found'; end if;
  insert into public.profile_facility_memberships(user_id, facility_id, is_primary) values (p_user_id, p_facility_id, false) on conflict (user_id, facility_id) do nothing;
  update public.profile_facility_memberships set is_primary = (facility_id = p_facility_id) where user_id = p_user_id;
  perform private.write_admin_audit(v_actor, 'admin.profile.primary_facility_changed', 'profile', p_user_id::text, p_facility_id, jsonb_build_object('facility_id', p_facility_id));
end;
$$;
revoke all on function public.admin_set_primary_facility(uuid,text) from public;
revoke all on function public.admin_set_primary_facility(uuid,text) from anon;
grant execute on function public.admin_set_primary_facility(uuid,text) to authenticated;

create or replace function public.admin_upsert_establishment(p_id text, p_display_name text, p_is_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_exists boolean;
begin
  if v_actor is null or private.current_profile_role() <> 'admin'::public.profile_role then raise exception 'admin_required'; end if;
  if p_id !~ '^[a-z0-9][a-z0-9-]{2,63}$' then raise exception 'invalid_establishment_id'; end if;
  if length(trim(p_display_name)) < 3 or length(trim(p_display_name)) > 120 then raise exception 'invalid_display_name'; end if;
  select exists(select 1 from public.establishments where id = p_id) into v_exists;
  insert into public.establishments(id, display_name, is_active) values (p_id, trim(p_display_name), p_is_active)
  on conflict (id) do update set display_name = excluded.display_name, is_active = excluded.is_active;
  perform private.write_admin_audit(v_actor, case when v_exists then 'admin.establishment.updated' else 'admin.establishment.created' end, 'establishment', p_id, p_id, jsonb_build_object('display_name', trim(p_display_name), 'is_active', p_is_active));
end;
$$;
revoke all on function public.admin_upsert_establishment(text,text,boolean) from public;
revoke all on function public.admin_upsert_establishment(text,text,boolean) from anon;
grant execute on function public.admin_upsert_establishment(text,text,boolean) to authenticated;

create or replace function public.admin_update_scenario(p_scenario_id uuid, p_is_active boolean, p_difficulty smallint, p_xp_reward integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_actor uuid := (select auth.uid());
begin
  if v_actor is null or private.current_profile_role() <> 'admin'::public.profile_role then raise exception 'admin_required'; end if;
  if p_difficulty < 1 or p_difficulty > 5 then raise exception 'invalid_difficulty'; end if;
  if p_xp_reward < 0 or p_xp_reward > 5000 then raise exception 'invalid_xp_reward'; end if;
  update public.scenarios set is_active = p_is_active, difficulty = p_difficulty, xp_reward = p_xp_reward where id = p_scenario_id;
  if not found then raise exception 'scenario_not_found'; end if;
  perform private.write_admin_audit(v_actor, 'admin.scenario.updated', 'scenario', p_scenario_id::text, null, jsonb_build_object('is_active', p_is_active, 'difficulty', p_difficulty, 'xp_reward', p_xp_reward));
end;
$$;
revoke all on function public.admin_update_scenario(uuid,boolean,smallint,integer) from public;
revoke all on function public.admin_update_scenario(uuid,boolean,smallint,integer) from anon;
grant execute on function public.admin_update_scenario(uuid,boolean,smallint,integer) to authenticated;

create or replace function public.admin_update_training_module(p_module_id uuid, p_is_active boolean, p_xp_reward integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_actor uuid := (select auth.uid());
begin
  if v_actor is null or private.current_profile_role() <> 'admin'::public.profile_role then raise exception 'admin_required'; end if;
  if p_xp_reward < 0 or p_xp_reward > 5000 then raise exception 'invalid_xp_reward'; end if;
  update public.modules set is_active = p_is_active, xp_reward = p_xp_reward where id = p_module_id;
  if not found then raise exception 'module_not_found'; end if;
  perform private.write_admin_audit(v_actor, 'admin.training_module.updated', 'module', p_module_id::text, null, jsonb_build_object('is_active', p_is_active, 'xp_reward', p_xp_reward));
end;
$$;
revoke all on function public.admin_update_training_module(uuid,boolean,integer) from public;
revoke all on function public.admin_update_training_module(uuid,boolean,integer) from anon;
grant execute on function public.admin_update_training_module(uuid,boolean,integer) to authenticated;
