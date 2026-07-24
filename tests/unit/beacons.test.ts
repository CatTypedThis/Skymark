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
  isAnchorSource,
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

/**
 * Anchor provenance groundwork (ticket 01): backward-compatible persistence of
 * optional anchorSource / anchorConfidence. New camera drafts persist an
 * approximate camera source; legacy records load as camera anchors; malformed
 * optional fields are repaired without dropping an otherwise valid record.
 */
describe("anchor provenance", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
    });
  });

  it("recognizes valid anchor source values", () => {
    expect(isAnchorSource("camera")).toBe(true);
    expect(isAnchorSource("arcore-geospatial")).toBe(true);
    expect(isAnchorSource("map-adjusted")).toBe(true);
    expect(isAnchorSource("not-a-source")).toBe(false);
    expect(isAnchorSource(undefined)).toBe(false);
  });

  it("accepts valid optional anchor fields on a beacon record", () => {
    const valid = {
      ...beacon(1),
      anchorSource: "camera" as const,
      anchorConfidence: "low" as const,
    };
    expect(validateBeaconRecord(valid)).toEqual([]);
  });

  it("flags invalid optional anchor source without dropping the record", () => {
    const malformed = { ...beacon(1), anchorSource: "gps" as unknown as never };
    expect(validateBeaconRecord(malformed)).toContain("Beacon anchor source is invalid.");
  });

  it("flags invalid optional anchor confidence without dropping the record", () => {
    const malformed = { ...beacon(1), anchorConfidence: "maybe" as unknown as never };
    expect(validateBeaconRecord(malformed)).toContain("Beacon anchor confidence is invalid.");
  });

  it("does not flag missing anchor fields on a legacy record", () => {
    expect(validateBeaconRecord(beacon(2))).toEqual([]);
  });

  it("persists an approximate camera source and anchor confidence on a new draft", async () => {
    const created = await createBeacon({ ...draft(), confidence: "low" }, 1);
    expect(created.anchorSource).toBe("camera");
    expect(created.anchorConfidence).toBe("low");
  });

  it("loads a legacy record (no anchor fields) as a camera anchor", async () => {
    const legacy = {
      id: "legacy-1",
      slot: 1,
      name: "Beacon 01",
      color: "cyan",
      latitude: 52.3676,
      longitude: 4.9041,
      confidence: "medium",
      placementHeading: 90,
      placementDistanceMeters: 100,
      created: "2026-06-10T12:00:00.000Z",
      updated: "2026-06-10T12:00:00.000Z",
    };
    localStorage.setItem(BEACON_STORAGE_KEY, JSON.stringify([legacy]));

    const [loaded] = await listActiveBeacons();
    expect(loaded.anchorSource).toBe("camera");
    // Anchor confidence derives from the existing legacy confidence.
    expect(loaded.anchorConfidence).toBe("medium");
  });

  it("repairs malformed optional anchor fields instead of dropping a valid record", async () => {
    const validCoords = {
      id: "mixed-1",
      slot: 2,
      name: "Beacon 02",
      color: "amber",
      latitude: 52.3676,
      longitude: 4.9041,
      confidence: "high",
      anchorSource: "bogus-source",
      anchorConfidence: "not-a-level",
      placementHeading: 90,
      placementDistanceMeters: 100,
      created: "2026-06-10T12:00:00.000Z",
      updated: "2026-06-10T12:00:00.000Z",
    };
    localStorage.setItem(BEACON_STORAGE_KEY, JSON.stringify([validCoords]));

    const [loaded] = await listActiveBeacons();
    // Coordinates remain intact; malformed source is repaired to camera.
    expect(loaded.id).toBe("mixed-1");
    expect(loaded.latitude).toBe(52.3676);
    expect(loaded.anchorSource).toBe("camera");
    // Malformed anchor confidence falls back to the legacy confidence.
    expect(loaded.anchorConfidence).toBe("high");
  });
});
