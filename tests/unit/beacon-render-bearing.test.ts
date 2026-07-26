/**
 * Pure regression coverage for the saved-beacon render-bearing resolver
 * (BUG-12). Holds the beacon record constant and varies the live GPS fix —
 * the interaction that previously made already-saved beacons jump when a
 * later placement accepted a different origin.
 *
 * Geometry: the placement model stores a destination 100 m from the placement
 * origin plus the placement heading and distance. The resolver reconstructs
 * that origin by projecting backward. All fixtures here are built from the real
 * `destinationPoint`, so they stay valid if the projection math is refined.
 */
import { describe, expect, it } from "vitest";
import type { AnchorSource, BeaconRecord } from "@/lib/beacons/beacon-types";
import type { LocationFix } from "@/lib/sensors/use-geolocation";
import { bearingBetween } from "@/lib/geospatial/bearing";
import { destinationPoint } from "@/lib/geospatial/destination";
import { haversineDistanceMeters } from "@/lib/geospatial/distance";
import {
  isPlacementHeadingLockEligible,
  resolveBeaconRenderBearing,
  resolveOriginLockThresholds,
} from "@/lib/geospatial/beacon-render-bearing";

const PLACEMENT_ORIGIN = { latitude: 0, longitude: 0 };
const PLACEMENT_HEADING = 0; // due north
const PLACEMENT_DISTANCE = 100; // meters

const destination = destinationPoint(
  PLACEMENT_ORIGIN.latitude,
  PLACEMENT_ORIGIN.longitude,
  PLACEMENT_HEADING,
  PLACEMENT_DISTANCE,
);

// 1 degree of longitude at the equator, in meters.
const METERS_PER_DEGREE_LON = haversineDistanceMeters(0, 0, 0, 1);

function shiftEast(meters: number): LocationFix {
  return {
    latitude: PLACEMENT_ORIGIN.latitude,
    longitude: PLACEMENT_ORIGIN.longitude + meters / METERS_PER_DEGREE_LON,
    accuracy: 5,
    timestamp: 0,
  };
}

function shiftWest(meters: number): LocationFix {
  return {
    latitude: PLACEMENT_ORIGIN.latitude,
    longitude: PLACEMENT_ORIGIN.longitude - meters / METERS_PER_DEGREE_LON,
    accuracy: 5,
    timestamp: 0,
  };
}

