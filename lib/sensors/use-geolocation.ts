"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectPlatform } from "@/lib/utils/platform";
import { usePlatform } from "@/lib/utils/use-platform";

export interface LocationFix {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export type LocationStatus = "idle" | "requesting" | "ready" | "blocked" | "unsupported" | "unavailable" | "timeout";

export const LOCATION_ACQUISITION_TIMEOUT_MS = 15000;
export const LOCATION_STABILITY_MIN_MOVEMENT_METERS = 8;
export const LOCATION_STABILITY_MAX_ACCURACY_METERS = 35;

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function accuracyMeters(fix: LocationFix): number {
  return typeof fix.accuracy === "number" && Number.isFinite(fix.accuracy) && fix.accuracy > 0
    ? fix.accuracy
    : 0;
}

export function shouldLocationRequestTimeout(fix: LocationFix | null, requestStartedAt: number) {
  return fix === null || fix.timestamp < requestStartedAt;
}

export function distanceBetweenLocationFixes(from: LocationFix, to: LocationFix): number {
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(deltaLongitude / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function stabilizeLocationFix(current: LocationFix | null, next: LocationFix): LocationFix {
  if (current === null) {
    return next;
  }

  if (next.timestamp < current.timestamp) {
    return current;
  }

  const distanceMeters = distanceBetweenLocationFixes(current, next);
  const currentAccuracy = accuracyMeters(current);
  const nextAccuracy = accuracyMeters(next);
  const accuracyEnvelope = Math.min(
    currentAccuracy + nextAccuracy,
    LOCATION_STABILITY_MAX_ACCURACY_METERS,
  );
  const movementThreshold = Math.max(LOCATION_STABILITY_MIN_MOVEMENT_METERS, accuracyEnvelope);
  const nextIsMateriallyMorePrecise =
    nextAccuracy > 0 &&
    (currentAccuracy === 0 || nextAccuracy + LOCATION_STABILITY_MIN_MOVEMENT_METERS < currentAccuracy) &&
    distanceMeters > nextAccuracy;

  if (distanceMeters >= movementThreshold || nextIsMateriallyMorePrecise) {
    return next;
  }

  return {
    ...current,
    accuracy: next.accuracy ?? current.accuracy,
    timestamp: next.timestamp,
  };
}

export function useGeolocation() {
  const watchIdRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const fixRef = useRef<LocationFix | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [fix, setFix] = useState<LocationFix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const platform = usePlatform();

  useEffect(() => {
    fixRef.current = fix;
  }, [fix]);

  const stop = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const requestLocation = useCallback(() => {
    const currentPlatform = detectPlatform();

    if (currentPlatform.requiresHTTPSForSensors) {
      setStatus("blocked");
      setError(
        currentPlatform.isIOS
          ? "iOS Safari requires HTTPS for GPS access. Please use a secure HTTPS connection."
          : "GPS access requires HTTPS. Please use a secure HTTPS connection.",
      );
      return;
    }

    if (!navigator.geolocation) {
      setStatus("unsupported");
      setError("This browser does not expose GPS location.");
      return;
    }

    // If we already have a recent fix (within 5 seconds), just return it
    if (fix && (Date.now() - fix.timestamp) < 5000) {
      setStatus("ready");
      return;
    }

    setStatus("requesting");
    setError(null);
    const requestStartedAt = Date.now();

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      if (shouldLocationRequestTimeout(fixRef.current, requestStartedAt)) {
        if (watchIdRef.current !== null && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        setStatus("timeout");
        setError("GPS acquisition timed out. Please ensure location services are enabled and try again.");
      }
    }, LOCATION_ACQUISITION_TIMEOUT_MS);

    if (watchIdRef.current !== null) {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        // Clear timeout when we get a successful fix
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        const nextFix = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        setFix((current) => {
          const stabilized = stabilizeLocationFix(current, nextFix);
          fixRef.current = stabilized;
          return stabilized;
        });
        setStatus("ready");
        setError(null);
      },
      (geoError) => {
        // Clear timeout on error
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }

        const blocked = geoError.code === geoError.PERMISSION_DENIED;
        setStatus(blocked ? "blocked" : "unavailable");
        const errorMessage = geoError.message || "Location is unavailable.";
        if (currentPlatform.isIOS && blocked) {
          setError("Location permission was denied. Please enable location access in Settings > Safari > Location.");
        } else {
          setError(errorMessage);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    );
  }, [fix]);

  useEffect(() => stop, [stop]);

  return {
    status,
    fix,
    error,
    requestLocation,
    stop,
    requiresHTTPS: platform.requiresHTTPSForSensors,
  };
}
