import type { BeaconDraft, BeaconRecord, BeaconSlot, HeadingStability } from "./beacon-types";
import { generatedBeaconName, isAnchorSource, isBeaconConfidence, normalizeBeaconName, validateBeaconRecord } from "./validation";

export const BEACON_STORAGE_KEY = "sky-beacon:saved-beacons";

type StoredBeaconRecord = {
  id?: unknown;
  slot?: unknown;
  name?: unknown;
  color?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  confidence?: unknown;
  anchorSource?: unknown;
  anchorConfidence?: unknown;
  placementHeading?: unknown;
  placementDistanceMeters?: unknown;
  locationAccuracyMeters?: unknown;
  headingAccuracy?: unknown;
  headingStability?: unknown;
  deletedAt?: unknown;
  created?: unknown;
  updated?: unknown;
};

function getStorage(): Storage {
  const storage = globalThis.localStorage;
  if (!storage) {
    throw new Error("Beacon storage is only available in the browser.");
  }

  return storage;
}

function nowTimestamp() {
  return new Date().toISOString();
}

function beaconId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function maybeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toBeaconRecord(value: unknown): BeaconRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as StoredBeaconRecord;
  const slot = Number(record.slot);
  const created = typeof record.created === "string" ? record.created : nowTimestamp();
  const updated = typeof record.updated === "string" ? record.updated : created;
  const confidence = record.confidence as BeaconRecord["confidence"];
  const normalized: BeaconRecord = {
    id: typeof record.id === "string" ? record.id : "",
    slot: slot as BeaconSlot,
    name: typeof record.name === "string" ? record.name : "",
    color: record.color as BeaconRecord["color"],
    latitude: Number(record.latitude),
    longitude: Number(record.longitude),
    confidence,
    anchorSource: isAnchorSource(record.anchorSource) ? record.anchorSource : "camera",
    anchorConfidence: isBeaconConfidence(record.anchorConfidence)
      ? record.anchorConfidence
      : isBeaconConfidence(confidence)
        ? confidence
        : "unknown",
    placementHeading: maybeNumber(record.placementHeading),
    placementDistanceMeters: Number(record.placementDistanceMeters ?? 100),
    locationAccuracyMeters: maybeNumber(record.locationAccuracyMeters),
    headingAccuracy: typeof record.headingAccuracy === "string" ? record.headingAccuracy : undefined,
    headingStability:
      typeof record.headingStability === "string"
        ? (record.headingStability as HeadingStability)
        : undefined,
    deletedAt: typeof record.deletedAt === "string" && record.deletedAt.length > 0 ? record.deletedAt : undefined,
    created,
    updated,
  };

  return validateBeaconRecord(normalized).length === 0 ? normalized : null;
}

function readAllBeacons(): BeaconRecord[] {
  const raw = getStorage().getItem(BEACON_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((record) => {
      const beacon = toBeaconRecord(record);
      return beacon ? [beacon] : [];
    });
  } catch {
    return [];
  }
}

function writeAllBeacons(beacons: BeaconRecord[]) {
  getStorage().setItem(BEACON_STORAGE_KEY, JSON.stringify(beacons));
}

function draftRecord(draft: BeaconDraft, slot: BeaconSlot, existing?: BeaconRecord): BeaconRecord {
  const timestamp = nowTimestamp();
  return {
    id: existing?.id ?? beaconId(),
    slot,
    name: normalizeBeaconName(draft.name ?? existing?.name ?? generatedBeaconName(slot), slot),
    color: draft.color,
    latitude: draft.latitude,
    longitude: draft.longitude,
    confidence: draft.confidence,
    anchorSource: draft.anchorSource ?? existing?.anchorSource ?? "camera",
    anchorConfidence:
      draft.anchorConfidence ??
      draft.confidence ??
      existing?.anchorConfidence ??
      existing?.confidence ??
      "unknown",
    placementHeading: draft.placementHeading,
    placementDistanceMeters: draft.placementDistanceMeters,
    locationAccuracyMeters: draft.locationAccuracyMeters,
    headingAccuracy: draft.headingAccuracy,
    headingStability: draft.headingStability ?? "unknown",
    created: existing?.created ?? timestamp,
    updated: timestamp,
  };
}

