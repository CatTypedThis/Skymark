import type { BaseVisibility } from "@/lib/beacons/beacon-types";

export type BeaconFrameSegment = "base" | "middle" | "upper" | "outside";
export type BeaconBaseTreatment = "visible" | "soft" | "hidden";
export type PitchQuality = "measured" | "heading-only" | "unusable";

export interface BeaconFrameInput {
  horizontalVisible: boolean;
  pitchDegrees: number | null;
  baseVisibility: BaseVisibility;
}

export interface BeaconFrameResult {
  segment: BeaconFrameSegment;
  baseTreatment: BeaconBaseTreatment;
  baseVisibility: BaseVisibility;
  pitchQuality: PitchQuality;
  bottomPercent: number;
  verticalHint: "raise" | "lower" | "center" | null;
}

// --- Constants (SPEC-004 §8.3) -------------------------------------------

export const DEFAULT_HORIZONTAL_FOV_DEGREES = 60;

/**
 * `DeviceOrientationEvent.beta` value when the phone is held vertical and the
 * camera aims at the horizon. Per the W3C frame beta ≈ 90 in portrait.
 */
export const PITCH_NEUTRAL_BETA_DEGREES = 90;

export const MAX_CAMERA_ELEVATION_DEGREES = 60;

/** Camera aiming at or below this elevation shows the base segment. */
export const BASE_ELEVATION_MAX_DEGREES = -12;

/** Camera aiming at or above this elevation shows the upper column segment. */
export const UPPER_COLUMN_ELEVATION_MIN_DEGREES = 18;

/** Column bottom offset (from the bottom of the overlay) for the heading-only
 *  fallback. Preserves the prior `bottomPercent` anchor height. */
export const HEADING_ONLY_BOTTOM_PERCENT = 24;

/**
 * PITCH-SIGN — verified by the Addendum A device spike (Android Chrome, 2026-06-24).
 *
 * `DeviceOrientationEvent.beta` follows the W3C frame: beta ≈ 90 at the
 * horizon, beta INCREASES (toward 180) when the top of the phone tilts back
 * to aim at the sky, and beta DECREASES (toward 0) when aiming at the ground.
 *
 * Measured on the primary Android Chrome target:
 *   horizon beta ≈ 84, aim-up beta ≈ 143, aim-down beta ≈ 36.
 *
 * So a positive elevation (aim up) maps to beta > 90, which requires
 * `beta - 90` — NOT the `90 - beta` form the original §8.3 draft assumed.
 * The earlier `90 - beta` produced the inverted symptom the spike caught
 * ("base segment when looking up, upper when looking down").
 *
 * If a future device reports beta inverted relative to the W3C frame,
 * flip the sign here and in the frame tests. This is the single place that
 * changes; the segment thresholds below stay the same. Per SPEC-004 §8.3 a
 * sign/neutral correction does not require an RFC amendment.
 */
export function normalizeCameraElevation(pitchDegrees: number): number {
  return pitchDegrees - PITCH_NEUTRAL_BETA_DEGREES;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// --- Frame resolution -----------------------------------------------------

/**
 * Pure helper that decides which vertical beacon segment is in the camera
 * frame and how the base should be treated, given horizontal visibility, raw
 * device pitch (beta), and base visibility. Never performs IO. See
 * SPEC-004 §8.3 for the full segment rule table.
 */
export function resolveBeaconFrame(input: BeaconFrameInput): BeaconFrameResult {
  const { horizontalVisible, pitchDegrees, baseVisibility } = input;

  // Horizontal bearing is outside the FOV: hide the beacon, guide to center.
  if (!horizontalVisible) {
    return {
      segment: "outside",
      baseTreatment: "hidden",
      baseVisibility,
      pitchQuality: pitchDegrees === null ? "unusable" : "measured",
      bottomPercent: HEADING_ONLY_BOTTOM_PERCENT,
      verticalHint: "center",
    };
  }

  // Pitch is null or unusable: conservative heading-only middle segment.
  if (pitchDegrees === null) {
    return {
      segment: "middle",
      baseTreatment: "hidden",
      baseVisibility,
      pitchQuality: "heading-only",
      bottomPercent: HEADING_ONLY_BOTTOM_PERCENT,
      verticalHint: "center",
    };
  }

  const pitchQuality: PitchQuality = "measured";
  const elevation = clamp(
    normalizeCameraElevation(pitchDegrees),
    -MAX_CAMERA_ELEVATION_DEGREES,
    MAX_CAMERA_ELEVATION_DEGREES,
  );

  // Base segment: camera aimed at or below the base elevation.
  if (elevation <= BASE_ELEVATION_MAX_DEGREES) {
    if (baseVisibility === "visible") {
      return {
        segment: "base",
        baseTreatment: "visible",
        baseVisibility,
        pitchQuality,
        bottomPercent: HEADING_ONLY_BOTTOM_PERCENT,
        verticalHint: "lower",
      };
    }
    if (baseVisibility === "approximated") {
      return {
        segment: "base",
        baseTreatment: "soft",
        baseVisibility,
        pitchQuality,
        bottomPercent: HEADING_ONLY_BOTTOM_PERCENT,
        verticalHint: "lower",
      };
    }
    // unknown or obstructed: do not draw a definite base; show middle.
    return {
      segment: "middle",
      baseTreatment: "hidden",
      baseVisibility,
      pitchQuality,
      bottomPercent: HEADING_ONLY_BOTTOM_PERCENT,
      verticalHint: "lower",
    };
  }

  // Upper column segment: camera aimed upward toward the skyward column.
  if (elevation >= UPPER_COLUMN_ELEVATION_MIN_DEGREES) {
    return {
      segment: "upper",
      baseTreatment: "hidden",
      baseVisibility,
      pitchQuality,
      bottomPercent: HEADING_ONLY_BOTTOM_PERCENT,
      verticalHint: "raise",
    };
  }

  // Default: middle segment, heading-level view of the column.
  return {
    segment: "middle",
    baseTreatment: "hidden",
    baseVisibility,
    pitchQuality,
    bottomPercent: HEADING_ONLY_BOTTOM_PERCENT,
    verticalHint: "center",
  };
}
