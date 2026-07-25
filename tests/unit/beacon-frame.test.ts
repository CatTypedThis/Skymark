import { describe, expect, it } from "vitest";
import {
  BASE_BETA,
  BASE_BOTTOM_PERCENT,
  BASE_STRENGTH_FULL_MAX_BETA,
  COLUMN_VH_PERCENT,
  FADE_END_BETA,
  FADE_START_BETA,
  PITCH_NEUTRAL_BETA_DEGREES,
  TOP_BETA,
  TOP_BOTTOM_PERCENT,
  betaToBottomPercent,
  clamp,
  normalizeCameraElevation,
  resolveBaseStrength,
  resolveBeaconFrame,
} from "@/lib/geospatial/beacon-frame";

/**
 * Frame helper coverage for the continuous vertical-framing model.
 *
 * The beacon is a tall world-space column (COLUMN_VH_PERCENT = 300 viewport-%).
 * The BASE rests at BASE_BETA (~30, the look-down pose) near the bottom of the
 * screen; panning up (increasing beta toward TOP_BETA ~160) slides the column
 * downward through the frame. Full strength is maintained from BASE_BETA to
 * FADE_START_BETA (~155); only then does it dim, fully out by FADE_END_BETA
 * (~165). Panning below BASE_BETA keeps the base in view.
 *
 * The pitch sign is VERIFIED against a real device (Addendum A spike, Android
 * Chrome, 2026-06-24). Measured DeviceOrientationEvent.beta:
 *   horizon   ~ 84      aim up    ~ 143      aim down  ~ 36
 * With normalizeCameraElevation = beta - 90.
 */

describe("normalizeCameraElevation", () => {
  it("maps measured device beta values to the correct elevation sign", () => {
    expect(normalizeCameraElevation(84)).toBeCloseTo(-6, 0); // horizon
    expect(normalizeCameraElevation(143)).toBeGreaterThan(0); // aim up → positive
    expect(normalizeCameraElevation(36)).toBeLessThan(0); // aim down → negative
  });

  it("returns 0 at the neutral beta", () => {
    expect(normalizeCameraElevation(PITCH_NEUTRAL_BETA_DEGREES)).toBe(0);
  });
});

describe("clamp", () => {
  it("clamps to the given range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("betaToBottomPercent", () => {
  it("places the base at BASE_BOTTOM_PERCENT at BASE_BETA", () => {
    expect(betaToBottomPercent(BASE_BETA)).toBeCloseTo(BASE_BOTTOM_PERCENT, 5);
  });

  it("places the cap at screen center at TOP_BETA", () => {
    // cap = bottomPercent + COLUMN_VH_PERCENT = 50 (center)
    expect(betaToBottomPercent(TOP_BETA) + COLUMN_VH_PERCENT).toBeCloseTo(50, 5);
    expect(betaToBottomPercent(TOP_BETA)).toBeCloseTo(TOP_BOTTOM_PERCENT, 5);
  });

  it("decreases as beta increases (panning up slides column down)", () => {
    expect(betaToBottomPercent(60)).toBeLessThan(betaToBottomPercent(40));
    expect(betaToBottomPercent(120)).toBeLessThan(betaToBottomPercent(60));
  });
});

describe("resolveBaseStrength — continuous fade", () => {
  it("is full (1) from BASE_BETA up to FADE_START_BETA (no early fade)", () => {
    expect(resolveBaseStrength(BASE_BETA)).toBe(1);
    expect(resolveBaseStrength(84)).toBe(1); // horizon
    expect(resolveBaseStrength(143)).toBe(1); // user's "aim up" reading
    expect(resolveBaseStrength(BASE_STRENGTH_FULL_MAX_BETA)).toBe(1);
    expect(resolveBaseStrength(FADE_START_BETA)).toBe(1);
  });

  it("is full (1) below BASE_BETA too (looking at the base)", () => {
    expect(resolveBaseStrength(0)).toBe(1);
    expect(resolveBaseStrength(20)).toBe(1);
  });

  it("is zero at and past FADE_END_BETA", () => {
    expect(resolveBaseStrength(FADE_END_BETA)).toBe(0);
    expect(resolveBaseStrength(180)).toBe(0);
  });

  it("fades smoothly from 1 to 0 across FADE_START_BETA → FADE_END_BETA", () => {
    const a = resolveBaseStrength(FADE_START_BETA);
    const mid = resolveBaseStrength((FADE_START_BETA + FADE_END_BETA) / 2);
    const b = resolveBaseStrength(FADE_END_BETA);
    expect(a).toBe(1);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(b).toBe(0);
  });
});

describe("resolveBeaconFrame — horizontal outside", () => {
  it("returns inView false when the bearing is outside the FOV", () => {
    const result = resolveBeaconFrame({
      horizontalVisible: false,
      pitchDegrees: 90,
      baseVisibility: "approximated",
    });
    expect(result.inView).toBe(false);
    expect(result.baseStrength).toBe(0);
    expect(result.verticalHint).toBe("center");
  });
});

describe("resolveBeaconFrame — heading-only fallback (pitch null)", () => {
  it("rests at the base pose with full strength", () => {
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: null,
      baseVisibility: "approximated",
    });
    expect(result.inView).toBe(true);
    expect(result.pitchQuality).toBe("heading-only");
    expect(result.bottomPercent).toBe(BASE_BOTTOM_PERCENT);
    expect(result.baseStrength).toBe(1);
    expect(result.verticalHint).toBeNull();
  });
});

