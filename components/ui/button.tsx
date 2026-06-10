"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60",
  {
    variants: {
      variant: {
        primary:
          "border border-cyan-200/45 bg-cyan-200/18 text-white shadow-[0_0_28px_rgba(110,243,220,0.18)] hover:bg-cyan-200/25",
        secondary:
          "border border-white/14 bg-white/[0.07] text-white/82 hover:bg-white/[0.11]",
        ghost: "text-white/76 hover:bg-white/[0.08]",
        danger:
          "border border-rose-300/35 bg-rose-400/12 text-rose-100 hover:bg-rose-400/18",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4",
        icon: "h-11 w-11 p-0",
        circle: "h-16 w-16 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";
