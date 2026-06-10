"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectPlatform } from "@/lib/utils/platform";

export interface LocationFix {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export type LocationStatus = "idle" | "requesting" | "ready" | "blocked" | "unsupported" | "unavailable" | "timeout";

const ACQUISITION_TIMEOUT = 15000; // 15 seconds

export function useGeolocation() {
  const watchIdRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [fix, setFix] = useState<LocationFix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const platform = detectPlatform();

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
    if (!navigator.geolocation) {
      setStatus("unsupported");
      setError("This browser does not expose GPS location.");
      return;
    }

    if (platform.requiresHTTPSForSensors) {
      setStatus("blocked");
      setError("iOS Safari requires HTTPS for GPS access. Please use a secure HTTPS connection.");
      return;
    }

    // If we already have a recent fix (within 5 seconds), just return it
    if (fix && (Date.now() - fix.timestamp) < 5000) {
      setStatus("ready");
      return;
    }

    setStatus("requesting");
    setError(null);

    // Set timeout for GPS acquisition
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      if (status === "requesting" && !fix) {
        setStatus("timeout");
        setError("GPS acquisition timed out. Please ensure location services are enabled and try again.");
      }
    }, ACQUISITION_TIMEOUT);

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

        setFix({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
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

        const blocked = geoError.code === geoError.PERMISSION_DENIED;
        setStatus(blocked ? "blocked" : "unavailable");
        const errorMessage = geoError.message || "Location is unavailable.";
        if (platform.isIOS && blocked) {
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
  }, [platform.requiresHTTPSForSensors, platform.isIOS, fix, status]);

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
