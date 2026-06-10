"use client";

import type { BeaconColorId, BeaconConfidence, BeaconRecord } from "@/lib/beacons/beacon-types";
import type { LocationFix } from "@/lib/sensors/use-geolocation";
import { bearingBetween } from "@/lib/geospatial/bearing";
import { mapBearingToOverlayX } from "@/lib/geospatial/overlay-position";
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

function pitchBottomPercent(pitch: number | null) {
  if (pitch === null) {
    return 24;
  }

  const clamped = Math.max(-45, Math.min(55, pitch));
  return Math.max(12, Math.min(38, 24 - clamped * 0.22));
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
  const bottomPercent = pitchBottomPercent(pitch);

  return (
    <div className="beacon-overlay" aria-label="Beacon overlay">
      {preview ? (
        <BeaconPillar
          name="Preview beacon"
          color={preview.color}
          confidence={preview.confidence}
          xPercent={50}
          bottomPercent={bottomPercent}
          preview
        />
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
            if (!overlay.visible) {
              return (
                <OffscreenIndicator
                  key={beacon.id}
                  name={beacon.name}
                  color={beacon.color}
                  direction={overlay.direction === "left" ? "left" : "right"}
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
                bottomPercent={bottomPercent}
                selected={selectedBeaconId === beacon.id}
                onSelect={() => onSelectBeacon(beacon.id)}
              />
            );
          })
        : null}
    </div>
  );
}
