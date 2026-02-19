import { Info } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export interface FeatureDetail {
  title: string;
  description: string;
  benefit: string;
}

// Comprehensive info packs for every feature across all tiers
export const FEATURE_INFO: Record<string, FeatureDetail> = {
  // Basic Blue
  "Professional frontend website": {
    title: "Professional Frontend Website",
    description: "A fully custom-designed website built from scratch — no templates, no drag-and-drop builders. Hand-coded for speed, quality, and brand alignment.",
    benefit: "Websites that look like they cost $10k+ but at a fraction of the price.",
  },
  "Mobile responsive design": {
    title: "Mobile Responsive Design",
    description: "Your site adapts flawlessly to every screen size — phones, tablets, laptops, and desktops. Every breakpoint is tested and perfected.",
    benefit: "Over 60% of web traffic is mobile. Lose mobile users, lose revenue.",
  },
  "Contact forms": {
    title: "Smart Contact Forms",
    description: "Conversion-optimised forms that capture leads with minimal friction. Includes validation, spam protection, and instant email notifications.",
    benefit: "Turn visitors into paying customers with forms built to convert.",
  },
  "SEO foundations": {
    title: "SEO Foundations",
    description: "Technical SEO setup including meta tags, Open Graph, structured data, sitemap, robots.txt, and Core Web Vitals optimisation.",
    benefit: "Get found on Google from day one with a technically sound foundation.",
  },
  "Email integration": {
    title: "Email Integration",
    description: "Automated email notifications for form submissions, booking confirmations, and lead follow-ups. Never miss a lead again.",
    benefit: "Instant response = 7x more likely to qualify a lead.",
  },
  "Calendar integration": {
    title: "Calendar Integration",
    description: "Built-in booking system with real-time availability, timezone support, and automatic reminders. Clients book directly from your site.",
    benefit: "Eliminate back-and-forth scheduling. Let clients book 24/7.",
  },
  // Gold
  "High-converting website": {
    title: "High-Converting Website",
    description: "Data-driven design principles, strategic CTA placement, trust signals, and persuasive copywriting frameworks built into every page.",
    benefit: "Average 3-5x higher conversion rate than standard template websites.",
  },
  "Admin dashboard": {
    title: "Admin Dashboard",
    description: "A powerful backend dashboard to manage your leads, track project progress, view analytics, and control every aspect of your website.",
    benefit: "Full visibility and control over your business — all in one place.",
  },
  "Lead management CRM": {
    title: "Lead Management CRM",
    description: "Track every lead from first contact to closed deal. Includes status tracking, notes, activity logs, and automated follow-up reminders.",
    benefit: "Businesses using CRM see 29% increase in sales on average.",
  },
  "Basic SEO package": {
    title: "Basic SEO Package",
    description: "On-page SEO for all pages, keyword research, competitor analysis, local SEO setup, and Google Business Profile optimisation.",
    benefit: "Rank higher than competitors in your local area within weeks.",
  },
  "All integrations included": {
    title: "All Integrations Included",
    description: "Google Analytics, Facebook Pixel, email marketing platforms, payment processors, and social media — all connected and configured.",
    benefit: "A fully connected tech stack from day one, no extra costs.",
  },
  "Client portal access": {
    title: "Client Portal Access",
    description: "Your own private portal to view project progress, submit requests, manage payments, and communicate directly with your project team.",
    benefit: "Complete transparency and real-time visibility into your project.",
  },
  // Platinum
  "Highest quality design": {
    title: "Highest Quality Design",
    description: "Award-level design with custom illustrations, animations, micro-interactions, and premium typography. We push boundaries to create something unforgettable.",
    benefit: "Stand out in your industry with a website that becomes a competitive advantage.",
  },
  "Premium SEO package": {
    title: "Premium SEO Package",
    description: "Advanced technical SEO, local landing pages for every suburb, schema markup, content strategy, backlink plan, and ongoing optimisation guidance.",
    benefit: "Dominate search results across your entire service region.",
  },
  "Admin dashboard & CRM": {
    title: "Admin Dashboard & CRM",
    description: "Everything from the Gold tier plus advanced analytics, sales pipeline tracking, automated reports, and team collaboration tools.",
    benefit: "Enterprise-grade management tools at small business prices.",
  },
  "Client portal": {
    title: "Client Portal",
    description: "Full-featured client portal with real-time project tracker, file uploads, request management, payment history, and direct messaging.",
    benefit: "Professional client experience that builds trust and retention.",
  },
  "All integrations & APIs": {
    title: "All Integrations & APIs",
    description: "Everything in Gold plus custom API integrations, advanced automation, Stripe subscriptions, webhook configurations, and third-party platform connections.",
    benefit: "A future-proof tech stack that grows with your business.",
  },
  "Priority support & delivery": {
    title: "Priority Support & Delivery",
    description: "Jump to the front of the queue with dedicated project management, faster turnaround times, priority bug fixes, and direct Slack/WhatsApp access.",
    benefit: "Your project is our #1 priority. Faster delivery, faster results.",
  },
};

interface FeatureWithInfoProps {
  feature: string;
  compact?: boolean;
}

const FeatureWithInfo = ({ feature, compact = false }: FeatureWithInfoProps) => {
  const info = FEATURE_INFO[feature];

  if (!info) {
    return <span>{feature}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{feature}</span>
      <HoverCard openDelay={100} closeDelay={50}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center text-muted-foreground hover:text-sited-blue transition-colors flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Info size={compact ? 12 : 14} />
          </button>
        </HoverCardTrigger>
        <HoverCardContent
          className="w-72 p-4"
          side="top"
          align="center"
          sideOffset={8}
        >
          <div className="space-y-2">
            <h4 className="text-sm font-black text-foreground">{info.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{info.description}</p>
            <div className="pt-1 border-t border-border">
              <p className="text-xs font-semibold text-sited-blue">{info.benefit}</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </span>
  );
};

export default FeatureWithInfo;
