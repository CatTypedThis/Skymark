/**
 * Integration DOM tests for BeaconOverlay wiring (Ticket 04).
 *
 * The pure selector (resolveOffscreenGuidance) and the OffscreenIndicator
 * component each have their own tests. This file covers the glue between them:
 * does BeaconOverlay actually route an out-of-frame beacon to the off-screen
 * indicator, pick the right edge + vertical cue, center a horizontally-in-FOV
 * vertical miss (the bug fixed in Ticket 04), guide the preview beacon, and
 * stagger multiple same-edge indicators?
 *
 * Geometry used (user at origin, facing north / heading 0, default 60deg FOV):
 *   - bearing  40  -> +40deg diff  -> outside FOV, direction "right"
 *   - bearing 320  -> -40deg diff  -> outside FOV, direction "left"
 *   - bearing   0  ->    0deg diff -> in FOV, direction "center"
 * Pitch (DeviceOrientationEvent.beta): >= FADE_END_BETA (165) -> verticalHint "raise".
 */
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { BeaconOverlay } from "@/components/beacons/BeaconOverlay";
import type { BeaconRecord } from "@/lib/beacons/beacon-types";
import type { LocationFix } from "@/lib/sensors/use-geolocation";

const origin: LocationFix = {
  latitude: 0,
  longitude: 0,
  accuracy: 5,
  timestamp: 0,
};

function makeBeacon(overrides: Partial<BeaconRecord> = {}): BeaconRecord {
  return {
    id: "b1",
    slot: 1,
    name: "Trailhead",
    color: "cyan",
    latitude: 0,
    longitude: 0,
    confidence: "high",
    placementDistanceMeters: 10,
    created: "2026-01-01T00:00:00.000Z",
    updated: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("BeaconOverlay — off-screen guidance wiring", () => {
  it("routes a horizontally-outside beacon to a chevron indicator (AC1, AC2)", () => {
    // Bearing 40deg from heading 0 -> outside the 60deg FOV, to the right.
    const beacon = makeBeacon({ id: "right", latitude: 0, longitude: 0.0001 });
    render(
      <BeaconOverlay
        beacons={[beacon]}
        preview={null}
        location={origin}
        heading={0}
        pitch={90}
        selectedBeaconId={null}
        onSelectBeacon={() => {}}
      />,
    );
    const indicator = screen.getByLabelText(/Trailhead/);
    expect(indicator.className).toContain("right");
    expect(indicator).toHaveAttribute(
      "aria-label",
      "Trailhead is off screen, to the right",
    );
  });

  it("centers a horizontally-in-FOV vertical miss and guides up (AC3, bug fix)", () => {
    // Dead ahead (bearing 0) but panned fully to the sky (pitch 180 -> the
    // column cap exits the top of the frame -> inView false, verticalHint
    // "raise"). The old code force-coerced this to an arbitrary "right"
    // chevron; it must center.
    const beacon = makeBeacon({ id: "ahead", latitude: 0.0001, longitude: 0 });
    render(
      <BeaconOverlay
        beacons={[beacon]}
        preview={null}
        location={origin}
        heading={0}
        pitch={180}
        selectedBeaconId={null}
        onSelectBeacon={() => {}}
      />,
    );
    const indicator = screen.getByLabelText(/Trailhead/);
    expect(indicator.className).toContain("center");
    expect(indicator).toHaveAttribute(
      "aria-label",
      "Trailhead is off screen, look up",
    );
    // No horizontal chevron for a centered edge.
    expect(within(indicator).queryByRole("img")).toBeNull();
  });

  it("routes an out-of-frame preview beacon to off-screen guidance, not a pillar (AC1)", () => {
    render(
      <BeaconOverlay
        beacons={[]}
        preview={{ color: "amber", confidence: "high" }}
        location={origin}
        heading={0}
        pitch={180}
        selectedBeaconId={null}
        onSelectBeacon={() => {}}
      />,
    );
    // Preview beacon is always horizontally centered; panned to the sky it
    // should guide up rather than render an in-frame column.
    const preview = screen.getByLabelText(/Preview beacon/);
    expect(preview.className).toContain("center");
    expect(preview).toHaveAttribute(
      "aria-label",
      "Preview beacon is off screen, look up",
    );
  });

  it("stagger-offsets two same-edge indicators so they do not collide (AC6)", () => {
    // Two beacons, both to the right and outside the FOV -> both "right" edge.
    const b1 = makeBeacon({ id: "r1", name: "Ridge", longitude: 0.0001 });
    const b2 = makeBeacon({ id: "r2", name: "Creek", longitude: 0.0002 });
    render(
      <BeaconOverlay
        beacons={[b1, b2]}
        preview={null}
        location={origin}
        heading={0}
        pitch={90}
        selectedBeaconId={null}
        onSelectBeacon={() => {}}
      />,
    );
    const ridge = screen.getByLabelText(/Ridge/);
    const creek = screen.getByLabelText(/Creek/);
    // Both land on the right edge ...
    expect(ridge.className).toContain("right");
    expect(creek.className).toContain("right");
    // ... but at distinct vertical offsets (one above, one below the base line).
    const ridgeStagger = ridge.getAttribute("style") ?? "";
    const creekStagger = creek.getAttribute("style") ?? "";
    expect(ridgeStagger).toMatch(/--stagger/);
    expect(creekStagger).toMatch(/--stagger/);
    expect(ridgeStagger).not.toBe(creekStagger);
  });
});
