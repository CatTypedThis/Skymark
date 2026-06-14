import { describe, expect, it } from "vitest";
import {
  readHeadingFromOrientation,
  tiltCompensatedHeading,
} from "@/lib/sensors/orientation-heading";

describe("orientation heading derivation", () => {
  it("uses iOS compass heading when available", () => {
    expect(
      readHeadingFromOrientation({
        webkitCompassHeading: 721,
        webkitCompassAccuracy: 11.6,
      }),
    ).toEqual({
      heading: 1,
      accuracyLabel: "12 deg",
    });
  });

  it("falls back to alpha when tilt values are unavailable", () => {
    expect(readHeadingFromOrientation({ alpha: 60, absolute: true })).toEqual({
      heading: 300,
      accuracyLabel: "absolute",
    });
  });

  it("compensates alpha readings with beta and gamma tilt", () => {
    const rawAlphaHeading = readHeadingFromOrientation({ alpha: 60 }).heading;
    const compensated = readHeadingFromOrientation({
      alpha: 60,
      beta: 90,
      gamma: 25,
      absolute: true,
    }).heading;

    expect(rawAlphaHeading).toBe(300);
    expect(compensated).toBeCloseTo(275, 5);
  });

  it("returns null when tilt compensation cannot resolve a compass vector", () => {
    expect(tiltCompensatedHeading(0, 0, 0)).toBeNull();
  });
});
