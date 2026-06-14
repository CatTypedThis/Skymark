import { describe, expect, it } from "vitest";
import {
  detectPlatform,
  detectPlatformFromEnvironment,
  getHTTPSRequiredMessage,
  type PlatformInfo,
} from "@/lib/utils/platform";

const ANDROID_CHROME_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36";
const IOS_SAFARI_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1";

function messageFor(platform: Partial<PlatformInfo>) {
  return getHTTPSRequiredMessage({
    isIOS: false,
    isSafari: false,
    isInsecureContext: false,
    requiresHTTPSForSensors: false,
    ...platform,
  });
}

describe("platform secure-context detection", () => {
  it("keeps HTTPS origins unblocked for sensor access", () => {
    expect(
      detectPlatformFromEnvironment({
        hostname: "example.test",
        protocol: "https:",
        isSecureContext: true,
        maxTouchPoints: 5,
        platform: "Linux armv8l",
        userAgent: ANDROID_CHROME_USER_AGENT,
      }),
    ).toMatchObject({
      isIOS: false,
      isSafari: false,
      isInsecureContext: false,
      requiresHTTPSForSensors: false,
    });
  });

  it("keeps Vercel HTTPS deployments unblocked for mobile sensor access", () => {
    for (const environment of [
      {
        hostname: "sky-beacon.vercel.app",
        maxTouchPoints: 5,
        platform: "Linux armv8l",
        userAgent: ANDROID_CHROME_USER_AGENT,
      },
      {
        hostname: "sky-beacon-git-main-user.vercel.app",
        maxTouchPoints: 5,
        platform: "iPhone",
        userAgent: IOS_SAFARI_USER_AGENT,
      },
    ]) {
      const platform = detectPlatformFromEnvironment({
        ...environment,
        protocol: "https:",
        isSecureContext: true,
      });

      expect(platform.isInsecureContext).toBe(false);
      expect(platform.requiresHTTPSForSensors).toBe(false);
      expect(getHTTPSRequiredMessage(platform)).toBeNull();
    }
  });

  it("treats localhost and loopback HTTP as development-trusted when the browser signal is unavailable", () => {
    for (const hostname of ["localhost", "app.localhost", "127.0.0.1", "127.4.5.6", "::1"]) {
      expect(
        detectPlatformFromEnvironment({
          hostname,
          protocol: "http:",
          userAgent: ANDROID_CHROME_USER_AGENT,
        }).requiresHTTPSForSensors,
      ).toBe(false);
    }
  });

  it("blocks Android Chrome sensors on insecure LAN HTTP origins", () => {
    const platform = detectPlatformFromEnvironment({
      hostname: "192.168.10.96",
      protocol: "http:",
      isSecureContext: false,
      maxTouchPoints: 5,
      platform: "Linux armv8l",
      userAgent: ANDROID_CHROME_USER_AGENT,
    });

    expect(platform).toMatchObject({
      isIOS: false,
      isSafari: false,
      isInsecureContext: true,
      requiresHTTPSForSensors: true,
    });
    expect(getHTTPSRequiredMessage(platform)).toBe(
      "Camera and sensor features require HTTPS. Please use a secure HTTPS connection.",
    );
  });

  it("blocks iOS Safari sensors on insecure LAN HTTP origins with iOS-specific copy", () => {
    const platform = detectPlatformFromEnvironment({
      hostname: "192.168.10.96",
      protocol: "http:",
      isSecureContext: false,
      maxTouchPoints: 5,
      platform: "iPhone",
      userAgent: IOS_SAFARI_USER_AGENT,
    });

    expect(platform).toMatchObject({
      isIOS: true,
      isSafari: true,
      isInsecureContext: true,
      requiresHTTPSForSensors: true,
    });
    expect(getHTTPSRequiredMessage(platform)).toBe(
      "iOS Safari requires HTTPS for camera, GPS, and compass access. Please use a secure HTTPS connection.",
    );
  });

  it("honors a browser secure-context exception for LAN development", () => {
    expect(
      detectPlatformFromEnvironment({
        hostname: "192.168.10.96",
        protocol: "http:",
        isSecureContext: true,
        userAgent: ANDROID_CHROME_USER_AGENT,
      }).requiresHTTPSForSensors,
    ).toBe(false);
  });

  it("is safe to call during server rendering", () => {
    expect(detectPlatform()).toEqual({
      isIOS: false,
      isSafari: false,
      isInsecureContext: false,
      requiresHTTPSForSensors: false,
    });
  });

  it("does not show HTTPS copy when sensors are allowed", () => {
    expect(messageFor({ requiresHTTPSForSensors: false })).toBeNull();
  });
});
