import { describe, expect, it } from "vitest";
import { getCameraPreflightState } from "@/lib/sensors/use-camera-stream";
import type { PlatformInfo } from "@/lib/utils/platform";

function platform(overrides: Partial<PlatformInfo> = {}): PlatformInfo {
  return {
    isIOS: false,
    isSafari: false,
    isInsecureContext: false,
    requiresHTTPSForSensors: false,
    ...overrides,
  };
}

describe("camera secure-context preflight", () => {
  it("reports HTTPS required before unsupported media APIs on insecure Android LAN HTTP", () => {
    expect(
      getCameraPreflightState(
        platform({
          isInsecureContext: true,
          requiresHTTPSForSensors: true,
        }),
        undefined,
      ),
    ).toEqual({
      status: "blocked",
      error: "Camera access requires HTTPS. Please use a secure HTTPS connection.",
    });
  });

  it("keeps iOS-specific copy for insecure iOS camera access", () => {
    expect(
      getCameraPreflightState(
        platform({
          isIOS: true,
          isSafari: true,
          isInsecureContext: true,
          requiresHTTPSForSensors: true,
        }),
        undefined,
      ),
    ).toEqual({
      status: "blocked",
      error: "iOS Safari requires HTTPS for camera access. Please use a secure HTTPS connection.",
    });
  });

  it("uses unsupported only after the origin is secure enough for camera APIs", () => {
    expect(getCameraPreflightState(platform(), undefined)).toEqual({
      status: "unsupported",
      error: "This browser cannot open a live camera stream.",
    });
  });

  it("allows the camera request to continue when getUserMedia is available in a trusted context", () => {
    expect(
      getCameraPreflightState(platform(), {
        getUserMedia: (() => Promise.resolve({} as MediaStream)) as MediaDevices["getUserMedia"],
      }),
    ).toBeNull();
  });
});
