"use client";

import { Camera, CloudOff, Compass, LocateFixed, Radio, UserCircle } from "lucide-react";
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
  isAuthenticated: boolean;
  backendOnline: boolean | null;
}

function statusClass(active: boolean, warning = false) {
  return cn("hud-chip", active && "hud-chip--ready", warning && "hud-chip--warn");
}

export function SensorStatusBar({
  cameraStatus,
  locationStatus,
  orientationStatus,
  heading,
  stability,
  confidence,
  isAuthenticated,
  backendOnline,
}: SensorStatusBarProps) {
  const headingLabel = heading === null ? "No heading" : `${compassPoint(heading)} ${Math.round(heading)} deg`;
  const degraded =
    confidence === "low" ||
    confidence === "unknown" ||
    locationStatus === "blocked" ||
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
        <span className={statusClass(cameraStatus === "ready")}>
          <Camera size={14} />
          {cameraStatus === "ready" ? "Camera live" : "Camera"}
        </span>
        <span className={statusClass(locationStatus === "ready", locationStatus === "blocked")}>
          <LocateFixed size={14} />
          {locationStatus === "ready" ? "GPS fix" : "GPS"}
        </span>
        <span className={statusClass(orientationStatus === "ready", orientationStatus === "blocked")}>
          <Compass size={14} />
          {headingLabel}
        </span>
        <span className={statusClass(confidence === "high" || confidence === "medium", degraded)}>
          <Radio size={14} />
          {confidenceLabel(confidence)}
        </span>
        <span className={statusClass(stability === "stable", stability === "unstable")}>
          <Radio size={14} />
          {stability}
        </span>
        <span className={statusClass(isAuthenticated, !isAuthenticated)}>
          <UserCircle size={14} />
          {isAuthenticated ? "Signed in" : "Guest"}
        </span>
        <span className={statusClass(backendOnline === true, backendOnline === false)}>
          <CloudOff size={14} />
          {backendOnline === false ? "PocketBase offline" : "PocketBase"}
        </span>
      </div>
    </header>
  );
}
