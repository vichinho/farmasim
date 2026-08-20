create policy "Supervisors view facility capsules" on public.educational_capsules
for select to authenticated
using (private.can_manage_facility(facility_id));
