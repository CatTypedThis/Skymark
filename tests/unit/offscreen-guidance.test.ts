import { describe, expect, it } from "vitest";
import {
  OFFSCREEN_STAGGER_STEP_VH,
  resolveOffscreenGuidance,
  resolveStaggerOffset,
} from "@/lib/geospatial/offscreen-guidance";

/**
 * Off-screen guidance selection coverage for Ticket 04.
 *
 * The indicator has two independent jobs driven by the tested frame + overlay
 * results from Ticket 03 (never duplicated component math):
 *   - Horizontal cue: which way to turn. Only when the beacon is outside the
 *     horizontal FOV; otherwise the indicator centers (no turn needed).
 *   - Vertical cue: raise/lower, taken straight from resolveBeaconFrame's
 *     verticalHint when the beacon is horizontally visible but vertically out.
 */
describe("resolveOffscreenGuidance — horizontally outside the FOV", () => {
  it("pins to the right edge with no vertical cue", () => {
    expect(
      resolveOffscreenGuidance("right", false, "center"),
    ).toEqual({ edge: "right", verticalCue: null });
  });

  it("pins to the left edge with no vertical cue", () => {
    expect(
      resolveOffscreenGuidance("left", false, "center"),
    ).toEqual({ edge: "left", verticalCue: null });
  });
});

describe("resolveOffscreenGuidance — horizontally in the FOV (vertical miss only)", () => {
  it("centers and keeps the raise cue even when the bearing direction is left", () => {
    // The old code force-coerced a centered-but-vertically-out beacon to "right".
    // Centering avoids a misleading horizontal chevron for a purely vertical miss.
    expect(
      resolveOffscreenGuidance("left", true, "raise"),
    ).toEqual({ edge: "center", verticalCue: "raise" });
  });

  it("centers and keeps the lower cue even when the bearing direction is right", () => {
    expect(
      resolveOffscreenGuidance("right", true, "lower"),
    ).toEqual({ edge: "center", verticalCue: "lower" });
  });

  it("centers with no vertical cue when the only hint is 'center' (turn to recenter)", () => {
    expect(
      resolveOffscreenGuidance("center", true, "center"),
    ).toEqual({ edge: "center", verticalCue: null });
  });
});

describe("resolveStaggerOffset — keeps multiple same-edge indicators readable", () => {
  it("places a lone indicator at the base line", () => {
    expect(resolveStaggerOffset(0, 1)).toBe(0);
  });

  it("spreads two indicators symmetrically above and below the base line", () => {
    // A pair straddles the base line: equal magnitude, opposite sign.
    const a = resolveStaggerOffset(0, 2);
    const b = resolveStaggerOffset(1, 2);
    expect(a).toBe(-OFFSCREEN_STAGGER_STEP_VH / 2);
    expect(b).toBe(OFFSCREEN_STAGGER_STEP_VH / 2);
    expect(a + b).toBe(0); // symmetric about the base line
  });

  it("returns distinct offsets for every index in a larger stack", () => {
    const offsets = [0, 1, 2, 3].map((i) => resolveStaggerOffset(i, 4));
    expect(new Set(offsets).size).toBe(4);
  });
});
