"use client";

import type { BeaconColorId, BeaconConfidence, BeaconRecord } from "@/lib/beacons/beacon-types";
import type { BaseVisibility } from "@/lib/beacons/beacon-types";
import type { LocationFix } from "@/lib/sensors/use-geolocation";
import { bearingBetween } from "@/lib/geospatial/bearing";
import { mapBearingToOverlayX } from "@/lib/geospatial/overlay-position";
import { resolveBeaconFrame } from "@/lib/geospatial/beacon-frame";
import type { BeaconFrameResult } from "@/lib/geospatial/beacon-frame";
import { resolveRenderableAnchor } from "@/lib/beacons/renderable-anchor";
import { BeaconPillar } from "./BeaconPillar";
import { OffscreenIndicator } from "./OffscreenIndicator";

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
 * Resolve the preview pillar's frame using the SAME helper as saved beacons,
 * so the preview and saved beacons fade identically (no threshold mismatch).
 */
function previewFrame(
  pitch: number | null,
  baseVisibility: BaseVisibility,
): Pick<BeaconFrameResult, "bottomPercent" | "baseStrength"> {
  const frame = resolveBeaconFrame({
    horizontalVisible: true,
    pitchDegrees: pitch,
    baseVisibility,
  });
  return { bottomPercent: frame.bottomPercent, baseStrength: frame.baseStrength };
}

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
        (() => {
          const { bottomPercent, baseStrength } = previewFrame(pitch, "approximated");
          return (
            <BeaconPillar
              name="Preview beacon"
              color={preview.color}
              confidence={preview.confidence}
              xPercent={50}
              bottomPercent={bottomPercent}
              baseStrength={baseStrength}
              statusLabel="Approximate"
              preview
            />
          );
        })()
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
                statusLabel={renderable.statusLabel}
                selected={selectedBeaconId === beacon.id}
                onSelect={() => onSelectBeacon(beacon.id)}
              />
            );
          })
        : null}
    </div>
  );
}
