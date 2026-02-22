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

export const FEATURE_INFO: Record<string, FeatureDetail> = {
  // Blue
  "Professional website": {
    title: "Professional Website",
    description: "A fully custom-designed website built from scratch — no templates, no drag-and-drop builders. Hand-coded for speed, quality, and brand alignment.",
    benefit: "Websites that look like they cost $10k+ but at a fraction of the price.",
  },
  "High-converting funnel": {
    title: "High-Converting Funnel",
    description: "Strategic page flow designed to guide visitors from landing to enquiry. Proven layouts, persuasive copy frameworks, and trust signals built in.",
    benefit: "Average 3-5x higher conversion rate than standard template websites.",
  },
  "Lead capture forms": {
    title: "Lead Capture Forms",
    description: "Conversion-optimised forms that capture leads with minimal friction. Includes validation, spam protection, and instant email notifications.",
    benefit: "Turn visitors into paying customers with forms built to convert.",
  },
  "Lifetime hosting": {
    title: "Lifetime Hosting",
    description: "Your website is hosted for life — no monthly hosting fees, no renewal surprises. Fast, secure, and always online.",
    benefit: "Save $1,200+ over 5 years compared to traditional hosting plans.",
  },
  "Industry-specific SEO": {
    title: "Industry-Specific SEO Optimisation",
    description: "SEO tailored to your industry with targeted keywords, local search setup, Google Business Profile, meta tags, sitemap, and Core Web Vitals.",
    benefit: "Get found on Google by the right people in your area from day one.",
  },
  "Calendar integration": {
    title: "Calendar Integration",
    description: "Built-in booking system with real-time availability, timezone support, and automatic reminders. Clients book directly from your site.",
    benefit: "Eliminate back-and-forth scheduling. Let clients book 24/7.",
  },
  "Email integration": {
    title: "Email Integration",
    description: "Automated email notifications for form submissions, booking confirmations, and lead follow-ups. Never miss a lead again.",
    benefit: "Instant response = 7x more likely to qualify a lead.",
  },
  // Gold
  "Everything in Blue": {
    title: "Everything in Blue, Plus More",
    description: "Gold includes every feature from the Blue package — professional website, funnel, lead capture, hosting, SEO, and all integrations — plus powerful business tools.",
    benefit: "The foundation of Blue, supercharged with tools to grow your business.",
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
  "Extra SEO infrastructure": {
    title: "Extra SEO Infrastructure",
    description: "On-page SEO for all pages, keyword research, competitor analysis, local SEO setup, and Google Business Profile optimisation — going beyond the basics.",
    benefit: "Rank higher than competitors in your local area within weeks.",
  },
  "Payment integration": {
    title: "Payment Integration",
    description: "Accept payments directly through your website with Stripe. Invoicing, subscriptions, and one-time payments — all configured and ready to go.",
    benefit: "Get paid faster with seamless online payment processing.",
  },
  // Platinum
  "Everything in Gold": {
    title: "Everything in Gold, Plus More",
    description: "Platinum includes every feature from Gold — admin dashboard, CRM, payments, SEO, and all integrations — plus exclusive premium tools.",
    benefit: "The ultimate package for businesses serious about dominating their market.",
  },
  "Client portal": {
    title: "Client Portal",
    description: "Full-featured client portal with real-time project tracker, file uploads, request management, payment history, and direct messaging.",
    benefit: "Professional client experience that builds trust and retention.",
  },
  "Built-in AI chatbot": {
    title: "Built-in AI Chatbot",
    description: "An intelligent chatbot trained on your business that answers questions, captures leads, and books appointments — even while you sleep. 24/7 automated sales.",
    benefit: "Never miss a lead again. Your AI assistant works around the clock.",
  },
  "Premium SEO infrastructure": {
    title: "Premium SEO Infrastructure",
    description: "Advanced technical SEO, local landing pages for every suburb, schema markup, content strategy, backlink plan, and ongoing optimisation guidance.",
    benefit: "Dominate search results across your entire service region.",
  },
  "Any custom integrations": {
    title: "Any Custom Integrations",
    description: "Connect any tool, any platform, any API. From Stripe subscriptions to custom webhooks, Zapier, CRMs, and third-party platforms — fully configured.",
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
