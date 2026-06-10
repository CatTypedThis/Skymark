import { describe, expect, it } from "vitest";
import type { BeaconRecord } from "@/lib/beacons/beacon-types";
import {
  generatedBeaconName,
  nextAvailableSlot,
  normalizeBeaconName,
  validateBeaconRecord,
} from "@/lib/beacons/validation";
import { deriveConfidence } from "@/lib/sensors/confidence";

function beacon(slot: 1 | 2 | 3): BeaconRecord {
  return {
    id: `test-${slot}`,
    owner: "user",
    slot,
    name: generatedBeaconName(slot),
    color: "cyan",
    latitude: 52.3676,
    longitude: 4.9041,
    confidence: "high",
    placementHeading: 90,
    placementDistanceMeters: 100,
    created: "2026-06-10 12:00:00.000Z",
    updated: "2026-06-10 12:00:00.000Z",
  };
}

describe("beacon utilities", () => {
  it("generates slot-based names", () => {
    expect(generatedBeaconName(1)).toBe("Beacon 01");
    expect(generatedBeaconName(3)).toBe("Beacon 03");
    expect(normalizeBeaconName("   ", 2)).toBe("Beacon 02");
  });

  it("finds the lowest available slot", () => {
    expect(nextAvailableSlot([])).toBe(1);
    expect(nextAvailableSlot([beacon(1), beacon(3)])).toBe(2);
    expect(nextAvailableSlot([beacon(1), beacon(2), beacon(3)])).toBeNull();
  });

  it("validates beacon records", () => {
    expect(validateBeaconRecord(beacon(1))).toEqual([]);
    expect(validateBeaconRecord({ ...beacon(1), latitude: 120 })).toContain("Beacon latitude is invalid.");
    expect(validateBeaconRecord({ ...beacon(1), color: "blue" as "cyan" })).toContain(
      "Beacon color is not in the curated palette.",
    );
  });

  it("derives confidence from sensor quality", () => {
    expect(
      deriveConfidence({
        hasLocation: true,
        hasHeading: true,
        locationAccuracyMeters: 12,
        locationAgeMs: 1000,
        headingStability: "stable",
      }),
    ).toBe("high");

    expect(
      deriveConfidence({
        hasLocation: true,
        hasHeading: true,
        locationAccuracyMeters: 80,
        locationAgeMs: 1000,
        headingStability: "stable",
      }),
    ).toBe("low");

    expect(
      deriveConfidence({
        hasLocation: false,
        hasHeading: true,
      }),
    ).toBe("unknown");
  });
});
