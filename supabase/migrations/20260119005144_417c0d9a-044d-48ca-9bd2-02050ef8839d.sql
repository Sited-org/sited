-- Drop old category constraint and add new one with correct values
ALTER TABLE public.project_milestones 
DROP CONSTRAINT IF EXISTS project_milestones_category_check;

ALTER TABLE public.project_milestones 
ADD CONSTRAINT project_milestones_category_check 
CHECK (category = ANY (ARRAY['frontend'::text, 'backend'::text, 'design'::text, 'metrics'::text]));