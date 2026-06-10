import { isBeaconColorId } from "./color-palette";
import type { BeaconConfidence, BeaconRecord, BeaconSlot } from "./beacon-types";

export const BEACON_LIMIT = 3;
export const DEFAULT_PLACEMENT_DISTANCE_METERS = 100;

const CONFIDENCE_VALUES = new Set<BeaconConfidence>(["high", "medium", "low", "unknown"]);

export function generatedBeaconName(slot: BeaconSlot): string {
  return `Beacon ${String(slot).padStart(2, "0")}`;
}

export function normalizeBeaconName(value: string | undefined, slot: BeaconSlot): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : generatedBeaconName(slot);
}

export function usedSlots(beacons: Pick<BeaconRecord, "slot">[]): Set<BeaconSlot> {
  return new Set(beacons.map((beacon) => beacon.slot));
}

export function nextAvailableSlot(beacons: Pick<BeaconRecord, "slot">[]): BeaconSlot | null {
  const slots = usedSlots(beacons);
  for (const slot of [1, 2, 3] as const) {
    if (!slots.has(slot)) {
      return slot;
    }
  }
  return null;
}

export function validateLatitude(latitude: number): boolean {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
}

export function validateLongitude(longitude: number): boolean {
  return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

export function isBeaconSlot(value: number): value is BeaconSlot {
  return value === 1 || value === 2 || value === 3;
}

export function isBeaconConfidence(value: unknown): value is BeaconConfidence {
  return typeof value === "string" && CONFIDENCE_VALUES.has(value as BeaconConfidence);
}

export function validateBeaconRecord(record: BeaconRecord): string[] {
  const errors: string[] = [];

  if (!record.id) errors.push("Beacon id is required.");
  if (!isBeaconSlot(record.slot)) errors.push("Beacon slot must be 1, 2, or 3.");
  if (!record.name.trim()) errors.push("Beacon name is required.");
  if (!isBeaconColorId(record.color)) errors.push("Beacon color is not in the curated palette.");
  if (!validateLatitude(record.latitude)) errors.push("Beacon latitude is invalid.");
  if (!validateLongitude(record.longitude)) errors.push("Beacon longitude is invalid.");
  if (!isBeaconConfidence(record.confidence)) errors.push("Beacon confidence is invalid.");
  if (record.placementHeading !== undefined) {
    if (!Number.isFinite(record.placementHeading) || record.placementHeading < 0 || record.placementHeading >= 360) {
      errors.push("Placement heading must be normalized from 0 to less than 360.");
    }
  }

  return errors;
}
