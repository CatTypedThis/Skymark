"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HeadingStability } from "@/lib/beacons/beacon-types";
import { angularDifference } from "@/lib/geospatial/angles";
import { smoothHeading } from "./smoothing";
import { detectPlatform } from "@/lib/utils/platform";
import { usePlatform } from "@/lib/utils/use-platform";
import { readHeadingFromOrientation } from "./orientation-heading";

type PermissionResult = "granted" | "denied" | "prompt";

type DeviceOrientationEventConstructorWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionResult>;
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
  const renderedPlatform = usePlatform();

  const attachListener = useCallback(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { heading, accuracyLabel } = readHeadingFromOrientation(event);
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
    const currentPlatform = detectPlatform();

    if (currentPlatform.requiresHTTPSForSensors) {
      setState({
        status: "blocked",
        heading: null,
        pitch: null,
        stability: "unknown",
        isSimulated: false,
        error: currentPlatform.isIOS
          ? "iOS Safari requires HTTPS for compass access. Please use a secure HTTPS connection."
          : "Compass access requires HTTPS. Please use a secure HTTPS connection.",
      });
      return;
    }

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
            error: "Compass permission was denied. Please enable motion access in Settings > Safari > Motion.",
          }));
          return;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Orientation permission was denied.";
        setState((current) => ({
          ...current,
          status: "blocked",
          error: currentPlatform.isIOS && errorMessage.includes("not allowed")
            ? "Compass permission must be triggered by a user interaction. Please tap the permission button directly."
            : errorMessage,
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
    requiresHTTPS: renderedPlatform.requiresHTTPSForSensors,
  };
}
