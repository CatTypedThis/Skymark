export type BeaconColorId = "cyan" | "amber" | "moss" | "violet" | "rose";

export type BeaconConfidence = "high" | "medium" | "low" | "unknown";

export type HeadingStability = "stable" | "degraded" | "unstable" | "unknown";

export type BeaconSlot = 1 | 2 | 3;

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
