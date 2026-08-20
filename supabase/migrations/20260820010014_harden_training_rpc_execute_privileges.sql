revoke execute on function public.open_capsule_assignment(uuid) from public;
revoke execute on function public.open_capsule_assignment(uuid) from anon;
revoke execute on function public.complete_capsule_assignment(uuid) from public;
revoke execute on function public.complete_capsule_assignment(uuid) from anon;
revoke execute on function public.record_simulation_alerts(uuid, jsonb) from public;
revoke execute on function public.record_simulation_alerts(uuid, jsonb) from anon;

grant execute on function public.open_capsule_assignment(uuid) to authenticated;
grant execute on function public.complete_capsule_assignment(uuid) to authenticated;
grant execute on function public.record_simulation_alerts(uuid, jsonb) to authenticated;
