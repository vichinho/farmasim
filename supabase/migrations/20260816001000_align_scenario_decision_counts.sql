-- Keep the training catalog aligned with the decisions currently evaluated by
-- each interactive experience. A mismatch causes complete_simulation_attempt
-- to reject an otherwise valid finished attempt.

update public.scenarios
set decision_count = 7
where slug in (
  'case-001-ambulatory-dispensing',
  'case-002-concentration-reinforcement',
  'case-003-concentration-reinforcement',
  'case-004-concentration-reinforcement',
  'case-006-multiple-errors',
  'case-007-expert-mode'
);

update public.scenarios
set decision_count = 4
where slug = 'case-005-storage-review';
