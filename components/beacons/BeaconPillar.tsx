"use client";

import type { CSSProperties } from "react";
import type { BeaconColorId, BeaconConfidence } from "@/lib/beacons/beacon-types";
import type {
  BeaconBaseTreatment,
  BeaconFrameSegment,
} from "@/lib/geospatial/beacon-frame";
import { getBeaconColor } from "@/lib/beacons/color-palette";
import { cn } from "@/lib/utils";

interface BeaconPillarProps {
  name: string;
  color: BeaconColorId;
  confidence: BeaconConfidence;
  xPercent: number;
  bottomPercent?: number;
  segment?: BeaconFrameSegment;
  baseTreatment?: BeaconBaseTreatment;
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
  bottomPercent = 24,
  segment = "middle",
  baseTreatment = "hidden",
  statusLabel,
  selected = false,
  preview = false,
  onSelect,
}: BeaconPillarProps) {
  const beaconColor = getBeaconColor(color);
  const lowConfidence = confidence === "low" || confidence === "unknown";
  const isBaseVisible = baseTreatment === "visible";
  const isBaseSoft = baseTreatment === "soft";

  return (
    <button
      type="button"
      className={cn(
        "beacon-pillar",
        `beacon-pillar--segment-${segment}`,
        isBaseVisible && "beacon-pillar--base-visible",
        isBaseSoft && "beacon-pillar--base-soft",
        !isBaseVisible && !isBaseSoft && "beacon-pillar--base-hidden",
        segment === "upper" && "beacon-pillar--upper",
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
      {baseTreatment !== "hidden" ? (
        <span className="beacon-base-ring" aria-hidden="true" />
      ) : null}
      <span className="beacon-label">
        <strong>{name}</strong>
        <span>{preview ? "Preview" : statusLabel ?? confidence}</span>
      </span>
    </button>
  );
}
