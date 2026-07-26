"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HeadingStability } from "@/lib/beacons/beacon-types";
import { angularDifference } from "@/lib/geospatial/angles";
import {
  HEADING_UNSTABLE_AFTER_HELD,
  advanceHeadingFilter,
  type HeadingFilterState,
} from "./heading-filter";
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
  const filterRef = useRef<HeadingFilterState | null>(null);
  const previousPublished = useRef<number | null>(null);
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
    // BUG-13: Android Chrome interleaves deviceorientation events whose
    // `absolute` flag flips between true (compass heading from north) and
    // false (heading relative to an arbitrary session zero). The
    // heading-filter gate rejects every non-absolute reading, and we prefer
    // `deviceorientationabsolute` (Chrome's dedicated absolute source) when
    // the browser fires it. iOS uses `webkitCompassHeading`, which is
    // absolute by construction.
    const handleOrientation = (event: DeviceOrientationEvent, forceAbsolute = false) => {
      // Pitch (beta) does not depend on the absolute flag; keep feeding it to
      // the frame resolver even when we reject the heading.
      const pitch = typeof event.beta === "number" ? event.beta : null;

      const { heading, accuracyLabel } = readHeadingFromOrientation(event);
      if (heading === null) {
        setState((current) => (pitch !== null && current.pitch !== pitch
          ? { ...current, pitch }
          : current));
        return;
      }

      // `webkitCompassHeading` (iOS) is absolute by construction. For the
      // alpha path, trust `event.absolute`, but let the dedicated
      // `deviceorientationabsolute` listener force the source to absolute.
      const isIOSCompass = typeof (event as unknown as { webkitCompassHeading?: number })
        .webkitCompassHeading === "number";
      const sampleAbsolute = forceAbsolute || isIOSCompass || event.absolute;

      const advanced = advanceHeadingFilter(filterRef.current, {
        heading,
        absolute: sampleAbsolute,
      });
      filterRef.current = advanced.state;

      if (advanced.heading === null) {
        // Gate rejected the sample (relative reading before any absolute
        // primer). Still publish pitch so vertical framing stays live.
        setState((current) => (pitch !== null && current.pitch !== pitch
          ? { ...current, pitch }
          : current));
        return;
      }

      const published = advanced.heading;
      const difference =
        previousPublished.current === null
          ? 0
          : Math.abs(angularDifference(previousPublished.current, published));
      previousPublished.current = published;

      // Stability reflects three signals from the filter itself (we do not
      // re-derive outlier status here — the filter reports it):
      //   - a sustained run of rejected/outlier samples means the compass is
      //     not producing trustworthy new information (BUG-13 Task 3);
      //   - a single outlier frame is unstable;
      //   - otherwise the per-update motion classifies stable/degraded/unstable.
      let stability: HeadingStability;
      if (advanced.state.consecutiveHeld >= HEADING_UNSTABLE_AFTER_HELD) {
        stability = "unstable";
      } else if (advanced.outlier) {
        stability = "unstable";
      } else if (difference < 6) {
        stability = "stable";
      } else if (difference < 18) {
        stability = "degraded";
      } else {
        stability = "unstable";
      }

      setState((current) => ({
        ...current,
        status: "ready",
        heading: published,
        pitch: pitch ?? current.pitch,
        stability,
        accuracyLabel,
        isSimulated: false,
        error: null,
      }));
    };

    const handleAbsolute = (event: DeviceOrientationEvent) =>
      handleOrientation(event, true);

    window.addEventListener("deviceorientationabsolute", handleAbsolute as EventListener, true);
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleAbsolute as EventListener, true);
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
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
