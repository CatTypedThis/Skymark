import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LOCATION_ACQUISITION_TIMEOUT_MS,
  distanceBetweenLocationFixes,
  shouldLocationRequestTimeout,
  stabilizeLocationFix,
  type LocationFix,
} from "@/lib/sensors/use-geolocation";

function fix(timestamp: number, overrides: Partial<LocationFix> = {}): LocationFix {
  return {
    latitude: 52.3676,
    longitude: 4.9041,
    accuracy: 12,
    timestamp,
    ...overrides,
  };
}

describe("geolocation acquisition timeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("times out when no GPS fix arrives during acquisition", () => {
    expect(shouldLocationRequestTimeout(null, 1000)).toBe(true);
    expect(shouldLocationRequestTimeout(fix(999), 1000)).toBe(true);
  });

  it("does not time out when a fresh fix arrives before the timer fires", () => {
    vi.useFakeTimers();
    const requestStartedAt = 1000;
    let latestFix: LocationFix | null = null;
    let timedOut = false;

    setTimeout(() => {
      if (shouldLocationRequestTimeout(latestFix, requestStartedAt)) {
        timedOut = true;
      }
    }, LOCATION_ACQUISITION_TIMEOUT_MS);

    latestFix = fix(1001);
    vi.advanceTimersByTime(LOCATION_ACQUISITION_TIMEOUT_MS);

    expect(timedOut).toBe(false);
  });

  it("keeps stable coordinates while refreshing timestamp for small GPS jitter", () => {
    const current = fix(1000);
    const jittered = fix(2000, {
      latitude: 52.36764,
      longitude: 4.90414,
      accuracy: 10,
    });

    expect(distanceBetweenLocationFixes(current, jittered)).toBeLessThan(8);

    const stabilized = stabilizeLocationFix(current, jittered);

    expect(stabilized.latitude).toBe(current.latitude);
    expect(stabilized.longitude).toBe(current.longitude);
    expect(stabilized.accuracy).toBe(jittered.accuracy);
    expect(stabilized.timestamp).toBe(jittered.timestamp);
  });

  it("accepts location fixes after meaningful movement", () => {
    const current = fix(1000);
    const moved = fix(2000, {
      latitude: 52.3681,
      longitude: 4.9041,
      accuracy: 10,
    });

    expect(distanceBetweenLocationFixes(current, moved)).toBeGreaterThan(35);
    expect(stabilizeLocationFix(current, moved)).toBe(moved);
  });
});
