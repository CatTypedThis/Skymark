"use client";

import type { BeaconConfidence, BeaconRecord, HeadingStability } from "@/lib/beacons/beacon-types";
import type { BeaconFrameSegment } from "@/lib/geospatial/beacon-frame";
import type { LocationFix } from "@/lib/sensors/use-geolocation";
import type { CameraStatus } from "@/lib/sensors/use-camera-stream";
import type { OrientationStatus } from "@/lib/sensors/use-orientation";
import { resolveRenderableAnchor } from "@/lib/beacons/renderable-anchor";

export interface DebugBeaconView {
  beacon: Pick<BeaconRecord, "id" | "name" | "anchorSource" | "anchorConfidence" | "confidence">;
  segment: BeaconFrameSegment;
  visible: boolean;
  xPercent: number;
}

interface DebugPanelProps {
  cameraStatus: CameraStatus;
  location: LocationFix | null;
  heading: number | null;
  pitch: number | null;
  orientationStatus: OrientationStatus;
  stability: HeadingStability;
  accuracyLabel?: string;
  confidence: BeaconConfidence;
  beacons: BeaconRecord[];
  /** When true, per-beacon frame resolution uses the live pitch. */
  directional: boolean;
}

/**
 * Local-only diagnostic overlay, gated by the `?debug=1` URL flag. Covers the
 * reusable sensor + frame set so the pitch-model spike and future device QA
 * share one panel. Nothing here is transmitted (NFR-001). See Addendum 1
 * scope addition.
 */
export function DebugPanel({
  cameraStatus,
  location,
  heading,
  pitch,
  orientationStatus,
  stability,
  accuracyLabel,
  confidence,
  beacons,
  directional,
}: DebugPanelProps) {
  const views: DebugBeaconView[] = beacons.map((beacon) => {
    const renderable = resolveRenderableAnchor(beacon, true, directional ? pitch : null);
    return {
      beacon,
      segment: renderable.frame.segment,
      visible: renderable.frame.segment !== "outside",
      xPercent: 50,
    };
  });

  return (
    <div
      className="debug-panel"
      role="status"
      aria-label="Debug sensor and beacon readout"
    >
      <div className="debug-section">
        <span className="debug-title">SENSORS</span>
        <dl>
          <div>
            <dt>camera</dt>
            <dd>{cameraStatus}</dd>
          </div>
          <div>
            <dt>orientation</dt>
            <dd>{orientationStatus}</dd>
          </div>
          <div>
            <dt>heading</dt>
            <dd>{heading === null ? "null" : `${heading.toFixed(1)}°`}</dd>
          </div>
          <div>
            <dt>beta (pitch)</dt>
            <dd>{pitch === null ? "null" : pitch.toFixed(1)}</dd>
          </div>
          <div>
            <dt>stability</dt>
            <dd>{stability}</dd>
          </div>
          <div>
            <dt>accuracy</dt>
            <dd>{accuracyLabel ?? "—"}</dd>
          </div>
          <div>
            <dt>confidence</dt>
            <dd>{confidence}</dd>
          </div>
        </dl>
      </div>

      <div className="debug-section">
        <span className="debug-title">GPS</span>
        <dl>
          <div>
            <dt>lat</dt>
            <dd>{location ? location.latitude.toFixed(5) : "—"}</dd>
          </div>
          <div>
            <dt>lon</dt>
            <dd>{location ? location.longitude.toFixed(5) : "—"}</dd>
          </div>
          <div>
            <dt>accuracy</dt>
            <dd>{location?.accuracy != null ? `±${location.accuracy.toFixed(0)}m` : "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="debug-section">
        <span className="debug-title">BEACONS ({beacons.length})</span>
        {views.length === 0 ? (
          <p className="debug-empty">none</p>
        ) : (
          <ul>
            {views.map((view) => (
              <li key={view.beacon.id}>
                <span className="debug-beacon-name">{view.beacon.name}</span>
                <span className="debug-beacon-segment">{view.segment}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="debug-hint">
        Pitch spike (Addendum A): log beta at horizon / aim down / aim up.
      </p>
    </div>
  );
}
