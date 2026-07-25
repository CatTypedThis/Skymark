import type { AnchorSource, BeaconConfidence } from "./beacon-types";

/**
 * Plain user-facing source labels for anchor provenance. See SPEC-004 §8.2.
 *
 * The first PWA slice only ever persists `camera`, so "Approximate" is the
 * only label produced today. The remaining mappings exist as forward-
 * compatible groundwork for future map-backed, ARCore, and visual-refinement
 * routes and are not reachable from local placement.
 */
const SOURCE_LABELS: Record<AnchorSource, string> = {
  camera: "Approximate",
  "metadata-enriched": "Map-backed",
  "map-cross-referenced": "Map-backed",
  "map-created": "Map-confirmed",
  "map-confirmed": "Map-confirmed",
  "map-adjusted": "Map-confirmed",
  "arcore-geospatial": "AR-anchored",
  "visual-refined": "Visually refined",
};

const CONFIDENCE_LABELS: Record<BeaconConfidence, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  unknown: "Unknown",
};

export function anchorSourceLabel(source: AnchorSource): string {
  return SOURCE_LABELS[source];
}

export function anchorConfidenceLabel(confidence: BeaconConfidence): string {
  return CONFIDENCE_LABELS[confidence];
}

/**
 * Compact two-part status string, e.g. "Approximate / Low", used in the
 * selected-beacon sheet and drawer rows (SPEC-004 §8.2, Phase 5).
 */
export function anchorStatusLabel(source: AnchorSource, confidence: BeaconConfidence): string {
  return `${anchorSourceLabel(source)} / ${anchorConfidenceLabel(confidence)}`;
}
