import { describe, expect, it } from "vitest";
import { angularDifference, normalizeHeading } from "@/lib/geospatial/angles";
import { bearingBetween } from "@/lib/geospatial/bearing";
import { destinationPoint } from "@/lib/geospatial/destination";
import { mapBearingToOverlayX } from "@/lib/geospatial/overlay-position";
import { smoothHeading } from "@/lib/sensors/smoothing";

describe("geospatial utilities", () => {
  it("normalizes headings into the 0 to 360 range", () => {
    expect(normalizeHeading(361)).toBe(1);
    expect(normalizeHeading(-1)).toBe(359);
    expect(normalizeHeading(720)).toBe(0);
  });

  it("calculates signed angular difference across wraparound", () => {
    expect(angularDifference(359, 1)).toBe(2);
    expect(angularDifference(1, 359)).toBe(-2);
    expect(angularDifference(90, 270)).toBe(-180);
  });

  it("places a point roughly 100 meters north from the equator", () => {
    const destination = destinationPoint(0, 0, 0, 100);

    expect(destination.latitude).toBeCloseTo(0.000899, 5);
    expect(destination.longitude).toBeCloseTo(0, 5);
  });

  it("calculates an eastern bearing", () => {
    expect(bearingBetween(0, 0, 0, 0.001)).toBeCloseTo(90, 1);
  });

  it("maps visible and off-screen bearings", () => {
    const centered = mapBearingToOverlayX(1, 359, 60);
    expect(centered.visible).toBe(true);
    expect(centered.xPercent).toBeCloseTo(53.33, 1);

    const left = mapBearingToOverlayX(250, 0, 60);
    expect(left.visible).toBe(false);
    expect(left.direction).toBe("left");
  });

  it("smooths heading across north without jumping around 180 degrees", () => {
    const smoothed = smoothHeading(358, 2, 0.5);
    expect(smoothed < 10 || smoothed > 350).toBe(true);
  });
});
