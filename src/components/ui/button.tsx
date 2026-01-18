import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-neutral-800/70 dark:bg-neutral-700/70 text-white backdrop-blur-xl border border-white/10 hover:bg-neutral-700/80 dark:hover:bg-neutral-600/80 shadow-lg shadow-black/20",
        destructive: "bg-red-900/70 text-white backdrop-blur-xl border border-red-500/20 hover:bg-red-800/80 shadow-lg shadow-red-900/20",
        outline: "border border-neutral-300/40 dark:border-white/10 bg-neutral-100/30 dark:bg-neutral-800/30 backdrop-blur-xl text-foreground hover:bg-neutral-200/40 dark:hover:bg-neutral-700/40",
        secondary: "bg-neutral-200/40 dark:bg-neutral-700/40 text-foreground backdrop-blur-xl border border-neutral-300/30 dark:border-white/10 hover:bg-neutral-300/50 dark:hover:bg-neutral-600/50",
        ghost: "hover:bg-neutral-200/30 dark:hover:bg-neutral-700/30 backdrop-blur-lg text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        hero: "bg-neutral-800/75 dark:bg-neutral-700/75 text-white backdrop-blur-xl border border-white/15 hover:bg-neutral-700/85 dark:hover:bg-neutral-600/85 shadow-xl shadow-black/25 hover:scale-[1.02]",
        "hero-outline": "border border-neutral-400/40 dark:border-white/20 bg-neutral-100/30 dark:bg-neutral-800/30 backdrop-blur-xl text-foreground hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50",
        glass: "bg-neutral-800/60 dark:bg-neutral-700/60 text-white backdrop-blur-xl border border-white/10 hover:bg-neutral-700/70 dark:hover:bg-neutral-600/70 shadow-lg shadow-black/20",
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
