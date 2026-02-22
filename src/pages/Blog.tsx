import { Layout } from "@/components/layout/Layout";
import { usePublicBlogPosts } from "@/hooks/useBlogPosts";
import { usePageSEO } from "@/hooks/usePageSEO";
import { motion } from "framer-motion";
import { Calendar, Clock, User, ArrowRight, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const Blog = () => {
  usePageSEO({
    title: "Blog | Sited — Web Design Tips, Insights & Case Studies",
    description: "Expert insights on web design, SEO, and growing your business online. Tips, case studies, and strategies from the Sited team.",
  });

  const { data: posts, isLoading } = usePublicBlogPosts();

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-8 pb-16 sm:pt-40 sm:pb-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-sited-blue font-bold mb-4">
              Insights & Ideas
            </p>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.85] text-foreground uppercase">
              The Sited <span className="text-sited-blue">Blog</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
              Tips, strategies, and case studies to help your business thrive online.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Posts Feed */}
      <section className="pb-20 sm:pb-28 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {isLoading ? (
            <div className="space-y-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-border rounded-2xl overflow-hidden">
                  <Skeleton className="h-56 w-full" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-10">
              {posts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group block bg-card border border-border rounded-2xl overflow-hidden hover:border-sited-blue/40 transition-all duration-300 hover:shadow-elevated"
                  >
                    {post.cover_image_url && (
                      <div className="aspect-[2/1] overflow-hidden">
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-6 sm:p-8">
                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs font-medium">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <h2 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-sited-blue transition-colors leading-tight">
                        {post.title}
                      </h2>

                      {post.excerpt && (
                        <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <User size={14} />
                          {post.author_name}
                        </span>
                        {post.published_at && (
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {format(new Date(post.published_at), "dd MMM yyyy")}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} />
                          {post.reading_time_minutes} min read
                        </span>
                      </div>

                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sited-blue group-hover:gap-3 transition-all">
                        Read More <ArrowRight size={16} />
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No posts yet — check back soon!</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
