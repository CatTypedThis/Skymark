"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { BeaconColorId } from "@/lib/beacons/beacon-types";
import { getBeaconColor } from "@/lib/beacons/color-palette";
import { cn } from "@/lib/utils";

interface OffscreenIndicatorProps {
  name: string;
  color: BeaconColorId;
  direction: "left" | "right";
}

export function OffscreenIndicator({ name, color, direction }: OffscreenIndicatorProps) {
  const beaconColor = getBeaconColor(color);

  return (
    <div
      className={cn("offscreen-indicator", direction === "left" ? "left" : "right")}
      style={{ "--beam": beaconColor.hex } as CSSProperties}
      aria-label={`${name} is off screen to the ${direction}`}
    >
      {direction === "left" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      <span>{name}</span>
    </div>
  );
}
