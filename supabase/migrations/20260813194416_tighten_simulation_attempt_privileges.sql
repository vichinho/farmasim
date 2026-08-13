revoke all on public.simulation_attempts from anon;
revoke insert, update, delete, truncate, references, trigger
  on public.simulation_attempts from authenticated;
grant select on public.simulation_attempts to authenticated;
