alter table public.supervisor_audit_log
  drop constraint if exists supervisor_audit_log_action_check;

alter table public.supervisor_audit_log
  add constraint supervisor_audit_log_action_check
  check (
    action = any (
      array[
        'capsule.created'::text,
        'capsule.updated'::text,
        'capsule.published'::text,
        'capsule.archived'::text,
        'training.assigned'::text,
        'capsule.assigned'::text,
        'admin.profile.updated'::text,
        'admin.profile.primary_facility_changed'::text,
        'admin.establishment.created'::text,
        'admin.establishment.updated'::text,
        'admin.scenario.updated'::text,
        'admin.training_module.updated'::text
      ]
    )
  );
