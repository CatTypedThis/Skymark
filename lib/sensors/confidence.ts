import type { BeaconConfidence, HeadingStability } from "@/lib/beacons/beacon-types";

interface ConfidenceInput {
  hasLocation: boolean;
  hasHeading: boolean;
  locationAccuracyMeters?: number;
  locationAgeMs?: number;
  headingStability?: HeadingStability;
  headingIsSimulated?: boolean;
}

export function deriveConfidence(input: ConfidenceInput): BeaconConfidence {
  if (!input.hasLocation || !input.hasHeading) {
    return "unknown";
  }

  const stale = typeof input.locationAgeMs === "number" && input.locationAgeMs > 15_000;
  const poorLocation =
    typeof input.locationAccuracyMeters === "number" && input.locationAccuracyMeters > 60;
  const unstableHeading = input.headingStability === "unstable" || input.headingIsSimulated;

  if (stale || poorLocation || unstableHeading) {
    return "low";
  }

  if (
    input.headingStability === "degraded" ||
    (typeof input.locationAccuracyMeters === "number" && input.locationAccuracyMeters > 25)
  ) {
    return "medium";
  }

  return "high";
}

export function confidenceLabel(confidence: BeaconConfidence): string {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "medium":
      return "Approximate";
    case "low":
      return "Low confidence";
    case "unknown":
      return "Unavailable";
  }
}
