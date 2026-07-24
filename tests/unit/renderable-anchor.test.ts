import { describe, expect, it } from "vitest";
import { resolveRenderableAnchor } from "@/lib/beacons/renderable-anchor";
import type { BeaconRecord } from "@/lib/beacons/beacon-types";

/**
 * Coverage for the composition seam BeaconOverlay consumes: a pure, deterministic
 * frame resolver that combines horizontal visibility, pitch availability, and
 * base visibility into the presentation the overlay needs (ticket 03, AC line 1).
 *
 * The overlay renders OffscreenIndicator when frame.inView is false and a
 * BeaconPillar otherwise, passing frame.bottomPercent / baseStrength /
 * verticalHint and the anchor's sourceLabel. These tests pin that contract across
 * the AC conditions: base, middle, upper, horizontally outside, pitch-unavailable.
 */

const cameraBeacon: Pick<
  BeaconRecord,
  "anchorSource" | "anchorConfidence" | "confidence"
> = {
  anchorSource: "camera",
  anchorConfidence: "low",
  confidence: "low",
};

describe("resolveRenderableAnchor — overlay seam", () => {
  it("reports the camera anchor source label and full provenance status", () => {
    const result = resolveRenderableAnchor(cameraBeacon, true, 30);
    expect(result.sourceLabel).toBe("Approximate");
    expect(result.statusLabel).toBe("Approximate / Low");
    expect(result.baseVisibility).toBe("approximated");
  });

  it("renders the BASE pose in view with full base strength (look-down)", () => {
    // beta ~30: the base rests at the bottom of the screen, shaft rising upward.
    const result = resolveRenderableAnchor(cameraBeacon, true, 30);
    expect(result.frame.inView).toBe(true);
    expect(result.frame.baseStrength).toBe(1);
    expect(result.frame.verticalHint).toBeNull();
  });

  it("keeps the beacon in view at the MIDDLE / horizon pose with full strength", () => {
    // beta ~84 = horizon (verified device reading). Still in view, no early fade.
    const result = resolveRenderableAnchor(cameraBeacon, true, 84);
    expect(result.frame.inView).toBe(true);
    expect(result.frame.baseStrength).toBe(1);
  });

  it("keeps full strength at the UPPER aim-up pose", () => {
    // beta ~143 = user's aim-up reading. Column sliding, still full strength.
    const result = resolveRenderableAnchor(cameraBeacon, true, 143);
    expect(result.frame.inView).toBe(true);
    expect(result.frame.baseStrength).toBe(1);
  });

  it("is OUT OF VIEW when horizontally outside the FOV (off-screen indicator)", () => {
    const result = resolveRenderableAnchor(cameraBeacon, false, 84);
    expect(result.frame.inView).toBe(false);
    expect(result.frame.baseStrength).toBe(0);
    expect(result.frame.verticalHint).toBe("center");
  });

  it("keeps a stable heading-only presentation in view when pitch is unavailable", () => {
    const result = resolveRenderableAnchor(cameraBeacon, true, null);
    expect(result.frame.inView).toBe(true);
    expect(result.frame.pitchQuality).toBe("heading-only");
    expect(result.frame.baseStrength).toBe(1);
    // Does not break placement: still in view with a full column.
    expect(result.frame.verticalHint).toBeNull();
  });

  it("never claims definite base visibility for the camera anchor", () => {
    // The first slice has no validated obstruction evidence, so the render base
    // visibility is always approximated — never rendered as definite ground.
    for (const pitch of [10, 30, 84, 143, 160] as const) {
      const result = resolveRenderableAnchor(cameraBeacon, true, pitch);
      expect(result.baseVisibility).toBe("approximated");
    }
  });

  it("preserves strength across the full visible beta range and fades only past it", () => {
    // AC: base / middle / upper all stay visible; only panning well past the
    // upper pose fades out and surfaces a 'raise' hint.
    expect(resolveRenderableAnchor(cameraBeacon, true, 155).frame.baseStrength).toBe(1);
    expect(resolveRenderableAnchor(cameraBeacon, true, 165).frame.baseStrength).toBe(0);
    expect(resolveRenderableAnchor(cameraBeacon, true, 165).frame.verticalHint).toBe("raise");
  });
});