export async function listActiveBeacons(): Promise<BeaconRecord[]> {
  return readAllBeacons().filter((record) => !record.deletedAt);
}

export async function createBeacon(draft: BeaconDraft, slot: BeaconSlot): Promise<BeaconRecord> {
  const beacons = readAllBeacons();
  const created = draftRecord({ ...draft, name: draft.name ?? generatedBeaconName(slot) }, slot);
  writeAllBeacons([...beacons, created]);
  return created;
}

export async function replaceBeacon(
  beaconIdToReplace: string,
  draft: BeaconDraft,
  slot: BeaconSlot,
): Promise<BeaconRecord> {
  const beacons = readAllBeacons();
  const existing = beacons.find((beacon) => beacon.id === beaconIdToReplace);
  if (!existing) {
    throw new Error("The selected beacon is no longer available.");
  }

  const updated = draftRecord({ ...draft, name: generatedBeaconName(slot) }, slot, existing);
  writeAllBeacons(beacons.map((beacon) => (beacon.id === beaconIdToReplace ? updated : beacon)));
  return updated;
}

export async function updateBeaconName(beacon: BeaconRecord, name: string): Promise<BeaconRecord> {
  const beacons = readAllBeacons();
  const updated = {
    ...beacon,
    name: normalizeBeaconName(name, beacon.slot),
    updated: nowTimestamp(),
  };
  writeAllBeacons(beacons.map((item) => (item.id === beacon.id ? updated : item)));
  return updated;
}

export async function updateBeaconColor(
  beaconIdToUpdate: string,
  color: BeaconRecord["color"],
): Promise<BeaconRecord> {
  const beacons = readAllBeacons();
  const existing = beacons.find((beacon) => beacon.id === beaconIdToUpdate);
  if (!existing) {
    throw new Error("The selected beacon is no longer available.");
  }

  const updated = { ...existing, color, updated: nowTimestamp() };
  writeAllBeacons(beacons.map((item) => (item.id === beaconIdToUpdate ? updated : item)));
  return updated;
}

export async function softDeleteBeacon(beaconIdToDelete: string): Promise<void> {
  const beacons = readAllBeacons();
  const deletedAt = nowTimestamp();
  writeAllBeacons(
    beacons.map((beacon) =>
      beacon.id === beaconIdToDelete ? { ...beacon, deletedAt, updated: deletedAt } : beacon,
    ),
  );
}

export async function undoDeleteBeacon(beaconIdToRestore: string): Promise<BeaconRecord> {
  const beacons = readAllBeacons();
  const existing = beacons.find((beacon) => beacon.id === beaconIdToRestore);
  if (!existing) {
    throw new Error("The deleted beacon is no longer available.");
  }

  const slotInUse = beacons.some(
    (beacon) => beacon.id !== beaconIdToRestore && !beacon.deletedAt && beacon.slot === existing.slot,
  );
  if (slotInUse) {
    throw new Error("That beacon slot is already in use.");
  }

  const restored = { ...existing, deletedAt: undefined, updated: nowTimestamp() };
  writeAllBeacons(beacons.map((beacon) => (beacon.id === beaconIdToRestore ? restored : beacon)));
  return restored;
}

export async function clearAllBeacons(beaconsToClear: BeaconRecord[]): Promise<void> {
  const beacons = readAllBeacons();
  const ids = new Set(beaconsToClear.map((beacon) => beacon.id));
  const deletedAt = nowTimestamp();
  writeAllBeacons(
    beacons.map((beacon) => (ids.has(beacon.id) ? { ...beacon, deletedAt, updated: deletedAt } : beacon)),
  );
}
