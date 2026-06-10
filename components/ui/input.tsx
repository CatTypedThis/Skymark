"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[8px] border border-white/14 bg-black/30 px-3 text-sm text-white outline-none transition placeholder:text-white/36 focus:border-cyan-200/55 focus:ring-2 focus:ring-cyan-200/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
