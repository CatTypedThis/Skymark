/**
 * Pure saved-beacon render-bearing resolver (BUG-12).
 *
 * The overlay used to recompute every saved beacon's bearing from the latest
 * accepted GPS fix on every render. Because camera anchors are stored only
 * ~100 m away, a later placement that accepts a materially different GPS origin
 * could swing an existing beacon's bearing by a large fraction of the screen,
 * even though the user had not moved and the saved record was unchanged.
 *
 * This resolver reconstructs each camera anchor's approximate placement origin
 * from its saved destination + `placementHeading` + `placementDistanceMeters`,
 * keeps the stored heading inside a deterministic local origin-lock radius,
 * eases across a transition band to the live GPS-to-beacon bearing, and hands
 * off to that live bearing once the user has materially travelled. Legacy and
 * non-camera anchors retain the previous live-bearing behavior.
 *
 * Pure: no React, browser, sensor-hook, or storage dependencies. All policy is
 * exported as named constants so it can be tuned and asserted against without
 * DOM tests.
 */

import type { BeaconRecord } from "@/lib/beacons/beacon-types";
import type { LocationFix } from "@/lib/sensors/use-geolocation";
import { angularDifference, normalizeHeading } from "./angles";
import { bearingBetween } from "./bearing";
import { destinationPoint } from "./destination";
import { haversineDistanceMeters } from "./distance";

// --- Policy constants -----------------------------------------------------

/** Lock radius grows with placement distance at this ratio (below the floor). */
export const ORIGIN_LOCK_BASE_RATIO = 0.45;
/** Hard cap on the placement-distance-scaled lock radius. */
export const ORIGIN_LOCK_CAP_RATIO = 0.8;
/** Floor on the placement-distance-scaled lock radius, in meters. */
export const ORIGIN_LOCK_MIN_METERS = 45;
/** Floor on the lock-radius cap, in meters. */
export const ORIGIN_LOCK_MIN_CAP_METERS = 80;
/** Constant buffer added to the combined accuracy envelope, in meters. */
export const ORIGIN_LOCK_ACCURACY_BUFFER_METERS = 8;
/** Transition band grows with placement distance at this ratio. */
export const ORIGIN_TRANSITION_WIDTH_RATIO = 0.55;
/** Floor on the transition band width, in meters. */
export const ORIGIN_TRANSITION_MIN_WIDTH_METERS = 35;

// --- Helpers --------------------------------------------------------------

