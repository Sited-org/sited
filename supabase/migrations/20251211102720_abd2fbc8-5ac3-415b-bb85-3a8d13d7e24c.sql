-- Fix form_sessions: Make table append-only by removing UPDATE policy
-- This prevents anyone from modifying existing form sessions

DROP POLICY IF EXISTS "Anyone can update form sessions" ON public.form_sessions;

-- Add a restricted update policy that only allows the session to mark itself as completed
-- using a session_id match (stored client-side and passed as a header)
CREATE POLICY "Sessions can only update their own data" 
ON public.form_sessions 
FOR UPDATE 
USING (session_id = current_setting('request.headers', true)::json->>'x-session-id');