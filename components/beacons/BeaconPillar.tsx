"use client";

import type { CSSProperties } from "react";
import type { BeaconColorId, BeaconConfidence } from "@/lib/beacons/beacon-types";
import { getBeaconColor } from "@/lib/beacons/color-palette";
import { cn } from "@/lib/utils";

interface BeaconPillarProps {
  name: string;
  color: BeaconColorId;
  confidence: BeaconConfidence;
  xPercent: number;
  bottomPercent?: number;
  selected?: boolean;
  preview?: boolean;
  onSelect?: () => void;
}

export function BeaconPillar({
  name,
  color,
  confidence,
  xPercent,
  bottomPercent = 24,
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
          left: `${xPercent}%`,
          bottom: `${bottomPercent}%`,
        } as CSSProperties
      }
      onClick={onSelect}
      aria-label={`${preview ? "Preview" : "Saved"} beacon ${name}`}
    >
      <span className="beacon-cap" aria-hidden="true" />
      <span className="beacon-label">
        <strong>{name}</strong>
        <span>{preview ? "Preview" : confidence}</span>
      </span>
    </button>
  );
}
