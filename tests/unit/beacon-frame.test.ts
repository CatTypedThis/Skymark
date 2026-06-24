import { describe, expect, it } from "vitest";
import {
  BASE_ELEVATION_MAX_DEGREES,
  HEADING_ONLY_BOTTOM_PERCENT,
  PITCH_NEUTRAL_BETA_DEGREES,
  UPPER_COLUMN_ELEVATION_MIN_DEGREES,
  normalizeCameraElevation,
  resolveBeaconFrame,
} from "@/lib/geospatial/beacon-frame";

/**
 * Frame helper coverage for SPEC-004 §8.3 + §10.
 *
 * The pitch sign below is VERIFIED against a real device (Addendum A spike,
 * Android Chrome, 2026-06-24). Measured DeviceOrientationEvent.beta:
 *   horizon   ≈ 84
 *   aim up    ≈ 143   (top of phone tilted back toward sky)
 *   aim down  ≈ 36    (top of phone tilted toward ground)
 *
 * With `normalizeCameraElevation = beta - 90`, those map to elevations
 * -6 / +53 / -54 respectively → middle / upper / base. The earlier draft
 * (`90 - beta`) produced the inverted symptom the spike caught. If a future
 * device reports beta inverted relative to the W3C frame, flip the sign in
 * beacon-frame.ts and update these values; thresholds stay unchanged.
 */

describe("normalizeCameraElevation", () => {
  it("maps measured device beta values to the correct elevation sign", () => {
    // Pinned to the 2026-06-24 Android Chrome spike readings.
    expect(normalizeCameraElevation(84)).toBeCloseTo(-6, 0); // horizon → ~middle
    expect(normalizeCameraElevation(143)).toBeGreaterThan(0); // aim up → positive
    expect(normalizeCameraElevation(36)).toBeLessThan(0); // aim down → negative
  });
});

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
    // Aim down (beta ~36): elevation = 36 - 90 = -54, which is <= BASE_ELEVATION_MAX (-12).
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: 36,
      baseVisibility: "approximated",
    });
    expect(result.segment).toBe("base");
    expect(result.baseTreatment).toBe("soft");
    expect(result.verticalHint).toBe("lower");
  });

  it("shows a visible base only when base visibility is explicitly visible", () => {
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: 36, // aim down
      baseVisibility: "visible",
    });
    expect(result.segment).toBe("base");
    expect(result.baseTreatment).toBe("visible");
  });

  it("never draws a definite visible base for unknown or obstructed visibility", () => {
    const unknown = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: 36, // aim down
      baseVisibility: "unknown",
    });
    expect(unknown.baseTreatment).toBe("hidden");
    expect(unknown.segment).toBe("middle");

    const obstructed = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: 36, // aim down
      baseVisibility: "obstructed",
    });
    expect(obstructed.baseTreatment).toBe("hidden");
    expect(obstructed.segment).toBe("middle");
  });

  it("shows the upper column segment when aiming upward", () => {
    // Aim up (beta ~143): elevation = 143 - 90 = +53, >= UPPER_COLUMN_ELEVATION_MIN (18).
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: 143,
      baseVisibility: "approximated",
    });
    expect(result.segment).toBe("upper");
    expect(result.baseTreatment).toBe("hidden");
    expect(result.verticalHint).toBe("raise");
  });

  it("returns middle for elevations between base and upper thresholds", () => {
    // Horizon (beta ~84): elevation ≈ -6, between -12 and +18 → middle.
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: 84,
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
    // elevation = 200 - 90 = 110, clamps to +60 → upper
    expect(result.segment).toBe("upper");
  });
});

describe("BASE_ELEVATION_MAX_DEGREES sanity", () => {
  it("is below the horizon so the base only appears when aiming down", () => {
    expect(BASE_ELEVATION_MAX_DEGREES).toBeLessThan(0);
    expect(UPPER_COLUMN_ELEVATION_MIN_DEGREES).toBeGreaterThan(0);
  });
});