describe("resolveBeaconFrame — continuous vertical framing", () => {
  it("rests at the base pose at BASE_BETA", () => {
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: BASE_BETA,
      baseVisibility: "approximated",
    });
    expect(result.pitchQuality).toBe("measured");
    expect(result.bottomPercent).toBeCloseTo(BASE_BOTTOM_PERCENT, 5);
    expect(result.inView).toBe(true);
    expect(result.baseStrength).toBe(1);
    expect(result.verticalHint).toBeNull();
  });

  it("keeps the beacon in view and visible while panning up through the horizon", () => {
    // beta 84 = horizon (per device reading). Column should be sliding, still in view.
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: 84,
      baseVisibility: "approximated",
    });
    expect(result.bottomPercent).toBeLessThan(BASE_BOTTOM_PERCENT);
    expect(result.inView).toBe(true);
    expect(result.baseStrength).toBe(1); // no fade until 155
  });

  it("keeps full strength at the aim-up reading (143 beta)", () => {
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: 143,
      baseVisibility: "approximated",
    });
    expect(result.baseStrength).toBe(1);
    expect(result.inView).toBe(true);
  });

  it("stays in view until near TOP_BETA, then fades out by FADE_END_BETA", () => {
    const atFadeStart = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: FADE_START_BETA,
      baseVisibility: "approximated",
    });
    expect(atFadeStart.baseStrength).toBe(1);

    const pastFade = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: FADE_END_BETA,
      baseVisibility: "approximated",
    });
    expect(pastFade.baseStrength).toBe(0);
    expect(pastFade.verticalHint).toBe("raise");
  });

  it("keeps the base in view and guides down when below BASE_BETA", () => {
    const result = resolveBeaconFrame({
      horizontalVisible: true,
      pitchDegrees: 10,
      baseVisibility: "approximated",
    });
    expect(result.baseStrength).toBe(1);
    expect(result.verticalHint).toBe("lower");
  });

  it("never claims definite base visibility for unknown or obstructed", () => {
    for (const baseVisibility of ["unknown", "obstructed"] as const) {
      const result = resolveBeaconFrame({
        horizontalVisible: true,
        pitchDegrees: BASE_BETA,
        baseVisibility,
      });
      expect(result.inView).toBe(true);
      expect(result.baseVisibility).toBe(baseVisibility);
    }
  });
});
