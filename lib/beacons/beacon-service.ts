import type PocketBase from "pocketbase";
import type { BeaconDraft, BeaconRecord, BeaconSlot, HeadingStability } from "./beacon-types";
import { generatedBeaconName, normalizeBeaconName } from "./validation";

type PocketBaseBeaconRecord = {
  id: string;
  owner: string;
  slot: number;
  name: string;
  color: string;
  latitude: number;
  longitude: number;
  confidence: string;
  placementHeading?: number;
  placementDistanceMeters?: number;
  locationAccuracyMeters?: number;
  headingAccuracy?: string;
  headingStability?: HeadingStability;
  deletedAt?: string;
  created: string;
  updated: string;
};

function toBeaconRecord(record: PocketBaseBeaconRecord): BeaconRecord {
  return {
    id: record.id,
    owner: record.owner,
    slot: record.slot as BeaconSlot,
    name: record.name,
    color: record.color as BeaconRecord["color"],
    latitude: Number(record.latitude),
    longitude: Number(record.longitude),
    confidence: record.confidence as BeaconRecord["confidence"],
    placementHeading:
      typeof record.placementHeading === "number" ? record.placementHeading : undefined,
    placementDistanceMeters: Number(record.placementDistanceMeters ?? 100),
    locationAccuracyMeters:
      typeof record.locationAccuracyMeters === "number" ? record.locationAccuracyMeters : undefined,
    headingAccuracy: record.headingAccuracy,
    headingStability: record.headingStability,
    deletedAt: record.deletedAt,
    created: record.created,
    updated: record.updated,
  };
}

function draftPayload(ownerId: string, draft: BeaconDraft, slot: BeaconSlot) {
  return {
    owner: ownerId,
    slot,
    name: normalizeBeaconName(draft.name, slot),
    color: draft.color,
    latitude: draft.latitude,
    longitude: draft.longitude,
    confidence: draft.confidence,
    placementHeading: draft.placementHeading,
    placementDistanceMeters: draft.placementDistanceMeters,
    locationAccuracyMeters: draft.locationAccuracyMeters,
    headingAccuracy: draft.headingAccuracy,
    headingStability: draft.headingStability ?? "unknown",
    deletedAt: "",
  };
}

export async function listActiveBeacons(pb: PocketBase): Promise<BeaconRecord[]> {
  const records = await pb.collection("beacons").getFullList<PocketBaseBeaconRecord>({
    filter: 'deletedAt = ""',
    sort: "slot,created",
  });

  return records.map(toBeaconRecord);
}

export async function createBeacon(
  pb: PocketBase,
  ownerId: string,
  draft: BeaconDraft,
  slot: BeaconSlot,
): Promise<BeaconRecord> {
  const record = await pb.collection("beacons").create<PocketBaseBeaconRecord>(
    draftPayload(ownerId, { ...draft, name: draft.name ?? generatedBeaconName(slot) }, slot),
  );
  return toBeaconRecord(record);
}

export async function replaceBeacon(
  pb: PocketBase,
  beaconId: string,
  ownerId: string,
  draft: BeaconDraft,
  slot: BeaconSlot,
): Promise<BeaconRecord> {
  const record = await pb.collection("beacons").update<PocketBaseBeaconRecord>(
    beaconId,
    draftPayload(ownerId, { ...draft, name: generatedBeaconName(slot) }, slot),
  );
  return toBeaconRecord(record);
}

export async function updateBeaconName(pb: PocketBase, beacon: BeaconRecord, name: string): Promise<BeaconRecord> {
  const record = await pb.collection("beacons").update<PocketBaseBeaconRecord>(beacon.id, {
    name: normalizeBeaconName(name, beacon.slot),
  });
  return toBeaconRecord(record);
}

export async function updateBeaconColor(
  pb: PocketBase,
  beaconId: string,
  color: BeaconRecord["color"],
): Promise<BeaconRecord> {
  const record = await pb.collection("beacons").update<PocketBaseBeaconRecord>(beaconId, {
    color,
  });
  return toBeaconRecord(record);
}

export async function softDeleteBeacon(pb: PocketBase, beaconId: string): Promise<void> {
  await pb.collection("beacons").update(beaconId, {
    deletedAt: new Date().toISOString(),
  });
}

export async function undoDeleteBeacon(pb: PocketBase, beaconId: string): Promise<BeaconRecord> {
  const record = await pb.collection("beacons").update<PocketBaseBeaconRecord>(beaconId, {
    deletedAt: "",
  });
  return toBeaconRecord(record);
}

export async function clearAllBeacons(pb: PocketBase, beacons: BeaconRecord[]): Promise<void> {
  await Promise.all(beacons.map((beacon) => softDeleteBeacon(pb, beacon.id)));
}
