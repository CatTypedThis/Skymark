"use client";

import type { BeaconColorId, BeaconConfidence, BeaconRecord } from "@/lib/beacons/beacon-types";
import type { LocationFix } from "@/lib/sensors/use-geolocation";
import { bearingBetween } from "@/lib/geospatial/bearing";
import { mapBearingToOverlayX } from "@/lib/geospatial/overlay-position";
import { resolveBeaconFrame } from "@/lib/geospatial/beacon-frame";
import { resolveRenderableAnchor } from "@/lib/beacons/renderable-anchor";
import { anchorStatusLabel } from "@/lib/beacons/anchor-presentation";
import { BeaconPillar } from "./BeaconPillar";
import { OffscreenIndicator } from "./OffscreenIndicator";

/**
 * The preview beacon is a centered camera anchor: always horizontally visible,
 * so only pitch drives its vertical framing. Resolves the frame once and hands
 * the result to BeaconPillar (same behavior as saved beacons, per ticket 03).
 */
function PreviewPillar({ preview, pitch }: { preview: PreviewBeacon; pitch: number | null }) {
  const frame = resolveBeaconFrame({
    horizontalVisible: true,
    pitchDegrees: pitch,
    baseVisibility: "approximated",
  });
  return (
    <BeaconPillar
      name="Preview beacon"
      color={preview.color}
      confidence={preview.confidence}
      xPercent={50}
      bottomPercent={frame.bottomPercent}
      baseStrength={frame.baseStrength}
      verticalHint={frame.verticalHint}
      sourceLabel={anchorStatusLabel("camera", preview.confidence).split(" / ")[0]}
      statusOverride="Preview"
      preview
    />
  );
}

export interface PreviewBeacon {
  color: BeaconColorId;
  confidence: BeaconConfidence;
}

interface BeaconOverlayProps {
  beacons: BeaconRecord[];
  preview: PreviewBeacon | null;
  location: LocationFix | null;
  heading: number | null;
  pitch: number | null;
  selectedBeaconId: string | null;
  onSelectBeacon: (beaconId: string) => void;
}

/**
 * Render the preview and saved beacons as tall skyward columns whose visible
 * portion is driven by the shared frame resolver. Preview and saved beacons use
 * the same frame-resolution behavior (SPEC-004 §8): a horizontal check
 * (mapBearingToOverlayX) feeds resolveBeaconFrame, which combines horizontal
 * visibility, pitch availability, and base visibility into the presentation.
 */
export function BeaconOverlay({
  beacons,
  preview,
  location,
  heading,
  pitch,
  selectedBeaconId,
  onSelectBeacon,
}: BeaconOverlayProps) {
  const canRenderDirectional = location !== null && heading !== null;

  return (
    <div className="beacon-overlay" aria-label="Beacon overlay">
      {preview ? (
        <PreviewPillar preview={preview} pitch={pitch} />
      ) : null}

      {canRenderDirectional
        ? beacons.map((beacon) => {
            const bearing = bearingBetween(
              location.latitude,
              location.longitude,
              beacon.latitude,
              beacon.longitude,
            );
            const overlay = mapBearingToOverlayX(bearing, heading);
            const renderable = resolveRenderableAnchor(beacon, overlay.visible, pitch);

            if (!renderable.frame.inView) {
              return (
                <OffscreenIndicator
                  key={beacon.id}
                  name={beacon.name}
                  color={beacon.color}
                  direction={overlay.direction === "left" ? "left" : "right"}
                  verticalHint={renderable.frame.verticalHint}
                />
              );
            }

            return (
              <BeaconPillar
                key={beacon.id}
                name={beacon.name}
                color={beacon.color}
                confidence={beacon.confidence}
                xPercent={overlay.xPercent}
                bottomPercent={renderable.frame.bottomPercent}
                baseStrength={renderable.frame.baseStrength}
                verticalHint={renderable.frame.verticalHint}
                sourceLabel={renderable.sourceLabel}
                selected={selectedBeaconId === beacon.id}
                onSelect={() => onSelectBeacon(beacon.id)}
              />
            );
          })
        : null}
    </div>
  );
}
