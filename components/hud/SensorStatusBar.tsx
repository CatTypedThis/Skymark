"use client";

import { Camera, Compass, LocateFixed, Radio } from "lucide-react";
import type { BeaconConfidence, HeadingStability } from "@/lib/beacons/beacon-types";
import { compassPoint } from "@/lib/geospatial/angles";
import type { CameraStatus } from "@/lib/sensors/use-camera-stream";
import type { LocationStatus } from "@/lib/sensors/use-geolocation";
import type { OrientationStatus } from "@/lib/sensors/use-orientation";
import { confidenceLabel } from "@/lib/sensors/confidence";
import { cn } from "@/lib/utils";

interface SensorStatusBarProps {
  cameraStatus: CameraStatus;
  locationStatus: LocationStatus;
  orientationStatus: OrientationStatus;
  heading: number | null;
  stability: HeadingStability;
  confidence: BeaconConfidence;
  onRequestCamera: () => void;
  onRequestLocation: () => void;
  onRequestOrientation: () => void;
}

function statusClass(active: boolean, warning = false) {
  return cn("hud-chip", active && "hud-chip--ready", warning && "hud-chip--warn");
}

function getGPSLabel(locationStatus: LocationStatus): string {
  switch (locationStatus) {
    case "ready":
      return "GPS fix";
    case "requesting":
      return "Acquiring GPS";
    case "timeout":
      return "GPS timeout";
    case "blocked":
      return "GPS blocked";
    case "unsupported":
      return "GPS unavailable";
    default:
      return "GPS";
  }
}

function getCompassLabel(orientationStatus: OrientationStatus, heading: number | null): string {
  if (orientationStatus === "requesting") {
    return "Acquiring compass";
  }
  if (orientationStatus === "blocked") {
    return "Compass blocked";
  }
  if (orientationStatus === "unsupported") {
    return "Compass unavailable";
  }
  return heading === null ? "No heading" : `${compassPoint(heading)} ${Math.round(heading)} deg`;
}

export function SensorStatusBar({
  cameraStatus,
  locationStatus,
  orientationStatus,
  heading,
  stability,
  confidence,
  onRequestCamera,
  onRequestLocation,
  onRequestOrientation,
}: SensorStatusBarProps) {
  const headingLabel = getCompassLabel(orientationStatus, heading);
  const gpsLabel = getGPSLabel(locationStatus);
  const degraded =
    confidence === "low" ||
    confidence === "unknown" ||
    locationStatus === "blocked" ||
    locationStatus === "timeout" ||
    orientationStatus === "blocked" ||
    orientationStatus === "simulated";

  return (
    <header className="sensor-topbar" aria-label="Sensor status">
      <div className="brand-chip">
        <span className="mini-mark" aria-hidden="true">
          <Radio size={15} />
        </span>
        <span>Sky Beacon</span>
      </div>
      <div className="status-scroll">
        <button
          type="button"
          className={statusClass(cameraStatus === "ready")}
          onClick={onRequestCamera}
          aria-label="Camera permission"
          title="Request camera permission"
        >
          <Camera size={14} />
          {cameraStatus === "ready" ? "Camera live" : "Camera"}
        </button>
        <button
          type="button"
          className={statusClass(locationStatus === "ready", locationStatus === "blocked" || locationStatus === "timeout")}
          onClick={onRequestLocation}
          aria-label="GPS permission"
          title="Request GPS permission"
        >
          <LocateFixed size={14} />
          {gpsLabel}
        </button>
        <button
          type="button"
          className={statusClass(orientationStatus === "ready", orientationStatus === "blocked")}
          onClick={onRequestOrientation}
          aria-label="Compass permission"
          title="Request compass permission"
        >
          <Compass size={14} />
          {headingLabel}
        </button>
        <span className={statusClass(confidence === "high" || confidence === "medium", degraded)}>
          <Radio size={14} />
          {confidenceLabel(confidence)}
        </span>
        <span className={statusClass(stability === "stable", stability === "unstable")}>
          <Radio size={14} />
          {stability}
        </span>
      </div>
    </header>
  );
}
