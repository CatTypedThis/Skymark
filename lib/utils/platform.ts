"use client";

export interface PlatformInfo {
  isIOS: boolean;
  isSafari: boolean;
  isInsecureContext: boolean;
  requiresHTTPSForSensors: boolean;
}

export const DEFAULT_PLATFORM_INFO: PlatformInfo = {
  isIOS: false,
  isSafari: false,
  isInsecureContext: false,
  requiresHTTPSForSensors: false,
};

export function getDefaultPlatformInfo(): PlatformInfo {
  return { ...DEFAULT_PLATFORM_INFO };
}

interface PlatformEnvironment {
  hostname: string;
  protocol: string;
  isSecureContext?: boolean;
  maxTouchPoints?: number;
  platform?: string;
  userAgent?: string;
}

function isPotentiallyTrustworthyLocalHost(hostname: string) {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "127.0.0.1" ||
    normalized.startsWith("127.") ||
    normalized === "::1" ||
    normalized === "[::1]"
  );
}

export function detectPlatformFromEnvironment(environment: PlatformEnvironment): PlatformInfo {
  const userAgent = environment.userAgent ?? "";
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (environment.platform === "MacIntel" && (environment.maxTouchPoints ?? 0) > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isSecureContext =
    typeof environment.isSecureContext === "boolean"
      ? environment.isSecureContext
      : environment.protocol === "https:" || isPotentiallyTrustworthyLocalHost(environment.hostname);
  const isInsecureContext = !isSecureContext;

  return {
    isIOS,
    isSafari,
    isInsecureContext,
    requiresHTTPSForSensors: isInsecureContext,
  };
}

export function detectPlatform(): PlatformInfo {
  if (typeof window === "undefined") {
    return getDefaultPlatformInfo();
  }

  return detectPlatformFromEnvironment({
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    isSecureContext: window.isSecureContext,
    maxTouchPoints: navigator.maxTouchPoints,
    platform: navigator.platform,
    userAgent: navigator.userAgent,
  });
}

export function getHTTPSRequiredMessage(platform = detectPlatform()): string | null {
  if (!platform.requiresHTTPSForSensors) {
    return null;
  }

  if (platform.isIOS) {
    return "iOS Safari requires HTTPS for camera, GPS, and compass access. Please use a secure HTTPS connection.";
  }

  return "Camera and sensor features require HTTPS. Please use a secure HTTPS connection.";
}
