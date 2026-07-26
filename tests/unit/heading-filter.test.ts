/**
 * Pure regression coverage for the compass-heading filter (BUG-13).
 *
 * The defect under test: Android Chrome interleaves `deviceorientation`
 * events whose `absolute` flag flips between true (compass heading from
 * north) and false (heading relative to an arbitrary session zero). The
 * filter must reject every relative reading, down-weight single wild absolute
 * frames, and still let genuine rotation converge.
 */
import { describe, expect, it } from "vitest";
import {
  HEADING_OUTLIER_DOWNWEIGHT,
  HEADING_OUTLIER_THRESHOLD_DEGREES,
  HEADING_SMOOTHING_WEIGHT,
  HEADING_UNSTABLE_AFTER_HELD,
  advanceHeadingFilter,
  type HeadingFilterState,
} from "@/lib/sensors/heading-filter";
import { smoothHeading } from "@/lib/sensors/smoothing";

function angDelta(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

describe("smoothHeading — unit-circle smoothing", () => {
  it("crosses the 0/360 boundary along the short arc", () => {
    const out = smoothHeading(358, 2, 0.5);
    expect(out < 10 || out > 350).toBe(true);
  });

  it("moves a fraction of the delta per call at the given weight", () => {
    // At weight w on a non-antipodal delta, the output moves ~w * delta degrees
    // toward the new heading.
    const moved = smoothHeading(0, 90, 0.5);
    expect(angDelta(0, moved)).toBeCloseTo(45, 0);
  });
});

describe("advanceHeadingFilter — absolute/relative gate", () => {
  it("seeds the estimate from the first absolute reading", () => {
    const { state, heading, rejected } = advanceHeadingFilter(null, { heading: 90, absolute: true });
    expect(state.primed).toBe(true);
    expect(heading).toBe(90);
    expect(state.estimate).toBe(90);
    expect(rejected).toBe(false);
  });

  it("rejects every relative sample and never updates the estimate", () => {
    // Prime with an absolute reading, then bombard with relative readings
    // carrying completely different values (the BUG-13 failure mode).
    let acc = advanceHeadingFilter(null, { heading: 200, absolute: true });

    for (const bad of [0, 45, 90, 315, 10]) {
      acc = advanceHeadingFilter(acc.state, { heading: bad, absolute: false });
      expect(acc.heading).toBe(200);
      expect(acc.state.estimate).toBe(200);
      expect(acc.rejected).toBe(true);
      expect(acc.outlier).toBe(false);
    }
  });

  it("returns null heading (and holds state) when a relative sample arrives before any absolute primer", () => {
    const { state, heading, rejected } = advanceHeadingFilter(null, { heading: 50, absolute: false });
    expect(heading).toBeNull();
    expect(state.primed).toBe(false);
    expect(rejected).toBe(true);
  });

  it("interleaves absolute and relative without drift (the regression)", () => {
    // Steady absolute 180; relative intruders at unrelated values must not
    // move the output at all. This is the precise shape of the bug.
    let acc = advanceHeadingFilter(null, { heading: 180, absolute: true });
    const baseline = acc.heading;

    for (const [h, abs] of [
      [12, false],
      [181, true],
      [0, false],
      [179, true],
      [270, false],
      [180, true],
    ] as const) {
      acc = advanceHeadingFilter(acc.state, { heading: h, absolute: abs });
    }

    // Output stayed near 180 the whole time; never walked toward 12/0/270.
    expect(angDelta(acc.heading ?? baseline ?? 0, 180)).toBeLessThanOrEqual(5);
  });
});

describe("advanceHeadingFilter — outlier rejection", () => {
  it("down-weights a single absolute frame ~180 degrees off", () => {
    // Spec contract: one 180-degree-off frame moves the smoothed output by no
    // more than ~10 degrees (HEADING_OUTLIER_DOWNWEIGHT * 180 ~= 9 deg), not
    // the ~40 degrees the old 0.22 weight produced.
    let acc = advanceHeadingFilter(null, { heading: 0, absolute: true });
    acc = advanceHeadingFilter(acc.state, { heading: 180, absolute: true });

    const moved = angDelta(0, acc.heading ?? 0);
    expect(moved).toBeLessThanOrEqual(10);
    // And specifically far below the pre-fix ~40 degree jump.
    expect(moved).toBeLessThan(HEADING_SMOOTHING_WEIGHT * 180 - 1);
    expect(acc.outlier).toBe(true);
    expect(acc.rejected).toBe(false);
  });

  it("still converges to a new heading across a genuine rotation", () => {
    // A run of consistent absolute readings at a new heading should converge,
    // so deliberate rotation is not over-dampened. Start at 0, turn to 90. The
    // first delta (90°) trips the outlier gate and is heavily down-weighted,
    // but subsequent deltas fall under the threshold and blend at the normal
    // weight, so a sustained turn still converges.
    let acc = advanceHeadingFilter(null, { heading: 0, absolute: true });
    for (let i = 0; i < 60; i += 1) {
      acc = advanceHeadingFilter(acc.state, { heading: 90, absolute: true });
    }
    expect(angDelta(acc.heading ?? 0, 90)).toBeLessThanOrEqual(2);
  });

  it("normalizes raw headings outside [0, 360)", () => {
    const { heading } = advanceHeadingFilter(null, { heading: 720 + 45, absolute: true });
    expect(heading).toBe(45);
  });
});

describe("advanceHeadingFilter — sustained-unreliability tracking", () => {
  it("increments consecutiveHeld on each rejected relative sample after priming", () => {
    let acc = advanceHeadingFilter(null, { heading: 180, absolute: true });
    expect(acc.state.consecutiveHeld).toBe(0);
    acc = advanceHeadingFilter(acc.state, { heading: 0, absolute: false });
    expect(acc.state.consecutiveHeld).toBe(1);
    acc = advanceHeadingFilter(acc.state, { heading: 90, absolute: false });
    expect(acc.state.consecutiveHeld).toBe(2);
  });

  it("resets consecutiveHeld on a normal absolute sample", () => {
    let acc = advanceHeadingFilter(null, { heading: 180, absolute: true });
    acc = advanceHeadingFilter(acc.state, { heading: 0, absolute: false });
    acc = advanceHeadingFilter(acc.state, { heading: 0, absolute: false });
    expect(acc.state.consecutiveHeld).toBe(2);
    acc = advanceHeadingFilter(acc.state, { heading: 181, absolute: true });
    expect(acc.state.consecutiveHeld).toBe(0);
  });

  it("exposes a named threshold after which a held run is unstable", () => {
    expect(HEADING_UNSTABLE_AFTER_HELD).toBeGreaterThanOrEqual(3);
    let acc = advanceHeadingFilter(null, { heading: 180, absolute: true });
    for (let i = 0; i < HEADING_UNSTABLE_AFTER_HELD; i += 1) {
      acc = advanceHeadingFilter(acc.state, { heading: 0, absolute: false });
    }
    expect(acc.state.consecutiveHeld).toBeGreaterThanOrEqual(HEADING_UNSTABLE_AFTER_HELD);
  });
});

describe("advanceHeadingFilter — policy constants", () => {
  // The spec calls these out as named starting points; assert they exist and
  // are sensible so device-QA tuning happens against known values.
  it("exposes the documented outlier threshold, down-weight, and smoothing weight", () => {
    expect(HEADING_OUTLIER_THRESHOLD_DEGREES).toBe(45);
    expect(HEADING_OUTLIER_DOWNWEIGHT).toBeLessThan(HEADING_SMOOTHING_WEIGHT);
    expect(HEADING_SMOOTHING_WEIGHT).toBeLessThan(0.22); // tighter than pre-fix
  });
});

describe("advanceHeadingFilter — type/state shape", () => {
  it("returns a primed state with a normalized estimate after the first absolute sample", () => {
    const { state } = advanceHeadingFilter(null, { heading: -10, absolute: true });
    const primed = state as HeadingFilterState;
    expect(primed.primed).toBe(true);
    expect(primed.estimate).toBe(350);
    expect(primed.consecutiveHeld).toBe(0);
  });
});
