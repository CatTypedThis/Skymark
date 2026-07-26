/**
 * Hook-level coverage for useOrientation (BUG-13 Task 5).
 *
 * Drives the hook with scripted orientation events through real
 * `window.dispatchEvent` and asserts the published `heading` and `stability`:
 *   - absolute=true steady → stable heading
 *   - absolute=false intruder (the BUG-13 failure mode) → heading unchanged
 *   - absolute=true outlier → heading barely moves
 *   - genuine turn → heading tracks
 *   - deviceorientationabsolute is the preferred absolute source
 *   - pitch (beta) is published even when the heading sample is rejected
 */
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useOrientation } from "@/lib/sensors/use-orientation";

// jsdom does not ship DeviceOrientationEvent. Define a minimal constructor
// that carries the fields the hook reads (alpha/beta/gamma/absolute and the
// iOS webkit fields), and lets us set `absolute`.
type OrientationEventInit = {
  alpha?: number | null;
  beta?: number | null;
  gamma?: number | null;
  absolute?: boolean;
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
};

class StubDeviceOrientationEvent extends Event {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute: boolean;
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;

  constructor(type: string, init: OrientationEventInit = {}) {
    super(type);
    this.alpha = init.alpha ?? null;
    this.beta = init.beta ?? null;
    this.gamma = init.gamma ?? null;
    this.absolute = init.absolute ?? false;
    if (init.webkitCompassHeading !== undefined) {
      this.webkitCompassHeading = init.webkitCompassHeading;
    }
    if (init.webkitCompassAccuracy !== undefined) {
      this.webkitCompassAccuracy = init.webkitCompassAccuracy;
    }
  }
}

function fireDeviceOrientation(init: OrientationEventInit = {}) {
  window.dispatchEvent(new StubDeviceOrientationEvent("deviceorientation", init));
}

function fireAbsolute(init: OrientationEventInit = {}) {
  window.dispatchEvent(new StubDeviceOrientationEvent("deviceorientationabsolute", init));
}

async function requestReady() {
  // The hook needs permission on iOS-guarded browsers; jsdom has no
  // requestPermission, so the hook's listener attaches directly via the
  // generic path. We call requestOrientation to flip status and attach.
  const { result } = renderHook(() => useOrientation());
  await act(async () => {
    await result.current.requestOrientation();
  });
  return result;
}

describe("useOrientation — BUG-13 absolute/relative gate", () => {
  beforeEach(() => {
    // Ensure the stub constructor is visible to the hook's feature detection.
    (window as unknown as { DeviceOrientationEvent?: unknown }).DeviceOrientationEvent =
      StubDeviceOrientationEvent;
  });

  afterEach(() => {
    delete (window as unknown as { DeviceOrientationEvent?: unknown }).DeviceOrientationEvent;
  });

  it("publishes a stable heading from absolute readings and ignores absolute=false intruders", async () => {
    const result = await requestReady();

    // Prime with an absolute reading.
    act(() => fireDeviceOrientation({ alpha: 180, beta: 60, gamma: 0, absolute: true }));
    expect(result.current.heading).toBeCloseTo(180, 0);

    // Bombard with relative readings carrying unrelated values. The estimate
    // must not move toward them.
    act(() => {
      fireDeviceOrientation({ alpha: 10, beta: 60, gamma: 0, absolute: false });
      fireDeviceOrientation({ alpha: 90, beta: 60, gamma: 0, absolute: false });
      fireDeviceOrientation({ alpha: 0, beta: 60, gamma: 0, absolute: false });
    });
    expect(result.current.heading).toBeCloseTo(180, 0);
  });

  it("barely moves on a single absolute outlier ~180 degrees off", async () => {
    const result = await requestReady();

    act(() => fireDeviceOrientation({ alpha: 0, beta: 60, gamma: 0, absolute: true }));
    expect(result.current.heading).toBeCloseTo(0, 0);

    act(() => fireDeviceOrientation({ alpha: 180, beta: 60, gamma: 0, absolute: true }));
    // Outlier down-weight keeps the move small (<= 10 deg, not ~40 deg).
    const moved = Math.abs(((result.current.heading ?? 0) - 0 + 540) % 360 - 180);
    expect(moved).toBeLessThanOrEqual(10);
  });

  it("tracks a genuine turn across a run of consistent absolute readings", async () => {
    const result = await requestReady();

    act(() => fireDeviceOrientation({ alpha: 0, beta: 60, gamma: 0, absolute: true }));
    // Turn slowly: many small (2-degree) steps so each per-event delta stays
    // well under the outlier threshold. Real device rotation at high sampling
    // rate looks like this; a fast 10-deg/event ramp would (correctly) trip
    // the outlier gate and stall, which is the protective behavior we want.
    // The ramp overshoots the 90-degree target slightly so the lagging
    // smoothed estimate has room to cross the assertion threshold.
    for (let h = 2; h <= 110; h += 2) {
      act(() => fireDeviceOrientation({ alpha: 360 - h, beta: 60, gamma: 0, absolute: true }));
    }
    expect(result.current.heading).toBeGreaterThan(80);
  });

  it("prefers deviceorientationabsolute over the generic deviceorientation source", async () => {
    const result = await requestReady();

    // Generic relative reading should be ignored.
    act(() => fireDeviceOrientation({ alpha: 200, beta: 60, gamma: 0, absolute: false }));
    expect(result.current.heading).toBeNull();

    // The dedicated absolute event primes the estimate. With beta=60 the
    // tilt-compensated heading for alpha=270 is 90 (heading h needs alpha=360-h).
    act(() => fireAbsolute({ alpha: 270, beta: 60, gamma: 0 }));
    expect(result.current.heading).toBeCloseTo(90, 0);
  });

  it("reports unstable after a sustained run of rejected relative readings", async () => {
    const result = await requestReady();

    act(() => fireDeviceOrientation({ alpha: 180, beta: 60, gamma: 0, absolute: true }));
    expect(result.current.stability).not.toBe("unstable");

    // Sustained run of relative intruders must flip stability to unstable so
    // the calibration prompt can fire (BUG-13 Task 3).
    act(() => {
      for (let i = 0; i < 8; i += 1) {
        fireDeviceOrientation({ alpha: i * 40, beta: 60, gamma: 0, absolute: false });
      }
    });
    expect(result.current.stability).toBe("unstable");
  });

  it("still publishes pitch (beta) when the heading sample is rejected", async () => {
    const result = await requestReady();

    // A relative reading before any absolute primer should not produce a
    // heading but should still publish pitch so vertical framing stays live.
    act(() => fireDeviceOrientation({ alpha: 50, beta: 120, gamma: 5, absolute: false }));
    expect(result.current.heading).toBeNull();
    expect(result.current.pitch).toBe(120);
  });
});
