-- Add flag to identify the web builder sitemap
ALTER TABLE public.project_sitemaps ADD COLUMN is_web_builder boolean NOT NULL DEFAULT false;

-- Create the locked web builder record
INSERT INTO public.project_sitemaps (name, sections, is_web_builder)
VALUES ('Web Builder', '[]'::jsonb, true);

-- Prevent deletion of the web builder sitemap
CREATE OR REPLACE FUNCTION public.prevent_web_builder_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_web_builder = true THEN
    RAISE EXCEPTION 'Cannot delete the system Web Builder sitemap';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER protect_web_builder_delete
BEFORE DELETE ON public.project_sitemaps
FOR EACH ROW
EXECUTE FUNCTION public.prevent_web_builder_delete();

-- Prevent changing is_web_builder flag
CREATE OR REPLACE FUNCTION public.prevent_web_builder_flag_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_web_builder IS DISTINCT FROM NEW.is_web_builder THEN
    RAISE EXCEPTION 'Cannot modify the web builder flag';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_web_builder_flag
BEFORE UPDATE ON public.project_sitemaps
FOR EACH ROW
EXECUTE FUNCTION public.prevent_web_builder_flag_change();