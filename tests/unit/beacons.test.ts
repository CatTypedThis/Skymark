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
  normalizeAnchorFields,
  normalizeBeaconName,
  validateBeaconRecord,
} from "@/lib/beacons/validation";
import { deriveConfidence } from "@/lib/sensors/confidence";
import { anchorStatusLabel, anchorSourceLabel } from "@/lib/beacons/anchor-presentation";
import {
  resolveAnchorConfidence,
  resolveAnchorSource,
  deriveBaseVisibility,
} from "@/lib/beacons/renderable-anchor";

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

  it("normalizes legacy records to approximate camera anchors", async () => {
    // A legacy record with no anchor fields (as produced by the pre-upgrade app).
    const legacy = {
      ...beacon(1),
    };
    delete (legacy as Record<string, unknown>).anchorSource;
    delete (legacy as Record<string, unknown>).anchorConfidence;
    localStorage.setItem(BEACON_STORAGE_KEY, JSON.stringify([legacy]));

    const [loaded] = await listActiveBeacons();
    expect(loaded.anchorSource).toBe("camera");
    expect(loaded.anchorConfidence).toBe(loaded.confidence);
  });

  it("preserves valid anchor fields and rejects malformed ones on load", async () => {
    const withMalformed = {
      ...beacon(2),
      anchorSource: "not-a-real-source",
      anchorConfidence: "bogus",
    };
    localStorage.setItem(BEACON_STORAGE_KEY, JSON.stringify([withMalformed]));

    const [loaded] = await listActiveBeacons();
    // Malformed optional fields are dropped/normalized, not fatal.
    expect(loaded.anchorSource).toBe("camera");
    expect(loaded.anchorConfidence).toBe(loaded.confidence);
  });

  it("persists camera anchor source and confidence on newly created beacons", async () => {
    const created = await createBeacon({ ...draft(), confidence: "low" }, 1);
    expect(created.anchorSource).toBe("camera");
    expect(created.anchorConfidence).toBe("low");
  });
});

describe("anchor presentation helpers", () => {
  it("maps anchor sources to plain user-facing labels", () => {
    expect(anchorSourceLabel("camera")).toBe("Approximate");
    expect(anchorSourceLabel("arcore-geospatial")).toBe("AR-anchored");
    expect(anchorSourceLabel("map-confirmed")).toBe("Map-confirmed");
  });

  it("builds a compact two-part status label", () => {
    expect(anchorStatusLabel("camera", "low")).toBe("Approximate / Low");
    expect(anchorStatusLabel("camera", "high")).toBe("Approximate / High");
  });

  it("type-guards anchor source values", () => {
    expect(isAnchorSource("camera")).toBe(true);
    expect(isAnchorSource("nope")).toBe(false);
    expect(isAnchorSource(123)).toBe(false);
  });

  it("normalizes malformed optional anchor fields by dropping them", () => {
    expect(normalizeAnchorFields({ anchorSource: "camera", anchorConfidence: "high" })).toEqual({
      anchorSource: "camera",
      anchorConfidence: "high",
    });
    expect(normalizeAnchorFields({ anchorSource: "bad", anchorConfidence: "bad" })).toEqual({});
  });

  it("resolves renderable anchor defaults for legacy records", () => {
    const legacy = { confidence: "medium" as const };
    expect(resolveAnchorSource(legacy)).toBe("camera");
    expect(resolveAnchorConfidence(legacy)).toBe("medium");
    // The first PWA slice has no obstruction evidence, so visibility is derived.
    expect(deriveBaseVisibility()).toBe("approximated");
  });
});
