
-- Blog posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  reading_time_minutes INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can view published posts
CREATE POLICY "Public can view published blog posts"
ON public.blog_posts FOR SELECT
USING (status = 'published' AND (published_at IS NULL OR published_at <= now()));

-- Admins can view all posts
CREATE POLICY "Admins can view all blog posts"
ON public.blog_posts FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert blog posts
CREATE POLICY "Admins can insert blog posts"
ON public.blog_posts FOR INSERT
WITH CHECK (can_edit_leads(auth.uid()));

-- Admins can update blog posts
CREATE POLICY "Admins can update blog posts"
ON public.blog_posts FOR UPDATE
USING (can_edit_leads(auth.uid()));

-- Admins can delete blog posts
CREATE POLICY "Admins can delete blog posts"
ON public.blog_posts FOR DELETE
USING (can_edit_leads(auth.uid()));

-- Index for slug lookups
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);

-- Index for published posts ordering
CREATE INDEX idx_blog_posts_published ON public.blog_posts(status, published_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for blog images
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);

-- Storage policies for blog images
CREATE POLICY "Blog images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Admins can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update blog images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'blog-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete blog images"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-images' AND is_admin(auth.uid()));
