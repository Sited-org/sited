import { cn } from "@/lib/utils";
import { ScrollReveal } from "./ScrollReveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
}

export const SectionHeading = ({
  eyebrow,
  title,
  description,
  className,
  align = "center",
}: SectionHeadingProps) => {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "",
        className
      )}
    >
      {eyebrow && (
        <ScrollReveal delay={0}>
          <span className="inline-block text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
            {eyebrow}
          </span>
        </ScrollReveal>
      )}
      <ScrollReveal delay={0.1}>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-balance leading-tight">
          {title}
        </h2>
      </ScrollReveal>
      {description && (
        <ScrollReveal delay={0.2}>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            {description}
          </p>
        </ScrollReveal>
      )}
    </div>
  );
};
