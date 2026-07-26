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

/**
 * BUG-12: the overlay must route saved-beacon bearings through the render-
 * bearing resolver so an existing camera anchor does not jump when a later
 * placement accepts a different GPS origin. These tests hold the saved record
 * and camera heading constant and vary only the live location fix.
 *
 * Fixture: a camera beacon placed due north (heading 0), 100 m from the origin.
 * With the user facing north (heading 0) the stored placement bearing is dead
 * ahead (overlay xPercent 50). GPS fixes shifted laterally from the placement
 * origin simulate the "later placement refreshes GPS" interaction.
 */
describe("BeaconOverlay — saved-beacon render-bearing resolver (BUG-12)", () => {
  // 1 degree of longitude at the equator, in meters.
  const METERS_PER_DEGREE_LON = 111_194.92664455874;
  const PLACEMENT_HEADING = 0;
  const PLACEMENT_DISTANCE = 100;

  // Destination 100 m due north of (0,0) — built from the real projection so
  // it tracks destination.ts exactly.
  function placementDestination() {
    return { latitude: 0.0008993216059187306, longitude: 0 };
  }

  function makeCameraBeacon(overrides: Partial<BeaconRecord> = {}): BeaconRecord {
    const dest = placementDestination();
    return {
      id: "b1",
      slot: 1,
      name: "Trailhead",
      color: "cyan",
      latitude: dest.latitude,
      longitude: dest.longitude,
      confidence: "high",
      anchorSource: "camera",
      placementHeading: PLACEMENT_HEADING,
      placementDistanceMeters: PLACEMENT_DISTANCE,
      created: "2026-01-01T00:00:00.000Z",
      updated: "2026-01-01T00:00:00.000Z",
      ...overrides,
    };
  }

  function renderOverlay(location: LocationFix, beacon: BeaconRecord) {
    const view = render(
      <BeaconOverlay
        beacons={[beacon]}
        preview={null}
        location={location}
        heading={0}
        pitch={90}
        selectedBeaconId={null}
        onSelectBeacon={() => {}}
      />,
    );
    // The in-frame beacon pillar is a button labeled with the beacon name.
    const pillar = screen.getByRole("button", { name: /Trailhead/ });
    return { pillar, view };
  }

  function pillarLeftPercent(pillar: HTMLElement): number {
    const style = pillar.getAttribute("style") ?? "";
    const match = style.match(/left:\s*([-\d.]+)%/);
    if (!match) {
      throw new Error(`No left percentage found in pillar style: ${style}`);
    }
    return Number.parseFloat(match[1]);
  }

  it("keeps a saved camera beacon centered for its stored world heading under a nearby shifted fix", () => {
    const beacon = makeCameraBeacon();
    // 20 m east of the placement origin — inside the lock radius.
    const shifted: LocationFix = {
      latitude: 0,
      longitude: 20 / METERS_PER_DEGREE_LON,
      accuracy: 5,
      timestamp: 0,
    };
    const { pillar } = renderOverlay(shifted, beacon);
    // Stored heading 0 with the user facing 0 is dead center.
    expect(pillarLeftPercent(pillar)).toBeCloseTo(50, 1);
  });

  it("stays within the 10-percentage-point budget across a representative 55 m lateral fix change", () => {
    const beacon = makeCameraBeacon();
    // A single accepted fix jumping directly from the placement origin to 55 m
    // east. Without the resolver this would land near xPercent 2 (a ~48 pp
    // jump); the resolver must keep it within 10 pp of the stored 50%.
    const shifted: LocationFix = {
      latitude: 0,
      longitude: 55 / METERS_PER_DEGREE_LON,
      accuracy: 5,
      timestamp: 0,
    };
    const { pillar } = renderOverlay(shifted, beacon);
    expect(Math.abs(pillarLeftPercent(pillar) - 50)).toBeLessThanOrEqual(10);
  });

  it("switches to the live-bearing off-screen presentation after material travel", () => {
    const beacon = makeCameraBeacon();
    // Far enough that the resolver hands off to the live bearing. The direct
    // bearing from this fix to the beacon is ~264 deg, well outside the 60 deg
    // FOV, so the overlay renders the off-screen indicator instead of a pillar.
    const distant: LocationFix = { latitude: 0.001, longitude: 0.001, accuracy: 5, timestamp: 0 };
    render(
      <BeaconOverlay
        beacons={[beacon]}
        preview={null}
        location={distant}
        heading={0}
        pitch={90}
        selectedBeaconId={null}
        onSelectBeacon={() => {}}
      />,
    );
    const indicator = screen.getByLabelText(/Trailhead/);
    expect(indicator.className).toContain("left");
    expect(indicator).toHaveAttribute(
      "aria-label",
      "Trailhead is off screen, to the left",
    );
  });

  it("uses the live coordinate bearing for a non-camera anchor with otherwise identical placement metadata", () => {
    // Same placement metadata as the camera beacon, but a map-backed source
    // whose coordinates must not be overridden by the historical placement
    // heading. At 30 m east the direct bearing is ~343 deg -> in-FOV pillar at
    // ~22% (vs. the 50% a misplaced lock would produce).
    const beacon = makeCameraBeacon({ anchorSource: "map-created" });
    const shifted: LocationFix = {
      latitude: 0,
      longitude: 30 / METERS_PER_DEGREE_LON,
      accuracy: 5,
      timestamp: 0,
    };
    const { pillar } = renderOverlay(shifted, beacon);
    const xPercent = pillarLeftPercent(pillar);
    // Live-bearing presentation (~22%), not the locked 50%.
    expect(xPercent).toBeCloseTo(22.17, 0);
    expect(Math.abs(xPercent - 50)).toBeGreaterThan(10);
  });
});
