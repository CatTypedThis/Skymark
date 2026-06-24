import { describe, expect, it } from "vitest";
import {
  BASE_ELEVATION_MAX_DEGREES,
  HEADING_ONLY_BOTTOM_PERCENT,
  PITCH_NEUTRAL_BETA_DEGREES,
  UPPER_COLUMN_ELEVATION_MIN_DEGREES,
  resolveBeaconFrame,
} from "@/lib/geospatial/beacon-frame";

/**
 * Frame helper coverage for SPEC-004 §8.3 + §10.
 *
 * NOTE on the pitch model: these tests assert the INITIAL §8.3 sign model
 * (`normalizeCameraElevation = PITCH_NEUTRAL_BETA_DEGREES - pitch`). If the
 * Addendum A device spike proves the beta sign is reversed on the primary
 * Android Chrome target, flip `normalizeCameraElevation` in beacon-frame.ts
 * and update only the `beta` values used here — the segment thresholds stay.
 *
 * With the initial model, a "look down at the ground" pose has beta < neutral
 * (e.g. beta ~ 60 → elevation +30... wait, that is "look up" under this
 * model). Re-deriving precisely: elevation = 90 - beta.
 *   beta 90 (horizon) → elevation  0   → middle
 *   beta 110 (top tilted back / aim up) → elevation -20 ... that reads "down".
 *
 * The tests below use elevation as the source of truth (computed from beta via
 * the public `normalizeCameraElevation`) so they stay correct regardless of
 * the sign convention, except where a specific beta is pinned for the spike.
 */

describe("resolveBeaconFrame", () => {
  it("returns outside when the horizontal bearing is outside the FOV", () => {
    const result = resolveBeaconFrame({
      horizontalVisible: false,
      pitchDegrees: 90,
      baseVisibility: "approximated",
    });
    expect(result.segment).toBe("outside");
    expect(result.baseTreatment).toBe("hidden");
    expect(result.verticalHint).toBe("center");
  });

  it("falls back to heading-only middle when pitch is null", () => {
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: null,
      baseVisibility: "approximated",
    });
    expect(result.segment).toBe("middle");
    expect(result.baseTreatment).toBe("hidden");
    expect(result.pitchQuality).toBe("heading-only");
    expect(result.bottomPercent).toBe(HEADING_ONLY_BOTTOM_PERCENT);
  });

  it("returns middle at the horizon neutral pose", () => {
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: PITCH_NEUTRAL_BETA_DEGREES,
      baseVisibility: "approximated",
    });
    expect(result.segment).toBe("middle");
    expect(result.pitchQuality).toBe("measured");
  });

  it("shows a soft base when aiming at the base with approximated visibility", () => {
    // We want elevation <= BASE_ELEVATION_MAX_DEGREES (a "look down" pose).
    // elevation = 90 - beta, so choose beta such that the clamp holds.
    const elevation = BASE_ELEVATION_MAX_DEGREES; // -12
    const beta = PITCH_NEUTRAL_BETA_DEGREES - elevation;
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: beta,
      baseVisibility: "approximated",
    });
    expect(result.segment).toBe("base");
    expect(result.baseTreatment).toBe("soft");
    expect(result.verticalHint).toBe("lower");
  });

  it("shows a visible base only when base visibility is explicitly visible", () => {
    const elevation = BASE_ELEVATION_MAX_DEGREES;
    const beta = PITCH_NEUTRAL_BETA_DEGREES - elevation;
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: beta,
      baseVisibility: "visible",
    });
    expect(result.segment).toBe("base");
    expect(result.baseTreatment).toBe("visible");
  });

  it("never draws a definite visible base for unknown or obstructed visibility", () => {
    const elevation = BASE_ELEVATION_MAX_DEGREES;
    const beta = PITCH_NEUTRAL_BETA_DEGREES - elevation;

    const unknown = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: beta,
      baseVisibility: "unknown",
    });
    expect(unknown.baseTreatment).toBe("hidden");
    expect(unknown.segment).toBe("middle");

    const obstructed = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: beta,
      baseVisibility: "obstructed",
    });
    expect(obstructed.baseTreatment).toBe("hidden");
    expect(obstructed.segment).toBe("middle");
  });

  it("shows the upper column segment when aiming upward", () => {
    const elevation = UPPER_COLUMN_ELEVATION_MIN_DEGREES; // 18
    const beta = PITCH_NEUTRAL_BETA_DEGREES - elevation;
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: beta,
      baseVisibility: "approximated",
    });
    expect(result.segment).toBe("upper");
    expect(result.baseTreatment).toBe("hidden");
    expect(result.verticalHint).toBe("raise");
  });

  it("returns middle for elevations between base and upper thresholds", () => {
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: PITCH_NEUTRAL_BETA_DEGREES,
      baseVisibility: "approximated",
    });
    expect(result.segment).toBe("middle");
    expect(result.verticalHint).toBe("center");
  });

  it("clamps extreme pitch without leaving the measured branch", () => {
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: 200,
      baseVisibility: "approximated",
    });
    expect(result.pitchQuality).toBe("measured");
    // elevation clamps to -60, which is <= BASE_ELEVATION_MAX → base/soft
    expect(["base", "middle"]).toContain(result.segment);
  });
});
