"use client";

import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import type { CSSProperties } from "react";
import type { BeaconColorId } from "@/lib/beacons/beacon-types";
import { getBeaconColor } from "@/lib/beacons/color-palette";
import { cn } from "@/lib/utils";

interface OffscreenIndicatorProps {
  name: string;
  color: BeaconColorId;
  direction: "left" | "right";
  /** Optional vertical hint from resolveBeaconFrame(); null hides the cue. */
  verticalHint?: "raise" | "lower" | "center" | null;
}

export function OffscreenIndicator({ name, color, direction, verticalHint }: OffscreenIndicatorProps) {
  const beaconColor = getBeaconColor(color);
  const VerticalIcon =
    verticalHint === "raise" ? ChevronUp : verticalHint === "lower" ? ChevronDown : null;

  return (
    <div
      className={cn("offscreen-indicator", direction === "left" ? "left" : "right")}
      style={{ "--beam": beaconColor.hex } as CSSProperties}
      aria-label={`${name} is off screen to the ${direction}${VerticalIcon ? `, ${verticalHint === "raise" ? "look up" : "look down"}` : ""}`}
    >
      {direction === "left" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      <span>{name}</span>
      {VerticalIcon ? <VerticalIcon size={16} aria-hidden="true" /> : null}
    </div>
  );
}
