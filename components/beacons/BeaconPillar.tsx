"use client";

import type { CSSProperties } from "react";
import type { BeaconColorId, BeaconConfidence } from "@/lib/beacons/beacon-types";
import { getBeaconColor } from "@/lib/beacons/color-palette";
import { BASE_BOTTOM_PERCENT } from "@/lib/geospatial/beacon-frame";
import { cn } from "@/lib/utils";

interface BeaconPillarProps {
  name: string;
  color: BeaconColorId;
  confidence: BeaconConfidence;
  xPercent: number;
  /** Live continuous vertical offset of the column's bottom edge (percent). */
  bottomPercent?: number;
  /** Continuous 0..1 base glow strength. Drives --base-strength. */
  baseStrength?: number;
  /** Compact source/confidence status, e.g. "Approximate / Low". */
  statusLabel?: string;
  selected?: boolean;
  preview?: boolean;
  onSelect?: () => void;
}

export function BeaconPillar({
  name,
  color,
  confidence,
  xPercent,
  bottomPercent = BASE_BOTTOM_PERCENT,
  baseStrength = 1,
  statusLabel,
  selected = false,
  preview = false,
  onSelect,
}: BeaconPillarProps) {
  const beaconColor = getBeaconColor(color);
  const lowConfidence = confidence === "low" || confidence === "unknown";

  return (
    <button
      type="button"
      className={cn(
        "beacon-pillar",
        selected && "beacon-pillar--selected",
        preview && "beacon-pillar--preview",
        lowConfidence && "beacon-pillar--soft",
      )}
      style={
        {
          "--beam": beaconColor.hex,
          "--beam-soft": beaconColor.soft,
          "--base-strength": baseStrength.toFixed(3),
          "--column-vh": "300%",
          left: `${xPercent}%`,
          bottom: `${bottomPercent}%`,
          height: "var(--column-vh)",
        } as CSSProperties
      }
      onClick={onSelect}
      aria-label={`${preview ? "Preview" : "Saved"} beacon ${name}`}
    >
      <span className="beacon-cap" aria-hidden="true" />
      {/* Always rendered; opacity is driven by --base-strength so the base
          glow fades smoothly as the camera pans, with no mount/unmount snap. */}
      <span className="beacon-base-ring" aria-hidden="true" />
      <span className="beacon-label">
        <strong>{name}</strong>
        <span>{preview ? "Preview" : statusLabel ?? confidence}</span>
      </span>
    </button>
  );
}
