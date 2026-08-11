create index scenarios_initial_node_id_idx
  on public.scenarios (initial_node_id);

create index scenario_choices_next_node_id_idx
  on public.scenario_choices (next_node_id);

create index user_module_progress_module_id_idx
  on public.user_module_progress (module_id);

create index simulation_attempts_scenario_id_idx
  on public.simulation_attempts (scenario_id);

create index user_achievements_achievement_id_idx
  on public.user_achievements (achievement_id);
