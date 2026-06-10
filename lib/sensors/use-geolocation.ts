"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface LocationFix {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export type LocationStatus = "idle" | "requesting" | "ready" | "blocked" | "unsupported" | "unavailable";

export function useGeolocation() {
  const watchIdRef = useRef<number | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [fix, setFix] = useState<LocationFix | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
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

    setStatus((current) => (current === "ready" ? current : "requesting"));
    setError(null);

    if (watchIdRef.current !== null) {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setFix({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setStatus("ready");
      },
      (geoError) => {
        const blocked = geoError.code === geoError.PERMISSION_DENIED;
        setStatus(blocked ? "blocked" : "unavailable");
        setError(geoError.message || "Location is unavailable.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    );
  }, []);

  useEffect(() => stop, [stop]);

  return {
    status,
    fix,
    error,
    requestLocation,
    stop,
  };
}
