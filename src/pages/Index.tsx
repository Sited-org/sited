import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useState, useEffect, memo } from "react";
import { ArrowRight, Zap, Globe, Star, Quote, ExternalLink, Layout as LayoutIcon, Users, BarChart3 } from "lucide-react";
import { ChatSection } from "@/components/ChatSection";
import { useHomepageTestimonials } from "@/hooks/useTestimonials";
import { usePageSEO } from "@/hooks/usePageSEO";
import { extractVimeoId, getVimeoThumbnail } from "@/lib/vimeo";

const Hero = memo(() => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-elevated to-background" />
      
      {/* Simplified floating elements - CSS only */}
      <div className="absolute top-1/4 left-[15%] w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-1/4 right-[15%] w-48 h-48 bg-accent/30 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite_1s]" />

      <motion.div
        style={{ opacity, scale, y }}
        className="relative z-10 container-tight pt-24 sm:pt-32 pb-16 sm:pb-20 text-center will-change-transform"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-semibold tracking-tight leading-[1.1] mb-4 sm:mb-6"
        >
          A Professional Website, Portal, or Dashboard —
          <br />
          <span className="text-muted-foreground">Built Fast, Maintained Proactively, Always Improving.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2"
        >
          Sited builds and looks after websites, landing pages, CRMs, client portals, and admin dashboards for growing businesses — with a dedicated team monitoring your site every single month.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button variant="hero" size="xl" asChild>
            <Link to="/work">
              See What We Build <ArrowRight size={20} />
            </Link>
          </Button>
          <Button variant="hero-outline" size="xl" asChild>
            <Link to="/contact">Book a Free Consultation</Link>
          </Button>
        </motion.div>
      </motion.div>

    </section>
  );
});

Hero.displayName = 'Hero';

const HeroVideo = memo(() => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "100px" });
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <section ref={ref} className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="container-tight px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-elevated bg-muted"
        >
          {isInView && (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onLoadedData={() => setVideoLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
              poster="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=60&fit=crop&fm=webp"
            >
              <source
                src="https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_25fps.mp4"
                type="video/mp4"
              />
            </video>
          )}
          {!videoLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
        </motion.div>
      </div>
    </section>
  );
});

HeroVideo.displayName = 'HeroVideo';

const services = [
  {
    icon: Globe,
    title: "Website Builds",
    description: "A professionally designed website that reflects your brand and turns visitors into leads. Built in days, not months. From simple landing pages to multi-page business sites, every build is fast, clean, and built to perform.",
  },
  {
    icon: Users,
    title: "CRM Systems",
    description: "Stop managing clients in spreadsheets. We build custom CRM systems tailored to how your business actually works — track leads, manage pipelines, and have a clear view of every client relationship, all in one place.",
  },
  {
    icon: BarChart3,
    title: "Admin Dashboards",
    description: "Your business data, presented clearly. We build internal dashboards that give you and your team real-time visibility of the numbers that matter — without needing a data analyst to make sense of them.",
  },
  {
    icon: LayoutIcon,
    title: "Client Portals",
    description: "Give your clients a professional, branded space to access their documents, updates, and communications with you. A client portal elevates your service offering and reduces the back-and-forth that slows every project down.",
  },
  {
    icon: Zap,
    title: "Landing Pages",
    description: "High-converting landing pages for campaigns, product launches, or new service offerings. Designed to capture attention and drive action — built and live within days.",
  },
];

const Services = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-tight">
        <SectionHeading
          eyebrow="What We Do"
          title="What Sited Builds & Manages"
          description="We build the digital tools your business runs on — and then we keep them running. Whether you need a sharp website that converts visitors into enquiries, a CRM to manage your clients, or a portal that gives your customers a seamless experience, Sited delivers it quickly and professionally. Then, through our Care Plan, we monitor and improve it every month so you never have to worry about it again."
        />

        <div className="mt-10 sm:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {services.map((service, index) => (
            <ScrollReveal key={service.title} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                className="group p-5 sm:p-8 rounded-2xl border border-border bg-card hover:shadow-elevated transition-all duration-300"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent flex items-center justify-center mb-4 sm:mb-6">
                  <service.icon size={20} className="sm:w-6 sm:h-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{service.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{service.description}</p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.4} className="mt-12 text-center">
          <Button variant="outline" size="lg" asChild>
            <Link to="/services">
              See Everything We Build <ArrowRight size={18} />
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
};