function makeCameraBeacon(overrides: Partial<BeaconRecord> = {}): BeaconRecord {
  return {
    id: "b1",
    slot: 1,
    name: "Trailhead",
    color: "cyan",
    latitude: destination.latitude,
    longitude: destination.longitude,
    confidence: "high",
    anchorSource: "camera",
    placementHeading: PLACEMENT_HEADING,
    placementDistanceMeters: PLACEMENT_DISTANCE,
    locationAccuracyMeters: undefined,
    created: "2026-01-01T00:00:00.000Z",
    updated: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const STORED_HEADING = PLACEMENT_HEADING;

describe("resolveOriginLockThresholds — deterministic policy", () => {
  it("normal accuracies produce a 45 m lock radius and 100 m transition end", () => {
    const { lockRadius, transitionEnd } = resolveOriginLockThresholds(100, 5, 0);
    expect(lockRadius).toBe(45);
    expect(transitionEnd).toBe(100);
  });

  it("35 m / 35 m accuracies produce a 78 m lock radius and 133 m transition end", () => {
    const { lockRadius, transitionEnd } = resolveOriginLockThresholds(100, 35, 35);
    expect(lockRadius).toBe(78);
    expect(transitionEnd).toBe(133);
  });

  it("extreme accuracies cap at an 80 m lock radius and 135 m transition end", () => {
    const { lockRadius, transitionEnd } = resolveOriginLockThresholds(100, 1000, 1000);
    expect(lockRadius).toBe(80);
    expect(transitionEnd).toBe(135);
  });
});

describe("isPlacementHeadingLockEligible — provenance scoping", () => {
  it("treats camera and legacy source-less records as eligible", () => {
    expect(isPlacementHeadingLockEligible({ anchorSource: "camera" })).toBe(true);
    expect(isPlacementHeadingLockEligible({ anchorSource: undefined })).toBe(true);
  });

  const ineligibleSources: AnchorSource[] = [
    "metadata-enriched",
    "map-cross-referenced",
    "map-created",
    "map-confirmed",
    "map-adjusted",
    "arcore-geospatial",
    "visual-refined",
  ];
  for (const source of ineligibleSources) {
    it(`returns false for ${source}`, () => {
      expect(isPlacementHeadingLockEligible({ anchorSource: source })).toBe(false);
    });
  }
});

describe("resolveBeaconRenderBearing — same-place GPS shifts stay locked", () => {
  for (const meters of [20, 35]) {
    it(`holds the stored heading through a ${meters} m east shift`, () => {
      const beacon = makeCameraBeacon();
      const resolved = resolveBeaconRenderBearing(beacon, { location: shiftEast(meters) });
      expect(resolved).toBe(STORED_HEADING);
    });

    it(`holds the stored heading through a ${meters} m west shift`, () => {
      const beacon = makeCameraBeacon();
      const resolved = resolveBeaconRenderBearing(beacon, { location: shiftWest(meters) });
      expect(resolved).toBe(STORED_HEADING);
    });
  }
});

describe("resolveBeaconRenderBearing — bounded 55 m lateral GPS change", () => {
  // The automated contract: a single accepted fix jumping directly from the
  // reconstructed placement origin to 55 m laterally, under the deterministic
  // normal-accuracy policy, must move the resolved bearing by no more than 6
  // degrees (no more than 10 percentage points at the 60 deg FOV).
  const FOV_DEGREES = 60;
  const MAX_OVERLAY_POINTS = 10;
  const MAX_DELTA_DEGREES = (MAX_OVERLAY_POINTS * FOV_DEGREES) / 100; // 6 deg

  for (const direction of ["east", "west"] as const) {
    it(`stays within the 6 deg / 10 pp budget for a 55 m ${direction} shift`, () => {
      const beacon = makeCameraBeacon();
      const location = direction === "east" ? shiftEast(55) : shiftWest(55);
      const resolved = resolveBeaconRenderBearing(beacon, { location });

      // Smallest signed difference so 359 vs 1 measures as 2, not 358.
      const delta = Math.abs(((resolved - STORED_HEADING + 540) % 360) - 180);
      expect(delta).toBeLessThanOrEqual(MAX_DELTA_DEGREES);

      const overlayPoints = (delta * 100) / FOV_DEGREES;
      expect(overlayPoints).toBeLessThanOrEqual(MAX_OVERLAY_POINTS);
    });
  }
});

describe("resolveBeaconRenderBearing — boundary continuity", () => {
  // Spec: explicit angular-delta assertions of at most 1 degree for locations
  // separated by 1 meter across either boundary.
  function angularDelta(a: number, b: number): number {
    return Math.abs(((a - b + 540) % 360) - 180);
  }

  it("is continuous across the lock-radius boundary (45 m)", () => {
    const beacon = makeCameraBeacon();
    const inside = resolveBeaconRenderBearing(beacon, { location: shiftEast(45) });
    const outside = resolveBeaconRenderBearing(beacon, { location: shiftEast(46) });
    expect(angularDelta(inside, outside)).toBeLessThanOrEqual(1);
  });

  it("is continuous across the transition-end boundary (100 m)", () => {
    const beacon = makeCameraBeacon();
    const before = resolveBeaconRenderBearing(beacon, { location: shiftEast(99) });
    const atEnd = resolveBeaconRenderBearing(beacon, { location: shiftEast(100) });
    const after = resolveBeaconRenderBearing(beacon, { location: shiftEast(101) });
    expect(angularDelta(before, atEnd)).toBeLessThanOrEqual(1);
    expect(angularDelta(atEnd, after)).toBeLessThanOrEqual(1);
  });
});

describe("resolveBeaconRenderBearing — shortest-arc interpolation across 359/0", () => {
  it("blends from 359 toward a small live bearing through 0, not the long way around", () => {
    // A camera beacon stored at heading 359, with a transition-band location
    // (60 m from the reconstructed origin, between the 45 m lock and 100 m end)
    // whose direct live bearing is overridden to 1 deg. The shortest angular
    // path from 359 to 1 is 2 deg through 0. Naive linear interpolation would
    // instead walk 359 -> 180 -> 1 (~64 deg in this band); the resolver must
    // take the short arc.
    const heading = 359;
    const dest = destinationPoint(0, 0, heading, PLACEMENT_DISTANCE);
    const origin = destinationPoint(dest.latitude, dest.longitude, heading + 180, PLACEMENT_DISTANCE);
    const beacon = makeCameraBeacon({
      latitude: dest.latitude,
      longitude: dest.longitude,
      placementHeading: heading,
    });

    const location: LocationFix = {
      latitude: origin.latitude,
      longitude: origin.longitude + 60 / METERS_PER_DEGREE_LON,
      accuracy: 5,
      timestamp: 0,
    };

    const resolved = resolveBeaconRenderBearing(beacon, { location, liveBearing: 1 });

    // Angular distance from the stored 359 heading. Short-arc blending keeps
    // this within the 2 deg span to the live bearing; the long way around
    // would land near 294 deg (a ~64 deg delta).
    const deltaFromStored = Math.abs(((resolved - heading + 540) % 360) - 180);
    expect(deltaFromStored).toBeLessThanOrEqual(2);
  });
});

describe("resolveBeaconRenderBearing — genuine travel uses live bearing", () => {
  it("equals bearingBetween() beyond the transition band", () => {
    const beacon = makeCameraBeacon();
    const distant: LocationFix = { latitude: 0.001, longitude: 0.001, accuracy: 5, timestamp: 0 };
    const resolved = resolveBeaconRenderBearing(beacon, { location: distant });
    const live = bearingBetween(
      distant.latitude,
      distant.longitude,
      beacon.latitude,
      beacon.longitude,
    );
    expect(resolved).toBeCloseTo(live, 6);
  });
});

describe("resolveBeaconRenderBearing — malformed placement metadata", () => {
  const liveLocation: LocationFix = { latitude: 0, longitude: 0.0009, accuracy: 5, timestamp: 0 };

  function liveBearing(beacon: BeaconRecord): number {
    return bearingBetween(
      liveLocation.latitude,
      liveLocation.longitude,
      beacon.latitude,
      beacon.longitude,
    );
  }

  it("falls back to the live bearing when placement heading is missing", () => {
    const beacon = makeCameraBeacon({ placementHeading: undefined });
    expect(resolveBeaconRenderBearing(beacon, { location: liveLocation })).toBeCloseTo(
      liveBearing(beacon),
      6,
    );
  });

  it("falls back to the live bearing when placement distance is non-positive", () => {
    const beacon = makeCameraBeacon({ placementDistanceMeters: 0 });
    expect(resolveBeaconRenderBearing(beacon, { location: liveLocation })).toBeCloseTo(
      liveBearing(beacon),
      6,
    );
  });

  it("falls back to the live bearing when coordinates are non-finite", () => {
    const beacon = makeCameraBeacon({ latitude: Number.NaN, longitude: 0 });
    expect(resolveBeaconRenderBearing(beacon, { location: liveLocation })).toBeCloseTo(
      0,
      6,
    );
  });

  it("falls back to the live bearing when placement heading is non-finite", () => {
    const beacon = makeCameraBeacon({ placementHeading: Number.POSITIVE_INFINITY });
    expect(resolveBeaconRenderBearing(beacon, { location: liveLocation })).toBeCloseTo(
      liveBearing(beacon),
      6,
    );
  });

  it("never throws and returns the stored heading when location is null for an eligible record", () => {
    const beacon = makeCameraBeacon();
    expect(() => resolveBeaconRenderBearing(beacon, { location: null })).not.toThrow();
    expect(resolveBeaconRenderBearing(beacon, { location: null })).toBe(STORED_HEADING);
  });
});

describe("resolveBeaconRenderBearing — non-camera anchor provenance", () => {
  const ineligibleSources: AnchorSource[] = [
    "metadata-enriched",
    "map-cross-referenced",
    "map-created",
    "map-confirmed",
    "map-adjusted",
    "arcore-geospatial",
    "visual-refined",
  ];

  for (const source of ineligibleSources) {
    it(`uses the live coordinate bearing for ${source} even with valid placement metadata`, () => {
      const beacon = makeCameraBeacon({ anchorSource: source });
      // A nearby fix whose direct bearing is well off the stored heading.
      const location = shiftEast(30);
      const resolved = resolveBeaconRenderBearing(beacon, { location });
      const live = bearingBetween(
        location.latitude,
        location.longitude,
        beacon.latitude,
        beacon.longitude,
      );
      expect(resolved).toBeCloseTo(live, 6);
      // And not the locked placement heading.
      expect(resolved).not.toBe(STORED_HEADING);
    });
  }
});
