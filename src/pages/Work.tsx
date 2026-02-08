import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePublicTestimonials, Testimonial } from "@/hooks/useTestimonials";
import { TestimonialCard } from "@/components/work/TestimonialCard";
import { WorkHero } from "@/components/work/WorkHero";
import { WorkCTA } from "@/components/work/WorkCTA";

// Fallback data for when database is empty
const fallbackProjects = [
  {
    company: "Bloom Floristry",
    category: "Website Design",
    description: "A complete digital transformation that elevated their brand and drove real business growth.",
    testimonial: "Sited transformed our entire digital presence. The website they built doesn't just look incredible—it's become our most effective sales tool.",
    author: "Sarah Mitchell",
    role: "Founder",
    videoThumbnail: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=800&fit=crop",
    websiteUrl: "https://bloomfloristry.com",
  },
  {
    company: "Urban Fitness",
    category: "Website Design",
    description: "A modern fitness studio website that captures the energy of the brand and drives memberships.",
    testimonial: "Working with Sited felt like having a world-class design team in-house. They understood our vision immediately.",
    author: "Marcus Chen",
    role: "CEO",
    videoThumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=800&fit=crop",
    websiteUrl: "https://urbanfitness.com",
  },
  {
    company: "Coastal Realty",
    category: "Website Design",
    description: "A premium real estate platform that showcases properties beautifully and generates qualified leads.",
    testimonial: "The website they built isn't just beautiful—it's become our most effective sales tool. Inquiries have quadrupled.",
    author: "Elena Rodriguez",
    role: "Director",
    videoThumbnail: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=800&fit=crop",
    websiteUrl: "https://coastalrealty.com",
  },
];

// Transform database testimonial to display format
const transformTestimonial = (t: Testimonial) => ({
  company: t.business_name,
  category: t.project_type,
  description: t.short_description,
  testimonial: t.testimonial_text,
  author: t.testimonial_author,
  role: t.testimonial_role,
  videoThumbnail: t.video_thumbnail || "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=800&fit=crop",
  videoUrl: t.video_url,
  websiteUrl: t.website_url || "#",
});

type ProjectDisplay = {
  company: string;
  category: string;
  description: string;
  testimonial: string;
  author: string;
  role: string;
  videoThumbnail: string;
  videoUrl?: string | null;
  websiteUrl: string;
};

const INITIAL_COUNT = 6;
const LOAD_MORE_COUNT = 6;

const Work = () => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const { data: dbTestimonials, isLoading } = usePublicTestimonials();

  // Use database testimonials if available, otherwise fallback
  const allProjects: ProjectDisplay[] = dbTestimonials && dbTestimonials.length > 0
    ? dbTestimonials.map(transformTestimonial)
    : fallbackProjects;

  const visibleProjects = allProjects.slice(0, visibleCount);
  const canLoadMore = visibleCount < allProjects.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, allProjects.length));
  };

  return (
    <Layout>
      <WorkHero />

      {/* Projects Grid */}
      <section className="py-12 sm:py-16 lg:py-20 bg-surface-elevated">
        <div className="container-tight">
          {isLoading ? (
            <div className="flex flex-col gap-8">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-2xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-8 sm:gap-10 lg:gap-12">
                {visibleProjects.map((project, index) => (
                  <TestimonialCard
                    key={project.company}
                    {...project}
                    index={index}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {canLoadMore && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mt-12 sm:mt-16 flex justify-center"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMore}
                    className="gap-2 group"
                  >
                    Load More Projects
                    <ChevronDown
                      size={18}
                      className="transition-transform group-hover:translate-y-0.5"
                    />
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>

      <WorkCTA />
    </Layout>
  );
};

export default Work;
