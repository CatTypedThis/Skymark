"use client";

import type { BeaconColorId, BeaconConfidence, BeaconRecord } from "@/lib/beacons/beacon-types";
import type { LocationFix } from "@/lib/sensors/use-geolocation";
import { resolveBeaconRenderBearing } from "@/lib/geospatial/beacon-render-bearing";
import { mapBearingToOverlayX } from "@/lib/geospatial/overlay-position";
import { resolveBeaconFrame } from "@/lib/geospatial/beacon-frame";
import { resolveRenderableAnchor } from "@/lib/beacons/renderable-anchor";
import { anchorStatusLabel } from "@/lib/beacons/anchor-presentation";
import {
  resolveOffscreenGuidance,
  resolveStaggerOffset,
} from "@/lib/geospatial/offscreen-guidance";
import { BeaconPillar } from "./BeaconPillar";
import { OffscreenIndicator } from "./OffscreenIndicator";

/**
 * The preview beacon is a centered camera anchor: always horizontally visible,
 * so only pitch drives its vertical framing. Resolves the frame once. When the
 * frame has no useful segment (vertically out of frame), it renders the
 * off-screen guidance instead of an in-frame column (Ticket 04).
 */
function PreviewPillar({ preview, pitch }: { preview: PreviewBeacon; pitch: number | null }) {
  const frame = resolveBeaconFrame({
    horizontalVisible: true,
    pitchDegrees: pitch,
    baseVisibility: "approximated",
  });

  if (!frame.inView) {
    const guidance = resolveOffscreenGuidance("center", true, frame.verticalHint);
    return (
      <OffscreenIndicator
        name="Preview beacon"
        color={preview.color}
        edge={guidance.edge}
        verticalCue={guidance.verticalCue}
      />
    );
  }

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
 *
 * A beacon with no useful segment in the estimated frame renders the
 * off-screen indicator instead of an in-frame column (Ticket 04). The
 * indicator's edge and vertical cue come from resolveOffscreenGuidance, which
 * decouples the horizontal turn (only when outside the FOV) from the vertical
 * cue (raise/lower from the frame resolver). Multiple indicators sharing an
 * edge stagger vertically so they stay readable.
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

  // Pre-compute each beacon's overlay position, frame, and guidance so we can
  // assign stagger offsets per edge (left / right / center) without re-running
  // the work in the render loop.
  const prepared = canRenderDirectional
    ? beacons.map((beacon) => {
        const bearing = resolveBeaconRenderBearing(beacon, { location });
        const overlay = mapBearingToOverlayX(bearing, heading);
        const renderable = resolveRenderableAnchor(beacon, overlay.visible, pitch);
        const guidance = resolveOffscreenGuidance(
          overlay.direction,
          overlay.visible,
          renderable.frame.verticalHint,
        );
        return { beacon, overlay, renderable, guidance };
      })
    : [];

  // Count how many off-screen indicators fall on each edge, so each gets a
  // distinct stagger slot.
  const countsByEdge: Record<"left" | "right" | "center", number> = {
    left: 0,
    right: 0,
    center: 0,
  };
  for (const { renderable, guidance } of prepared) {
    if (!renderable.frame.inView) countsByEdge[guidance.edge] += 1;
  }
  const seenByEdge: Record<"left" | "right" | "center", number> = {
    left: 0,
    right: 0,
    center: 0,
  };

  return (
    <div className="beacon-overlay" aria-label="Beacon overlay">
      {preview ? (
        <PreviewPillar preview={preview} pitch={pitch} />
      ) : null}

      {prepared.map(({ beacon, overlay, renderable, guidance }) => {
        if (!renderable.frame.inView) {
          const total = countsByEdge[guidance.edge];
          const index = seenByEdge[guidance.edge];
          seenByEdge[guidance.edge] += 1;
          const staggerOffsetVh = resolveStaggerOffset(index, total);
          return (
            <OffscreenIndicator
              key={beacon.id}
              name={beacon.name}
              color={beacon.color}
              edge={guidance.edge}
              verticalCue={guidance.verticalCue}
              staggerOffsetVh={staggerOffsetVh}
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
      })}
    </div>
  );
}
