"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { BeaconColorId } from "@/lib/beacons/beacon-types";
import type { VerticalHint } from "@/lib/geospatial/beacon-frame";
import { getBeaconColor } from "@/lib/beacons/color-palette";
import { cn } from "@/lib/utils";

interface OffscreenIndicatorProps {
  name: string;
  color: BeaconColorId;
  direction: "left" | "right";
  /** Vertical cue from the frame resolver, carried so the user knows which way. */
  verticalHint?: VerticalHint;
}

export function OffscreenIndicator({ name, color, direction, verticalHint }: OffscreenIndicatorProps) {
  const beaconColor = getBeaconColor(color);
  const hintGlyph =
    verticalHint === "raise" ? "↑" : verticalHint === "lower" ? "↓" : null;

  return (
    <div
      className={cn(
        "offscreen-indicator",
        direction === "left" ? "left" : "right",
        verticalHint && `offscreen-indicator--hint-${verticalHint}`,
      )}
      style={{ "--beam": beaconColor.hex } as CSSProperties}
      aria-label={`${name} is off screen to the ${direction}${hintGlyph ? `, ${verticalHint === "raise" ? "look up" : "look down"}` : ""}`}
    >
      {direction === "left" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      <span>{name}</span>
      {hintGlyph ? <span className="offscreen-hint" aria-hidden="true">{hintGlyph}</span> : null}
    </div>
  );
}
