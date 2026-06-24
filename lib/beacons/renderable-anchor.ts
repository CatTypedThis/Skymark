import type {
  AnchorSource,
  BeaconConfidence,
  BeaconRecord,
  BaseVisibility,
} from "./beacon-types";
import { anchorStatusLabel } from "./anchor-presentation";
import { resolveBeaconFrame } from "@/lib/geospatial/beacon-frame";
import type { BeaconFrameResult } from "@/lib/geospatial/beacon-frame";

/**
 * Resolve a record's anchor source/confidence, normalizing legacy or malformed
 * records to the local PWA's approximate camera anchor (SPEC-004 §8.1, §8.4).
 */
export function resolveAnchorSource(beacon: Pick<BeaconRecord, "anchorSource">): AnchorSource {
  // Legacy records that survive validation always carry anchorSource via the
  // service-layer normalization, but a hand-built record could still omit it.
  return beacon.anchorSource ?? "camera";
}

export function resolveAnchorConfidence(
  beacon: Pick<BeaconRecord, "anchorConfidence" | "confidence">,
): BeaconConfidence {
  return beacon.anchorConfidence ?? beacon.confidence;
}

/**
 * The first PWA slice has no validated obstruction evidence, so the render
 * base visibility is always `approximated` (browser-approximated ground/base).
 * See SPEC-004 §8.1 ("Do not persist baseVisibility ... Prefer deriving ...").
 */
export function deriveBaseVisibility(): BaseVisibility {
  return "approximated";
}

export interface RenderableAnchor {
  sourceLabel: string;
  statusLabel: string;
  baseVisibility: BaseVisibility;
  frame: BeaconFrameResult;
}

/**
 * Compose horizontal visibility, raw pitch, and the beacon record into the
 * props BeaconOverlay needs to render a BeaconPillar or OffscreenIndicator.
 * Never performs IO or provider calls (SPEC-004 §8.4).
 */
export function resolveRenderableAnchor(
  beacon: Pick<BeaconRecord, "anchorSource" | "anchorConfidence" | "confidence">,
  horizontalVisible: boolean,
  pitchDegrees: number | null,
): RenderableAnchor {
  const source = resolveAnchorSource(beacon);
  const anchorConfidence = resolveAnchorConfidence(beacon);
  const baseVisibility = deriveBaseVisibility();
  const frame = resolveBeaconFrame({ horizontalVisible, pitchDegrees, baseVisibility });

  return {
    sourceLabel: anchorStatusLabel(source, anchorConfidence).split(" / ")[0],
    statusLabel: anchorStatusLabel(source, anchorConfidence),
    baseVisibility,
    frame,
  };
}
