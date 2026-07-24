"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { BeaconColorId } from "@/lib/beacons/beacon-types";
import { getBeaconColor } from "@/lib/beacons/color-palette";
import { cn } from "@/lib/utils";

/**
 * Which screen edge the indicator pins to. "center" means the beacon is inside
 * the horizontal FOV but vertically out of frame — no turn is needed, so no
 * horizontal chevron is shown, only a vertical cue. Decoupled from the bearing
 * direction by resolveOffscreenGuidance (Ticket 04).
 */
export type IndicatorEdge = "left" | "right" | "center";

/**
 * Actionable vertical cue carried from the frame resolver (raise/lower). null
 * when only a horizontal turn is needed.
 */
export type IndicatorVerticalCue = "raise" | "lower" | null;

interface OffscreenIndicatorProps {
  name: string;
  color: BeaconColorId;
  edge: IndicatorEdge;
  /** Vertical cue from the frame resolver, carried so the user knows which way. */
  verticalCue?: IndicatorVerticalCue;
  /**
   * Vertical offset (in viewport-height percent) applied on top of the base
   * line, so multiple indicators sharing one edge stagger instead of overlap.
   */
  staggerOffsetVh?: number;
}

export function OffscreenIndicator({
  name,
  color,
  edge,
  verticalCue,
  staggerOffsetVh = 0,
}: OffscreenIndicatorProps) {
  const beaconColor = getBeaconColor(color);
  const hintGlyph = verticalCue === "raise" ? "↑" : verticalCue === "lower" ? "↓" : null;
  const hasTurn = edge === "left" || edge === "right";

  // Short, both-axis label. AC: "Accessible labels communicate both horizontal
  // and vertical direction when both are present."
  const parts: string[] = [`${name} is off screen`];
  if (hasTurn) parts.push(`to the ${edge}`);
  if (verticalCue === "raise") parts.push("look up");
  else if (verticalCue === "lower") parts.push("look down");

  return (
    <div
      className={cn(
        "offscreen-indicator",
        edge,
        verticalCue && `offscreen-indicator--hint-${verticalCue}`,
      )}
      style={
        {
          "--beam": beaconColor.hex,
          ...(staggerOffsetVh ? { "--stagger": `${staggerOffsetVh}vh` } : {}),
        } as CSSProperties
      }
      aria-label={parts.join(", ")}
    >
      {edge === "left" ? <ChevronLeft size={18} aria-hidden="true" /> : null}
      {edge === "right" ? <ChevronRight size={18} aria-hidden="true" /> : null}
      <span>{name}</span>
      {hintGlyph ? <span className="offscreen-hint" aria-hidden="true">{hintGlyph}</span> : null}
    </div>
  );
}
