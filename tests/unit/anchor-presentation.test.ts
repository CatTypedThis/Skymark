import { describe, expect, it } from "vitest";
import type { AnchorSource, BeaconConfidence } from "@/lib/beacons/beacon-types";
import {
  anchorConfidenceLabel,
  anchorSourceLabel,
  anchorStatusLabel,
} from "@/lib/beacons/anchor-presentation";

/**
 * Compact source/confidence label coverage for the selected-beacon and drawer
 * status vocabulary (SPEC-004 §8.2, ticket 01 acceptance: "compact user-facing
 * language such as Approximate / Low").
 */

describe("anchorSourceLabel", () => {
  const cases: Array<[AnchorSource, string]> = [
    ["camera", "Approximate"],
    ["metadata-enriched", "Map-backed"],
    ["map-cross-referenced", "Map-backed"],
    ["map-created", "Map-confirmed"],
    ["map-confirmed", "Map-confirmed"],
    ["map-adjusted", "Map-confirmed"],
    ["arcore-geospatial", "AR-anchored"],
    ["visual-refined", "Visually refined"],
  ];

  for (const [source, expected] of cases) {
    it(`maps ${source} to ${expected}`, () => {
      expect(anchorSourceLabel(source)).toBe(expected);
    });
  }
});

describe("anchorConfidenceLabel", () => {
  const cases: Array<[BeaconConfidence, string]> = [
    ["high", "High"],
    ["medium", "Medium"],
    ["low", "Low"],
    ["unknown", "Unknown"],
  ];

  for (const [confidence, expected] of cases) {
    it(`maps ${confidence} to ${expected}`, () => {
      expect(anchorConfidenceLabel(confidence)).toBe(expected);
    });
  }
});

describe("anchorStatusLabel", () => {
  it("renders the compact two-part status for a low-confidence camera anchor", () => {
    expect(anchorStatusLabel("camera", "low")).toBe("Approximate / Low");
  });

  it("renders the compact two-part status for a high-confidence camera anchor", () => {
    expect(anchorStatusLabel("camera", "high")).toBe("Approximate / High");
  });

  it("uses the confidence label as the second segment", () => {
    expect(anchorStatusLabel("camera", "unknown")).toBe("Approximate / Unknown");
  });
});
