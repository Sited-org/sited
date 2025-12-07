import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";

const projects = [
  {
    title: "Bloom Floristry",
    category: "E-commerce Website",
    description: "A beautiful online store for a boutique flower shop with seamless ordering.",
    image: "bg-gradient-to-br from-pink-100 to-rose-200",
  },
  {
    title: "FitTrack Pro",
    category: "Mobile App",
    description: "Fitness tracking app with AI-powered workout recommendations.",
    image: "bg-gradient-to-br from-blue-100 to-cyan-200",
  },
  {
    title: "Café Luna",
    category: "Website & Branding",
    description: "Complete brand identity and website for an artisan coffee roaster.",
    image: "bg-gradient-to-br from-amber-100 to-orange-200",
  },
  {
    title: "MediCare Connect",
    category: "Healthcare App",
    description: "Patient management app streamlining appointments and records.",
    image: "bg-gradient-to-br from-emerald-100 to-teal-200",
  },
  {
    title: "Urban Estates",
    category: "Real Estate Website",
    description: "Property listing platform with advanced search and virtual tours.",
    image: "bg-gradient-to-br from-slate-100 to-gray-200",
  },
  {
    title: "Taskify",
    category: "Productivity App",
    description: "Team collaboration tool with smart task management features.",
    image: "bg-gradient-to-br from-violet-100 to-purple-200",
  },
];

const Work = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-surface-elevated to-background">
        <div className="container-tight text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
              Our Work
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6"
          >
            Projects that speak
            <br />
            <span className="text-muted-foreground">for themselves</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            A selection of our recent work across websites, apps, and branding
            projects for businesses of all sizes.
          </motion.p>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="section-padding bg-background">
        <div className="container-tight">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <ScrollReveal key={project.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="group cursor-pointer"
                >
                  <div
                    className={`aspect-[4/3] rounded-2xl ${project.image} mb-6 overflow-hidden relative`}
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-foreground/80 flex items-center justify-center"
                    >
                      <span className="text-background flex items-center gap-2 font-medium">
                        View Project <ExternalLink size={18} />
                      </span>
                    </motion.div>
                  </div>
                  <span className="text-sm text-muted-foreground uppercase tracking-wider">
                    {project.category}
                  </span>
                  <h3 className="text-xl font-semibold mt-2 mb-2 group-hover:text-muted-foreground transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-muted-foreground">{project.description}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-surface-elevated">
        <div className="container-tight">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "50+", label: "Projects Delivered" },
              { value: "98%", label: "Client Satisfaction" },
              { value: "3x", label: "Average ROI" },
              { value: "2 weeks", label: "Average Delivery" },
            ].map((stat, index) => (
              <ScrollReveal key={stat.label} delay={index * 0.1}>
                <div>
                  <span className="text-4xl md:text-5xl font-semibold">{stat.value}</span>
                  <p className="text-muted-foreground mt-2 text-sm">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-foreground text-background">
        <div className="container-tight text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-6">
              Ready to see your project here?
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="text-background/70 text-lg max-w-2xl mx-auto mb-10">
              Let's create something amazing together.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <Button
              size="xl"
              className="bg-background text-foreground hover:bg-background/90"
              asChild
            >
              <Link to="/contact">
                Start Your Project <ArrowRight size={20} />
              </Link>
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Work;
