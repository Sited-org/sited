import { Layout } from "@/components/layout/Layout";
import { useBlogPostBySlug } from "@/hooks/useBlogPosts";
import { useParams, Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { Calendar, Clock, User, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const FONT_MAP: Record<string, string> = {
  default: "inherit",
  inter: "'Inter', sans-serif",
  georgia: "Georgia, serif",
  merriweather: "'Merriweather', serif",
  lora: "'Lora', serif",
  playfair: "'Playfair Display', serif",
  "source-serif": "'Source Serif Pro', serif",
  "dm-sans": "'DM Sans', sans-serif",
};

const GOOGLE_FONT_URLS: Record<string, string> = {
  merriweather: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap",
  lora: "https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap",
  playfair: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap",
  "source-serif": "https://fonts.googleapis.com/css2?family=Source+Serif+Pro:wght@400;600;700&display=swap",
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPostBySlug(slug || "");

  if (isLoading) {
    return (
      <Layout>
        <div className="pt-32 pb-20 max-w-3xl mx-auto px-4 sm:px-6">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-72 w-full mb-8 rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="pt-32 pb-20 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl font-bold mb-4">Post not found</h1>
          <Link to="/blog" className="text-sited-blue hover:underline inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Blog
          </Link>
        </div>
      </Layout>
    );
  }

  const bodyFont = (post as any).body_font || "default";
  const fontFamily = FONT_MAP[bodyFont] || "inherit";
  const googleFontUrl = GOOGLE_FONT_URLS[bodyFont];

  return (
    <Layout>
      <SEOHead
        title={post?.meta_title || post?.title || "Blog Post | Sited"}
        description={post?.meta_description || post?.excerpt || ""}
        ogImage={post?.cover_image_url || undefined}
        canonical={`https://sited.co/blog/${post?.slug}`}
        schemaJson={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt || "",
          image: post.cover_image_url || undefined,
          author: { "@type": "Person", name: post.author_name },
          datePublished: post.published_at,
          dateModified: post.updated_at,
          publisher: {
            "@type": "Organization",
            name: "Sited",
            url: "https://sited.co",
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://sited.co/blog/${post.slug}`,
          },
        }}
      />

      {/* Load Google Font if needed */}
      {googleFontUrl && (
        <link rel="stylesheet" href={googleFontUrl} />
      )}

      <article className="pt-32 pb-20 sm:pt-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={16} /> Back to Blog
          </Link>

          <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-foreground">
              {post.title}
            </h1>

            {/* Meta — date, time, author, reading time */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User size={16} aria-hidden="true" />
                {post.author_name}
              </span>
              {post.published_at && (
                <time dateTime={post.published_at} className="flex items-center gap-1.5">
                  <Calendar size={16} aria-hidden="true" />
                  {format(new Date(post.published_at), "dd MMMM yyyy 'at' h:mm a")}
                </time>
              )}
              <span className="flex items-center gap-1.5">
                <Clock size={16} aria-hidden="true" />
                {post.reading_time_minutes} min read
              </span>
            </div>
          </motion.header>

          {/* Cover image */}
          {post.cover_image_url && (
            <motion.figure
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 rounded-2xl overflow-hidden"
            >
              <img
                src={post.cover_image_url}
                alt={`Cover image for ${post.title}`}
                className="w-full h-auto object-cover"
              />
            </motion.figure>
          )}

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 prose prose-lg max-w-none
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-2
              prose-h5:text-base prose-h5:mt-4 prose-h5:mb-2
              prose-h6:text-sm prose-h6:mt-4 prose-h6:mb-1
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-a:text-sited-blue prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground
              prose-img:rounded-xl
              prose-blockquote:border-sited-blue prose-blockquote:text-muted-foreground
              prose-ul:text-muted-foreground prose-ol:text-muted-foreground
              prose-li:marker:text-sited-blue
              [&_mark]:bg-accent/60 [&_mark]:px-1 [&_mark]:rounded
            "
            style={{ fontFamily }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>
    </Layout>
  );
};

export default BlogPost;
