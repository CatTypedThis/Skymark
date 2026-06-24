import { expect, test, type Page } from "@playwright/test";

const ONBOARDING_KEY = "sky-beacon:onboarding-complete";
const BEACON_STORAGE_KEY = "sky-beacon:saved-beacons";

declare global {
  interface Window {
    __cameraRequestCount?: number;
    __geoRequestCount?: number;
    __orientationRequestCount?: number;
  }
}

type CounterKey = "__cameraRequestCount" | "__geoRequestCount" | "__orientationRequestCount";

function savedBeacon(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "test-beacon-1",
    slot: 1,
    name: "Beacon 01",
    color: "cyan",
    latitude: 52.3676,
    longitude: 4.9041,
    confidence: "high",
    placementHeading: 90,
    placementDistanceMeters: 100,
    locationAccuracyMeters: 12,
    headingAccuracy: "test",
    headingStability: "stable",
    created: "2026-06-10T12:00:00.000Z",
    updated: "2026-06-10T12:00:00.000Z",
    ...overrides,
  };
}

async function resetAppStorage(page: Page) {
  await page.evaluate(
    ({ onboardingKey, storageKey }) => {
      window.localStorage.removeItem(onboardingKey);
      window.localStorage.removeItem(storageKey);
    },
    { onboardingKey: ONBOARDING_KEY, storageKey: BEACON_STORAGE_KEY },
  );
}

async function reloadWithCompletedOnboarding(page: Page) {
  await page.goto("/");
  await page.evaluate((key) => {
    window.localStorage.setItem(key, "true");
  }, ONBOARDING_KEY);
  await page.reload();
}

async function reloadWithBeacons(page: Page, beacons: ReturnType<typeof savedBeacon>[]) {
  await page.goto("/");
  await page.evaluate(
    ({ onboardingKey, storageKey, records }) => {
      window.localStorage.setItem(onboardingKey, "true");
      window.localStorage.setItem(storageKey, JSON.stringify(records));
    },
    { onboardingKey: ONBOARDING_KEY, storageKey: BEACON_STORAGE_KEY, records: beacons },
  );
  await page.reload();
}

async function installCameraRejection(page: Page, message = "Camera permission denied by test") {
  await page.evaluate((errorMessage) => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () => Promise.reject(new Error(errorMessage)),
      },
    });
  }, message);
}

async function installCountingCamera(page: Page, result: "granted" | "denied", message = "Camera denied from status chip") {
  await page.evaluate(
    ({ cameraResult, errorMessage }) => {
      window.__cameraRequestCount = 0;
      Object.defineProperty(HTMLMediaElement.prototype, "play", {
        configurable: true,
        value: () => Promise.resolve(),
      });
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: () => {
            window.__cameraRequestCount = (window.__cameraRequestCount ?? 0) + 1;
            if (cameraResult === "granted") {
              return Promise.resolve(new MediaStream());
            }
            return Promise.reject(new Error(errorMessage));
          },
        },
      });
    },
    { cameraResult: result, errorMessage: message },
  );
}

async function installCountingGeolocation(page: Page, result: "granted" | "denied") {
  await page.evaluate((geoResult) => {
    window.__geoRequestCount = 0;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        watchPosition: (success: PositionCallback, error?: PositionErrorCallback) => {
          window.__geoRequestCount = (window.__geoRequestCount ?? 0) + 1;
          const watchId = window.__geoRequestCount;
          window.setTimeout(() => {
            if (geoResult === "granted") {
              success({
                coords: {
                  latitude: 52.3676,
                  longitude: 4.9041,
                  accuracy: 12,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                },
                timestamp: Date.now(),
              });
              return;
            }

            error?.({
              code: 1,
              message: "GPS denied from status chip",
              PERMISSION_DENIED: 1,
              POSITION_UNAVAILABLE: 2,
              TIMEOUT: 3,
            } as GeolocationPositionError);
          }, 0);
          return watchId;
        },
        clearWatch: () => undefined,
      },
    });
  }, result);
}

async function installCountingOrientation(page: Page, result: "granted" | "denied") {
  await page.evaluate((orientationResult) => {
    window.__orientationRequestCount = 0;

    class TestDeviceOrientationEvent extends Event {
      static requestPermission() {
        window.__orientationRequestCount = (window.__orientationRequestCount ?? 0) + 1;
        return Promise.resolve(orientationResult);
      }
    }

    Object.defineProperty(window, "DeviceOrientationEvent", {
      configurable: true,
      value: TestDeviceOrientationEvent,
    });
  }, result);
}

