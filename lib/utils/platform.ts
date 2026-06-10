"use client";

export interface PlatformInfo {
  isIOS: boolean;
  isSafari: boolean;
  isInsecureContext: boolean;
  requiresHTTPSForSensors: boolean;
}

export function detectPlatform(): PlatformInfo {
  if (typeof window === "undefined") {
    return {
      isIOS: false,
      isSafari: false,
      isInsecureContext: false,
      requiresHTTPSForSensors: false,
    };
  }

  const userAgent = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isInsecureContext = window.location.protocol !== "https:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

  // iOS Safari requires HTTPS for camera, geolocation, and device orientation
  const requiresHTTPSForSensors = isIOS && isInsecureContext;

  return {
    isIOS,
    isSafari,
    isInsecureContext,
    requiresHTTPSForSensors,
  };
}

export function getHTTPSRequiredMessage(): string | null {
  const platform = detectPlatform();

  if (platform.requiresHTTPSForSensors) {
    return "iOS Safari requires HTTPS for camera, GPS, and compass access. Please use a secure HTTPS connection.";
  }

  if (platform.isInsecureContext) {
    return "Camera and sensor features require HTTPS. Please use a secure HTTPS connection.";
  }

  return null;
}