import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-neutral-900/90 dark:bg-white/90 text-white dark:text-neutral-900 backdrop-blur-lg border border-white/10 dark:border-neutral-900/10 hover:bg-neutral-800/95 dark:hover:bg-white shadow-lg shadow-black/10 dark:shadow-black/20",
        destructive: "bg-destructive/90 text-destructive-foreground backdrop-blur-lg border border-white/10 hover:bg-destructive/80",
        outline: "border border-neutral-200/60 dark:border-white/10 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-lg hover:bg-neutral-100/60 dark:hover:bg-neutral-700/60 hover:border-neutral-300/60 dark:hover:border-white/20",
        secondary: "bg-neutral-100/80 dark:bg-neutral-800/80 text-secondary-foreground backdrop-blur-lg border border-neutral-200/50 dark:border-white/5 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80",
        ghost: "hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 hover:backdrop-blur-lg",
        link: "text-foreground underline-offset-4 hover:underline",
        hero: "bg-neutral-900/95 dark:bg-white/95 text-white dark:text-neutral-900 backdrop-blur-xl border border-white/10 dark:border-neutral-900/10 hover:bg-neutral-800 dark:hover:bg-white shadow-xl shadow-black/15 dark:shadow-black/25 hover:scale-[1.02]",
        "hero-outline": "border-2 border-neutral-900/80 dark:border-white/80 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-lg text-foreground hover:bg-neutral-900 dark:hover:bg-white hover:text-white dark:hover:text-neutral-900",
        glass: "bg-white/60 dark:bg-neutral-800/60 backdrop-blur-xl border border-white/50 dark:border-white/10 text-foreground hover:bg-white/80 dark:hover:bg-neutral-700/70 shadow-lg shadow-black/5 dark:shadow-black/20",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-4",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
