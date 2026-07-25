"use client";

import type { CSSProperties } from "react";
import type { BeaconColorId, BeaconConfidence } from "@/lib/beacons/beacon-types";
import type { VerticalHint } from "@/lib/geospatial/beacon-frame";
import { getBeaconColor } from "@/lib/beacons/color-palette";
import { cn } from "@/lib/utils";

interface BeaconPillarProps {
  name: string;
  color: BeaconColorId;
  confidence: BeaconConfidence;
  xPercent: number;
  /**
   * Vertical offset of the column's bottom edge, as a percentage of the overlay
   * height, from resolveBeaconFrame. The column itself is much taller than the
   * viewport (COLUMN_VH_PERCENT), so a negative offset still shows the shaft.
   */
  bottomPercent: number;
  /**
   * Continuous 0..1 base glow strength from resolveBeaconFrame. Drives the
   * --base-strength CSS var so the base fades smoothly rather than snapping.
   */
  baseStrength: number;
  /** Optional directional cue from the frame resolver (raise/lower/center). */
  verticalHint?: VerticalHint;
  /** Provenance label (e.g. "Approximate") shown in the label status line. */
  sourceLabel?: string;
  /** When set, replaces the confidence text in the status line (preview state). */
  statusOverride?: string;
  selected?: boolean;
  preview?: boolean;
  onSelect?: () => void;
}

export function BeaconPillar({
  name,
  color,
  confidence,
  xPercent,
  bottomPercent,
  baseStrength,
  verticalHint,
  sourceLabel,
  statusOverride,
  selected = false,
  preview = false,
  onSelect,
}: BeaconPillarProps) {
  const beaconColor = getBeaconColor(color);
  const lowConfidence = confidence === "low" || confidence === "unknown";
  const statusLine = statusOverride ?? sourceLabel ?? confidence;

  return (
    <button
      type="button"
      className={cn(
        "beacon-pillar",
        selected && "beacon-pillar--selected",
        preview && "beacon-pillar--preview",
        lowConfidence && "beacon-pillar--soft",
        verticalHint && `beacon-pillar--hint-${verticalHint}`,
      )}
      style={
        {
          "--beam": beaconColor.hex,
          "--beam-soft": beaconColor.soft,
          "--base-strength": baseStrength,
          left: `${xPercent}%`,
          bottom: `${bottomPercent}%`,
        } as CSSProperties
      }
      onClick={onSelect}
      aria-label={`${preview ? "Preview" : "Saved"} beacon ${name}`}
    >
      <span className="beacon-shaft" aria-hidden="true" />
      <span className="beacon-cap" aria-hidden="true" />
      <span className="beacon-label">
        <strong>{name}</strong>
        <span>{statusLine}</span>
      </span>
      {verticalHint ? (
        <span className="beacon-hint" aria-hidden="true">
          {verticalHint === "raise" ? "↑" : verticalHint === "lower" ? "↓" : "•"}
        </span>
      ) : null}
    </button>
  );
}
