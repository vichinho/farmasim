drop policy if exists "Learners view assigned published capsules" on public.educational_capsules;

create policy "Learners view assigned published capsules"
on public.educational_capsules
for select
to authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.capsule_assignments assignment
    where assignment.capsule_id = public.educational_capsules.id
      and assignment.user_id = (select auth.uid())
  )
);
