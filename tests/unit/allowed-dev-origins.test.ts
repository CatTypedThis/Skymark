import { describe, expect, it } from "vitest";
import {
  buildAllowedDevOrigins,
  normalizeAllowedDevOrigin,
  splitAllowedDevOrigins,
} from "@/next.config";

describe("allowed dev origins", () => {
  it("normalizes host values from common manual formats", () => {
    expect(normalizeAllowedDevOrigin(" HTTP://Phone.Local:3001/path ")).toBe("phone.local");
    expect(normalizeAllowedDevOrigin("manual.local:3001")).toBe("manual.local");
    expect(normalizeAllowedDevOrigin("*.Example.Local")).toBe("*.example.local");
    expect(normalizeAllowedDevOrigin("")).toBeNull();
  });

  it("computes LAN defaults when no manual env var is set", () => {
    const origins = buildAllowedDevOrigins({
      addresses: ["192.168.10.96", "10.0.0.8"],
      env: {},
      hostname: "Test-Host",
      includeDetected: true,
    });

    expect(origins).toEqual(["localhost", "127.0.0.1", "test-host", "192.168.10.96", "10.0.0.8"]);
  });

  it("does not emit detected LAN origins for production deployments", () => {
    const origins = buildAllowedDevOrigins({
      addresses: ["192.168.10.96", "10.0.0.8"],
      env: { NODE_ENV: "production" },
      hostname: "vercel-build-host",
    });

    expect(origins).toEqual([]);
  });

  it("merges manual origins with detected defaults", () => {
    const origins = buildAllowedDevOrigins({
      addresses: ["192.168.10.96"],
      env: {
        NEXT_ALLOWED_DEV_ORIGINS: " http://phone.local:3001 , manual.local:3001 , *.test.local ",
      },
      hostname: "Test-Host",
      includeDetected: true,
    });

    expect(origins).toEqual(
      expect.arrayContaining([
        "localhost",
        "127.0.0.1",
        "test-host",
        "192.168.10.96",
        "phone.local",
        "manual.local",
        "*.test.local",
      ]),
    );
  });

  it("deduplicates normalized origins", () => {
    expect(splitAllowedDevOrigins("Phone.Local, phone.local:3001, http://phone.local:3001")).toEqual([
      "phone.local",
      "phone.local",
      "phone.local",
    ]);

    expect(
      buildAllowedDevOrigins({
        addresses: ["192.168.10.96", "192.168.10.96"],
        env: { NEXT_ALLOWED_DEV_ORIGINS: "localhost, http://192.168.10.96:3001" },
        hostname: "LOCALHOST",
        includeDetected: true,
      }),
    ).toEqual(["localhost", "127.0.0.1", "192.168.10.96"]);
  });
});
