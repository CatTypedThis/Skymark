"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HeadingStability } from "@/lib/beacons/beacon-types";
import { angularDifference, normalizeHeading } from "@/lib/geospatial/angles";
import { smoothHeading } from "./smoothing";

type PermissionResult = "granted" | "denied" | "prompt";

type DeviceOrientationEventConstructorWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionResult>;
};

type CompassOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
};

export type OrientationStatus = "idle" | "requesting" | "ready" | "blocked" | "unsupported" | "simulated";

export interface OrientationState {
  status: OrientationStatus;
  heading: number | null;
  pitch: number | null;
  stability: HeadingStability;
  accuracyLabel?: string;
  isSimulated: boolean;
  error: string | null;
}

function readHeading(event: CompassOrientationEvent): { heading: number | null; accuracyLabel?: string } {
  if (typeof event.webkitCompassHeading === "number") {
    return {
      heading: normalizeHeading(event.webkitCompassHeading),
      accuracyLabel:
        typeof event.webkitCompassAccuracy === "number" ? `${Math.round(event.webkitCompassAccuracy)} deg` : "iOS compass",
    };
  }

  if (typeof event.alpha === "number") {
    return {
      heading: normalizeHeading(360 - event.alpha),
      accuracyLabel: event.absolute ? "absolute" : "relative",
    };
  }

  return { heading: null };
}

export function useOrientation() {
  const previousHeading = useRef<number | null>(null);
  const [state, setState] = useState<OrientationState>({
    status: "idle",
    heading: null,
    pitch: null,
    stability: "unknown",
    isSimulated: false,
    error: null,
  });

  const attachListener = useCallback(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { heading, accuracyLabel } = readHeading(event as CompassOrientationEvent);
      if (heading === null) {
        return;
      }

      const difference =
        previousHeading.current === null ? 0 : Math.abs(angularDifference(previousHeading.current, heading));
      const smoothedHeading = smoothHeading(previousHeading.current, heading);
      previousHeading.current = smoothedHeading;

      const stability: HeadingStability = difference < 6 ? "stable" : difference < 18 ? "degraded" : "unstable";

      setState({
        status: "ready",
        heading: smoothedHeading,
        pitch: typeof event.beta === "number" ? event.beta : null,
        stability,
        accuracyLabel,
        isSimulated: false,
        error: null,
      });
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, []);

  const cleanupRef = useRef<null | (() => void)>(null);

  const requestOrientation = useCallback(async () => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setState({
        status: "simulated",
        heading: 312,
        pitch: 0,
        stability: "unknown",
        accuracyLabel: "desktop simulation",
        isSimulated: true,
        error: null,
      });
      return;
    }

    setState((current) => ({ ...current, status: "requesting", error: null }));

    const orientationEvent = DeviceOrientationEvent as DeviceOrientationEventConstructorWithPermission;
    if (typeof orientationEvent.requestPermission === "function") {
      try {
        const permission = await orientationEvent.requestPermission();
        if (permission !== "granted") {
          setState((current) => ({
            ...current,
            status: "blocked",
            error: "Orientation permission was denied.",
          }));
          return;
        }
      } catch (error) {
        setState((current) => ({
          ...current,
          status: "blocked",
          error: error instanceof Error ? error.message : "Orientation permission was denied.",
        }));
        return;
      }
    }

    cleanupRef.current?.();
    cleanupRef.current = attachListener();
  }, [attachListener]);

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  return {
    ...state,
    requestOrientation,
  };
}
