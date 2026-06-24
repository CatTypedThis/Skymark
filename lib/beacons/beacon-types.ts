export type BeaconColorId = "cyan" | "amber" | "moss" | "violet" | "rose";

export type BeaconConfidence = "high" | "medium" | "low" | "unknown";

export type HeadingStability = "stable" | "degraded" | "unstable" | "unknown";

export type BeaconSlot = 1 | 2 | 3;

/**
 * How the current anchor position was created or last refined.
 *
 * The first PWA slice only ever persists `camera`. The remaining members exist
 * as forward-compatible groundwork for future map-backed, ARCore, and visual
 * refinement routes; they are never produced by local PWA placement today.
 *
 * See `specs/SPEC-004-phased-core-pwa-upgrade-implementation-spec.md` §8.1.
 */
export type AnchorSource =
  | "camera"
  | "metadata-enriched"
  | "map-cross-referenced"
  | "map-created"
  | "map-confirmed"
  | "map-adjusted"
  | "arcore-geospatial"
  | "visual-refined";

/**
 * Whether the beacon's base is known to be visible. The browser PWA route has
 * no validated obstruction evidence, so the render helper derives this as
 * `approximated` or `unknown` rather than persisting it.
 */
export type BaseVisibility = "visible" | "obstructed" | "unknown" | "approximated";

export interface BeaconRecord {
  id: string;
  slot: BeaconSlot;
  name: string;
  color: BeaconColorId;
  latitude: number;
  longitude: number;
  confidence: BeaconConfidence;
  placementHeading?: number;
  placementDistanceMeters: number;
  locationAccuracyMeters?: number;
  headingAccuracy?: string;
  headingStability?: HeadingStability;
  /**
   * How the current anchor was created. Optional and backward-compatible:
   * legacy records without it normalize to `"camera"`.
   */
  anchorSource?: AnchorSource;
  /**
   * User-facing confidence category for the current anchor position.
   * Distinct from `confidence` (sensor/placement quality). In the first PWA
   * slice both share the same value, but the separate field prepares the
   * model for future stronger anchor sources.
   */
  anchorConfidence?: BeaconConfidence;
  deletedAt?: string;
  created: string;
  updated: string;
}

export interface BeaconDraft {
  slot?: BeaconSlot;
  name?: string;
  color: BeaconColorId;
  latitude: number;
  longitude: number;
  confidence: BeaconConfidence;
  placementHeading: number;
  placementDistanceMeters: number;
  locationAccuracyMeters?: number;
  headingAccuracy?: string;
  headingStability?: HeadingStability;
  anchorSource?: AnchorSource;
  anchorConfidence?: BeaconConfidence;
}

export interface BeaconPlacementContext {
  latitude: number;
  longitude: number;
  heading: number;
  locationAccuracyMeters?: number;
  headingAccuracy?: string;
  headingStability?: HeadingStability;
  confidence: BeaconConfidence;
}
