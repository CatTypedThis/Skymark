import { beforeEach, describe, expect, it } from "vitest";
import type { BeaconDraft, BeaconRecord } from "@/lib/beacons/beacon-types";
import {
  BEACON_STORAGE_KEY,
  clearAllBeacons,
  createBeacon,
  listActiveBeacons,
  softDeleteBeacon,
  undoDeleteBeacon,
  updateBeaconColor,
  updateBeaconName,
} from "@/lib/beacons/beacon-service";
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

function draft(): BeaconDraft {
  return {
    color: "cyan",
    latitude: 52.3676,
    longitude: 4.9041,
    confidence: "high",
    placementHeading: 90,
    placementDistanceMeters: 100,
    locationAccuracyMeters: 12,
    headingAccuracy: "precise",
    headingStability: "stable",
  };
}

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => store.set(key, value),
  };
}

describe("beacon utilities", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
    });
  });

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

  it("stores, edits, soft-deletes, and restores beacons locally", async () => {
    const created = await createBeacon(draft(), 1);
    expect(await listActiveBeacons()).toEqual([created]);

    const renamed = await updateBeaconName(created, "Harbor marker");
    expect(renamed.name).toBe("Harbor marker");

    const recolored = await updateBeaconColor(created.id, "rose");
    expect(recolored.color).toBe("rose");

    await softDeleteBeacon(created.id);
    expect(await listActiveBeacons()).toEqual([]);

    const restored = await undoDeleteBeacon(created.id);
    expect(restored.id).toBe(created.id);
    expect(await listActiveBeacons()).toHaveLength(1);

    await clearAllBeacons([restored]);
    expect(await listActiveBeacons()).toEqual([]);
  });

  it("ignores invalid local beacon records", async () => {
    localStorage.setItem(BEACON_STORAGE_KEY, JSON.stringify([{ id: "", slot: 9 }, null]));

    expect(await listActiveBeacons()).toEqual([]);
  });
});