async function dispatchCompassReading(page: Page) {
  await page.evaluate(() => {
    const event = new Event("deviceorientation") as DeviceOrientationEvent;
    Object.defineProperties(event, {
      alpha: { value: 45 },
      beta: { value: null },
      gamma: { value: null },
      absolute: { value: true },
    });
    window.dispatchEvent(event);
  });
}

async function readCounter(page: Page, key: CounterKey) {
  return page.evaluate((counterKey) => window[counterKey] ?? 0, key);
}

async function installInsecureContext(page: Page) {
  await page.addInitScript(() => {
    try {
      Object.defineProperty(window, "isSecureContext", {
        configurable: true,
        value: false,
      });
    } catch {
      // Some browsers expose this as read-only; the platform unit tests cover the pure fallback.
    }

    try {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: undefined,
      });
    } catch {
      // The test only needs to verify secure-context messaging when the override is accepted.
    }
  });
}

function collectHydrationErrors(page: Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return errors;
}

function expectNoHydrationErrors(errors: string[]) {
  expect(
    errors.filter(
      (error) =>
        error.includes("Hydration failed") ||
        error.includes("server rendered HTML didn't match the client"),
    ),
  ).toEqual([]);
}

test("opens first-run onboarding and falls back when the camera is unavailable", async ({ page }) => {
  await page.goto("/");
  await resetAppStorage(page);
  await page.reload();
  await installCameraRejection(page);

  await expect(page.getByRole("heading", { name: "A camera instrument for outdoor markers" })).toBeVisible();
  await page.getByRole("button", { name: "Enter camera" }).click();

  await expect(page.getByRole("heading", { name: "Open camera view" })).toBeVisible();
  await expect(page.getByText("Camera permission denied by test")).toBeVisible();
  await expect(page.getByLabel("Sensor status")).toBeVisible();
});

test("persists drawer edits across reloads", async ({ page }) => {
  await reloadWithBeacons(page, [savedBeacon()]);

  await page.getByRole("button", { name: "Open beacon drawer" }).click();
  await expect(page.getByRole("heading", { name: "Beacon drawer" })).toBeVisible();
  await expect(page.getByText("Beacon 01")).toBeVisible();

  await page.getByLabel("Beacon name").fill("Harbor marker");
  await page.getByLabel("Beacon name").press("Enter");

  await expect
    .poll(() =>
      page.evaluate(
        ({ storageKey }) => window.localStorage.getItem(storageKey),
        { storageKey: BEACON_STORAGE_KEY },
      ),
    )
    .toContain("Harbor marker");

  await page.reload();
  await page.getByRole("button", { name: "Open beacon drawer" }).click();
  await expect(page.getByText("Harbor marker")).toBeVisible();
});

test("clears saved beacons from the local drawer", async ({ page }) => {
  await reloadWithBeacons(page, [savedBeacon()]);

  await page.getByRole("button", { name: "Open beacon drawer" }).click();
  await page.getByRole("button", { name: "Clear all beacons" }).click();
  await expect(page.getByRole("alertdialog", { name: "Clear all beacons?" })).toBeVisible();
  await page.getByRole("button", { name: "Clear all" }).click();

  await expect(page.getByText("No active beacons yet")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        ({ storageKey }) => window.localStorage.getItem(storageKey),
        { storageKey: BEACON_STORAGE_KEY },
      ),
    )
    .toContain("deletedAt");
});

test("keeps local testing usable and shows a helpful camera error when permission is denied", async ({ page }) => {
  await reloadWithCompletedOnboarding(page);

  await expect(page.getByText("Camera access requires HTTPS. Please use a secure HTTPS connection.")).toHaveCount(0);
  await expect(page.getByText("Camera and sensor features require HTTPS. Please use a secure HTTPS connection.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start camera" })).toBeVisible();

  await installCameraRejection(page, "Permission denied from smoke test");

  await page.getByRole("button", { name: "Start camera" }).click();

  await expect(page.getByRole("heading", { name: "Open camera view" })).toBeVisible();
  await expect(page.getByText("Permission denied from smoke test")).toBeVisible();
});