const Process = () => {
  const steps = [
    { number: "01", title: "Discovery", description: "We learn about your business, goals, and vision through our detailed onboarding process." },
    { number: "02", title: "Design", description: "We create stunning visuals tailored to your brand and your audience." },
    { number: "03", title: "Develop", description: "We build your project using the best available technology for speed and reliability." },
    { number: "04", title: "Launch & Care", description: "Your project goes live, and our Care Plan keeps it monitored and improving every month." },
  ];

  return (
    <section className="section-padding bg-surface-elevated">
      <div className="container-tight">
        <SectionHeading
          eyebrow="Our Process"
          title="From idea to launch in days, not months"
          description="Our streamlined process ensures quality delivery without unnecessary delays."
        />

        <div className="mt-10 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 0.1}>
              <div className="relative">
                <span className="text-4xl sm:text-5xl lg:text-7xl font-bold text-muted/50">{step.number}</span>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold mt-2 sm:mt-4 mb-1 sm:mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// Fallback projects for when no testimonials are marked for homepage
const fallbackProjects = [
  {
    company: "Bloom Floristry",
    category: "Website Design",
    result: "3x Conversion Rate",
    image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&q=75&fit=crop&fm=webp",
  },
  {
    company: "Urban Fitness",
    category: "Website Design", 
    result: "200% More Leads",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=75&fit=crop&fm=webp",
  },
  {
    company: "Coastal Realty",
    category: "Website Design",
    result: "4x Online Sales",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=75&fit=crop&fm=webp",
  },
];

const FeaturedWork = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const { data: testimonials } = useHomepageTestimonials();

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  // Transform testimonials to display format or use fallback
  const projects = testimonials && testimonials.length > 0 
    ? testimonials.map(t => {
        const websiteUrl = t.website_url || null;
        const thumbnail = websiteUrl
          ? `https://image.thum.io/get/width/1920/crop/1080/${websiteUrl}`
          : (() => {
              const vimeoId = t.video_url ? extractVimeoId(t.video_url) : null;
              return vimeoId 
                ? getVimeoThumbnail(vimeoId) 
                : "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=75&fit=crop&fm=webp";
            })();
        return {
          company: t.business_name,
          category: t.project_type,
          result: t.metric_1_value && t.metric_1_label 
            ? `${t.metric_1_value} ${t.metric_1_label}` 
            : t.short_description,
          image: thumbnail,
          websiteUrl,
        };
      })
    : fallbackProjects;

  return (
    <section ref={ref} className="section-padding bg-background overflow-hidden">
      <div className="container-tight">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 sm:gap-6 mb-10 sm:mb-16">
          <div>
            <ScrollReveal>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Selected Work
              </span>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-semibold tracking-tight mt-3 sm:mt-4">
                Businesses That Trust Sited to Keep Their Digital Presence Running
              </h2>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.2}>
            <Button variant="outline" size="lg" asChild>
              <Link to="/work">
                View All Projects <ArrowRight size={18} />
              </Link>
            </Button>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {projects.map((project, index) => {
            const hasWebsite = 'websiteUrl' in project && project.websiteUrl;
            const Wrapper = hasWebsite ? 'a' : Link;
            const wrapperProps = hasWebsite 
              ? { href: project.websiteUrl as string, target: "_blank", rel: "noopener noreferrer" }
              : { to: "/work" };

            return (
              <ScrollReveal key={project.company} delay={index * 0.05}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
                    <img
                      src={project.image}
                      alt={project.company}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-video object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                    {hasWebsite && (
                      <a
                        href={project.websiteUrl as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors duration-300"
                      >
                        <span className="opacity-60 group-hover:opacity-100 transition-opacity duration-300 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/80 text-white text-sm font-medium backdrop-blur-sm">
                          Open Site <ExternalLink size={14} />
                        </span>
                      </a>
                    )}
                  </div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {project.category}
                  </span>
                  <h3 className="text-lg sm:text-xl font-semibold mt-1 mb-1">{project.company}</h3>
                  <p className="text-sm sm:text-base text-accent font-medium">{project.result}</p>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// About/Trust Section — "Why Sited"
const About = () => {
  const { data: testimonials } = useHomepageTestimonials();
  const firstTestimonial = testimonials && testimonials.length > 0 ? testimonials[0] : null;

  return (
    <section className="section-padding bg-surface-elevated">
      <div className="container-tight">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div>
            <ScrollReveal>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Why Sited
              </span>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mt-3 sm:mt-4 mb-4 sm:mb-6">
                Why Businesses Choose Sited Over a Traditional Agency
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4 sm:mb-6">
                Traditional web agencies are slow, expensive, and disappear the moment your site goes live. Sited is different. We move fast — most builds are complete within days — and we stay with you after launch. Through our monthly Care Plan, your site is monitored, reviewed, and improved on an ongoing basis. You get a dedicated team who knows your site inside and out, without the cost of a full-time developer.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.25}>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-sm sm:text-base mb-1">Fast delivery, without cutting corners.</p>
                  <p className="text-sm text-muted-foreground">Most projects are completed within days, not months. You get a professional result without a drawn-out agency process.</p>
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base mb-1">Proactive care, not reactive panic.</p>
                  <p className="text-sm text-muted-foreground">Our Care Plan means we are reviewing your site every month — catching issues, recommending improvements, and implementing changes before you even know they are needed.</p>
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base mb-1">One accountable partner.</p>
                  <p className="text-sm text-muted-foreground">No handoffs to junior developers. No chasing emails. One team who built your site, knows it completely, and keeps it performing.</p>
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base mb-1">Transparent, predictable pricing.</p>
                  <p className="text-sm text-muted-foreground">You know what you are paying and what you are getting. No surprise invoices. No scope creep conversations.</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.2}>
            <div className="relative">
              <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-8">
                <Quote size={24} className="sm:w-8 sm:h-8 text-accent mb-4 sm:mb-6" />
                <p className="text-base sm:text-lg leading-relaxed mb-4 sm:mb-6">
                  "{firstTestimonial?.testimonial_text || "Sited transformed our entire digital presence. The website they built doesn't just look incredible—it's become our most effective sales tool."}"
                </p>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center">
                    <span className="font-semibold text-sm sm:text-base">
                      {firstTestimonial ? firstTestimonial.testimonial_author.split(' ').map(n => n[0]).join('') : 'SM'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">{firstTestimonial?.testimonial_author || "Sarah Mitchell"}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{firstTestimonial ? `${firstTestimonial.testimonial_role}, ${firstTestimonial.business_name}` : "Founder, Bloom Floristry"}</p>
                  </div>
                </div>
                <div className="flex gap-1 mt-3 sm:mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="sm:w-4 sm:h-4 fill-accent text-accent" />
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};


const CTA = () => {
  return (
    <section className="section-padding bg-foreground text-background">
      <div className="container-tight text-center">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4 sm:mb-6">
            Your site should be working as hard as you are.
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <p className="text-background/70 text-base sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10">
            Whether you need a new website built or you want to put an existing site on a Sited Care Plan, the next step is a free 20-minute conversation. We will tell you exactly what we can do and what it will cost — no obligation, no jargon.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="xl"
              className="bg-background text-foreground hover:bg-background/90"
              asChild
            >
              <Link to="/contact">
                Book Your Free Consultation <ArrowRight size={20} />
              </Link>
            </Button>
            <Button
              size="xl"
              variant="ghost"
              className="text-background hover:bg-background/10"
              asChild
            >
              <Link to="/work">
                View Our Work
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

const LegalLink = () => {
  return (
    <div className="py-4 text-center">
      <Link 
        to="/policies" 
        className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        Privacy Policy & Terms
      </Link>
    </div>
  );
};

const Index = () => {
  usePageSEO({
    title: "Sited | Professional Web Design, Built Fast & Maintained Monthly",
    description: "Sited builds professional websites, CRMs, client portals, and dashboards for growing businesses — then monitors and improves them every month through our Care Plan. Fast builds. Proactive care. One accountable team.",
  });

  return (
    <Layout>
      <Hero />
      <ChatSection />
      <HeroVideo />
      <FeaturedWork />
      <About />
      <Services />
      <Process />
      <CTA />
      <LegalLink />
    </Layout>
  );
};

export default Index;
