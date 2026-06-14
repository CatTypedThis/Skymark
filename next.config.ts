import type { NextConfig } from "next";
import { hostname as systemHostname, networkInterfaces } from "node:os";

interface BuildAllowedDevOriginsOptions {
  addresses?: string[];
  env?: Record<string, string | undefined>;
  hostname?: string;
  includeDetected?: boolean;
}

export function normalizeAllowedDevOrigin(origin: string) {
  const trimmed = origin.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("*.")) {
    return trimmed.toLowerCase();
  }

  try {
    const hostname = new URL(trimmed).hostname;

    if (hostname) {
      return hostname.toLowerCase();
    }
  } catch {
    // Values in NEXT_ALLOWED_DEV_ORIGINS are often hostnames without protocols.
  }

  const hostLike = trimmed.split("/")[0]?.trim();

  if (!hostLike) {
    return null;
  }

  if (hostLike.startsWith("[") && hostLike.includes("]")) {
    return hostLike.slice(1, hostLike.indexOf("]")).toLowerCase();
  }

  return (hostLike.includes(":") ? hostLike.split(":")[0] : hostLike).toLowerCase();
}

export function splitAllowedDevOrigins(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map(normalizeAllowedDevOrigin)
    .filter((origin): origin is string => Boolean(origin));
}

export function findLocalIPv4Addresses() {
  const addresses: string[] = [];

  for (const networkInterface of Object.values(networkInterfaces())) {
    for (const address of networkInterface ?? []) {
      if (address.family === "IPv4" && !address.internal) {
        addresses.push(address.address);
      }
    }
  }

  return addresses;
}

export function buildAllowedDevOrigins({
  addresses = findLocalIPv4Addresses(),
  env = process.env,
  hostname = systemHostname(),
  includeDetected = env.NODE_ENV !== "production",
}: BuildAllowedDevOriginsOptions = {}) {
  const detectedOrigins = includeDetected ? ["localhost", "127.0.0.1", hostname, ...addresses] : [];
  const manualOrigins = splitAllowedDevOrigins(env.NEXT_ALLOWED_DEV_ORIGINS);
  const origins = [...detectedOrigins, ...manualOrigins]
    .map(normalizeAllowedDevOrigin)
    .filter((origin): origin is string => Boolean(origin));

  return Array.from(new Set(origins));
}

const allowedDevOrigins = buildAllowedDevOrigins();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(allowedDevOrigins?.length ? { allowedDevOrigins } : {}),
};

export default nextConfig;
