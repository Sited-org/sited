
-- Remove the 'contract_signed' step from all existing build flows
-- First delete any step_completions referencing these steps
DELETE FROM public.step_completions
WHERE step_id IN (
  SELECT id FROM public.build_steps WHERE step_key = 'contract_signed'
);

-- Now delete the contract_signed steps themselves
DELETE FROM public.build_steps WHERE step_key = 'contract_signed';

-- Renumber remaining steps in phase 1 (onboarding phase) to be sequential
-- After removing contract_signed (was step 3), deposit_received should become step 3, etc.
WITH ranked_steps AS (
  SELECT bs.id, bs.phase_id,
    ROW_NUMBER() OVER (PARTITION BY bs.phase_id ORDER BY bs.order_index, bs.step_number) AS new_num
  FROM public.build_steps bs
  INNER JOIN public.build_phases bp ON bp.id = bs.phase_id
  WHERE bp.phase_key = 'onboarding'
)
UPDATE public.build_steps
SET step_number = ranked_steps.new_num,
    order_index = ranked_steps.new_num - 1
FROM ranked_steps
WHERE build_steps.id = ranked_steps.id;
