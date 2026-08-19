drop policy if exists "Supervisors manage facility capsules" on public.educational_capsules;

create policy "Supervisors create facility capsules" on public.educational_capsules
for insert to authenticated
with check (
  private.can_manage_facility(facility_id)
  and author_id = (select auth.uid())
);

create policy "Supervisors update facility capsules" on public.educational_capsules
for update to authenticated
using (private.can_manage_facility(facility_id))
with check (private.can_manage_facility(facility_id));

create policy "Supervisors delete facility capsules" on public.educational_capsules
for delete to authenticated
using (private.can_manage_facility(facility_id));

create or replace function private.preserve_capsule_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.author_id is distinct from old.author_id
     and private.current_profile_role() <> 'admin'::public.profile_role then
    new.author_id := old.author_id;
  end if;
  return new;
end;
$$;

create trigger educational_capsules_preserve_author
before update on public.educational_capsules
for each row execute function private.preserve_capsule_author();