function positiveFinite(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function finiteNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Smoothstep easing in [0,1] with zero derivative at both ends, so the blend
 * from the stored heading to the live bearing has no visible kink at either
 * edge of the transition band.
 */
function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

// --- Eligibility ----------------------------------------------------------

/**
 * Only approximate camera-created anchors qualify for the placement-heading
 * lock. Legacy source-less records are normalized to `camera` by the beacon
 * service and are treated as camera here. Map-backed, ARCore, and visually
 * refined sources carry stronger coordinates that must not be overridden by a
 * historical placement heading.
 */
export function isPlacementHeadingLockEligible(
  beacon: Pick<BeaconRecord, "anchorSource">,
): boolean {
  return beacon.anchorSource === "camera" || beacon.anchorSource === undefined;
}

// --- Threshold policy -----------------------------------------------------

export interface OriginLockThresholds {
  lockRadius: number;
  transitionEnd: number;
}

/**
 * Resolve the lock radius and transition end for a given placement distance and
 * pair of accuracies. Exposed so the deterministic policy can be asserted
 * directly without constructing overlay fixtures.
 *
 * For the current 100 m model:
 *   - Normal accuracies (e.g. current 5 m, placement 0 m) resolve to a 45 m
 *     lock radius and a 100 m transition end.
 *   - 35 m / 35 m accuracies resolve to a 78 m lock radius and a 133 m end.
 *   - Extreme accuracies cap at an 80 m lock radius and a 135 m end.
 */
export function resolveOriginLockThresholds(
  placementDistance: number,
  currentAccuracy: number,
  placementAccuracy: number,
): OriginLockThresholds {
  const baseRadius = Math.max(
    ORIGIN_LOCK_MIN_METERS,
    placementDistance * ORIGIN_LOCK_BASE_RATIO,
  );
  const capRadius = Math.max(
    ORIGIN_LOCK_MIN_CAP_METERS,
    placementDistance * ORIGIN_LOCK_CAP_RATIO,
  );
  const accuracyRadius =
    currentAccuracy + placementAccuracy + ORIGIN_LOCK_ACCURACY_BUFFER_METERS;
  const lockRadius = Math.min(capRadius, Math.max(baseRadius, accuracyRadius));

  const transitionWidth = Math.max(
    ORIGIN_TRANSITION_MIN_WIDTH_METERS,
    placementDistance * ORIGIN_TRANSITION_WIDTH_RATIO,
  );
  const transitionEnd = lockRadius + transitionWidth;

  return { lockRadius, transitionEnd };
}

// --- Resolver -------------------------------------------------------------

export interface BeaconRenderBearingInput {
  /** Live GPS fix used for the fallback bearing and origin-distance check. */
  location: LocationFix | null;
  /**
   * Optional heading override for tests / callers that already have a live
   * bearing. When omitted, the bearing is computed from `location` to the
   * beacon's saved coordinates.
   */
  liveBearing?: number;
}

/**
 * Resolve the world heading a saved beacon should be rendered at.
 *
 * - Ineligible records (non-camera sources, or invalid placement metadata)
 *   return the live GPS-to-beacon bearing — preserving the pre-fix behavior for
 *   map-backed, ARCore, and visually refined anchors and for malformed data.
 * - Inside the lock radius: the stored `placementHeading`, unchanged.
 * - Inside the transition band: a smoothstep blend over the shortest angular
 *   arc from the stored heading to the live bearing.
 * - At or beyond the transition end: the live bearing, so genuine travel still
 *   supports navigation.
 *
 * Never throws. Malformed inputs fall back to the live bearing.
 */
export function resolveBeaconRenderBearing(
  beacon: BeaconRecord,
  input: BeaconRenderBearingInput,
): number {
  const { location, liveBearing: liveBearingOverride } = input;

  const liveBearing =
    liveBearingOverride !== undefined && Number.isFinite(liveBearingOverride)
      ? normalizeHeading(liveBearingOverride)
      : location !== null
        ? bearingBetween(
            location.latitude,
            location.longitude,
            beacon.latitude,
            beacon.longitude,
          )
        : normalizeHeading(beacon.placementHeading ?? 0);

  // Without a live origin we cannot run the lock policy; return the stored
  // heading for eligible records (so a transient null location does not swing
  // the beacon), and the already-computed live bearing otherwise.
  if (location === null) {
    return isPlacementHeadingLockEligible(beacon) &&
      Number.isFinite(beacon.placementHeading ?? NaN)
      ? normalizeHeading(beacon.placementHeading ?? 0)
      : liveBearing;
  }

  if (!isPlacementHeadingLockEligible(beacon)) {
    return liveBearing;
  }

  const placementHeading = beacon.placementHeading;
  const placementDistance = beacon.placementDistanceMeters;
  const beaconLatitude = beacon.latitude;
  const beaconLongitude = beacon.longitude;

  // Type-guard validation narrows the optional fields for the rest of the body.
  if (
    !Number.isFinite(beaconLatitude) ||
    !Number.isFinite(beaconLongitude) ||
    !finiteNumber(placementHeading) ||
    !positiveFinite(placementDistance)
  ) {
    return liveBearing;
  }

  // Reconstruct the approximate placement origin by projecting backward from
  // the saved destination along the placement heading.
  const origin = destinationPoint(
    beaconLatitude,
    beaconLongitude,
    normalizeHeading(placementHeading + 180),
    placementDistance,
  );

  const distanceFromPlacementOrigin = haversineDistanceMeters(
    location.latitude,
    location.longitude,
    origin.latitude,
    origin.longitude,
  );

  const currentAccuracy = positiveFinite(location.accuracy) ? location.accuracy : 0;
  const placementAccuracy = positiveFinite(beacon.locationAccuracyMeters)
    ? beacon.locationAccuracyMeters
    : 0;

  const { lockRadius, transitionEnd } = resolveOriginLockThresholds(
    placementDistance,
    currentAccuracy,
    placementAccuracy,
  );

  const storedHeading = normalizeHeading(placementHeading);

  if (distanceFromPlacementOrigin <= lockRadius) {
    return storedHeading;
  }

  if (distanceFromPlacementOrigin >= transitionEnd) {
    return liveBearing;
  }

  const rawProgress = clamp(
    (distanceFromPlacementOrigin - lockRadius) / (transitionEnd - lockRadius),
    0,
    1,
  );
  const easedProgress = smoothstep(rawProgress);
  const resolved = normalizeHeading(
    storedHeading + angularDifference(storedHeading, liveBearing) * easedProgress,
  );

  return resolved;
}