test("retries denied permissions from the top status chips", async ({ page }) => {
  await reloadWithCompletedOnboarding(page);

  await expect(page.getByRole("button", { name: "Camera permission" })).toBeVisible();
  await expect(page.getByRole("button", { name: "GPS permission" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Compass permission" })).toBeVisible();

  await installCountingCamera(page, "denied");
  await page.getByRole("button", { name: "Camera permission" }).click();
  await expect(page.getByText("Camera denied from status chip")).toBeVisible();
  expect(await readCounter(page, "__cameraRequestCount")).toBe(1);
  await page.getByRole("button", { name: "Camera permission" }).click();
  await expect.poll(() => readCounter(page, "__cameraRequestCount")).toBe(2);

  await installCountingGeolocation(page, "denied");
  await page.getByRole("button", { name: "GPS permission" }).click();
  await expect(page.getByText("GPS blocked")).toBeVisible();
  expect(await readCounter(page, "__geoRequestCount")).toBe(1);
  await page.getByRole("button", { name: "GPS permission" }).click();
  await expect.poll(() => readCounter(page, "__geoRequestCount")).toBe(2);

  await installCountingOrientation(page, "denied");
  await page.getByRole("button", { name: "Compass permission" }).click();
  await expect(page.getByText("Compass blocked")).toBeVisible();
  expect(await readCounter(page, "__orientationRequestCount")).toBe(1);
  await page.getByRole("button", { name: "Compass permission" }).click();
  await expect.poll(() => readCounter(page, "__orientationRequestCount")).toBe(2);
});

test("top status chips report when permissions are already active", async ({ page }) => {
  await reloadWithCompletedOnboarding(page);

  await installCountingCamera(page, "granted");
  await page.getByRole("button", { name: "Camera permission" }).click();
  await expect(page.getByText("Camera live")).toBeVisible();
  await page.getByRole("button", { name: "Camera permission" }).click();
  await expect(page.getByText("Camera permission already granted")).toBeVisible();

  await installCountingGeolocation(page, "granted");
  await page.getByRole("button", { name: "GPS permission" }).click();
  await expect(page.getByText("GPS fix")).toBeVisible();
  await page.getByRole("button", { name: "GPS permission" }).click();
  await expect(page.getByText("GPS permission already granted")).toBeVisible();

  await installCountingOrientation(page, "granted");
  await page.getByRole("button", { name: "Compass permission" }).click();
  await expect.poll(() => readCounter(page, "__orientationRequestCount")).toBe(1);
  await dispatchCompassReading(page);
  await expect(page.getByText("NW 315 deg")).toBeVisible();
  await page.getByRole("button", { name: "Compass permission" }).click();
  await expect(page.getByText("Compass permission already granted")).toBeVisible();
});

test("shows HTTPS camera guidance instead of unsupported copy in an insecure context", async ({ page }) => {
  const errors = collectHydrationErrors(page);

  await installInsecureContext(page);
  await reloadWithCompletedOnboarding(page);

  await expect(page.getByRole("heading", { name: "Open camera view" })).toBeVisible();
  await expect(page.getByText("Camera access requires HTTPS. Please use a secure HTTPS connection.")).toBeVisible();
  await expect(page.getByText("Camera unsupported")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start camera" })).toHaveCount(0);
  expectNoHydrationErrors(errors);
});

test("keeps non-sensor controls interactive on insecure local HTTP", async ({ page }) => {
  const errors = collectHydrationErrors(page);

  await installInsecureContext(page);
  await reloadWithCompletedOnboarding(page);

  await page.getByRole("button", { name: "Open beacon drawer" }).click();
  await expect(page.getByRole("heading", { name: "Beacon drawer" })).toBeVisible();
  await page.getByRole("button", { name: "Close drawer" }).click();
  await expect(page.getByRole("heading", { name: "Beacon drawer" })).toHaveCount(0);

  await page.getByRole("button", { name: "Request GPS and compass" }).click();
  await expect(page.getByText("GPS blocked")).toBeVisible();
  await expect(page.getByText("Compass blocked")).toBeVisible();
  await expect(page.getByText("Camera unsupported")).toHaveCount(0);
  expectNoHydrationErrors(errors);
});

test("renders a legacy seeded beacon with approximate anchor status", async ({ page }) => {
  // A record shaped like a pre-upgrade save: no anchorSource/anchorConfidence.
  await reloadWithBeacons(page, [savedBeacon()]);

  await page.getByRole("button", { name: "Open beacon drawer" }).click();
  await expect(page.getByRole("heading", { name: "Beacon drawer" })).toBeVisible();
  // Legacy records normalize to an approximate camera anchor (SPEC-004 §8.1).
  // Scope to the drawer row so it does not collide with the editor status.
  await expect(page.locator(".drawer-row").filter({ hasText: "Beacon 01" })).toContainText(
    /Approximate \/ High/i,
  );
});

test("shows approximate status in the selected-beacon editor", async ({ page }) => {
  await reloadWithBeacons(page, [savedBeacon({ confidence: "low" })]);

  await page.getByRole("button", { name: "Open beacon drawer" }).click();
  await page.getByRole("button", { name: "Select Beacon 01" }).click();
  // Editor surfaces the compact source/confidence status label.
  await expect(page.locator(".editor-status")).toContainText(/Approximate \/ Low/i);
});
