"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectPlatform, type PlatformInfo } from "@/lib/utils/platform";
import { usePlatform } from "@/lib/utils/use-platform";

export type CameraStatus = "idle" | "requesting" | "ready" | "blocked" | "unsupported";

export function getCameraHTTPSRequiredMessage(platform: Pick<PlatformInfo, "isIOS">) {
  return platform.isIOS
    ? "iOS Safari requires HTTPS for camera access. Please use a secure HTTPS connection."
    : "Camera access requires HTTPS. Please use a secure HTTPS connection.";
}

export function getCameraPreflightState(
  platform: Pick<PlatformInfo, "isIOS" | "requiresHTTPSForSensors">,
  mediaDevices: Pick<MediaDevices, "getUserMedia"> | undefined,
): { status: CameraStatus; error: string } | null {
  if (platform.requiresHTTPSForSensors) {
    return {
      status: "blocked",
      error: getCameraHTTPSRequiredMessage(platform),
    };
  }

  if (!mediaDevices?.getUserMedia) {
    return {
      status: "unsupported",
      error: "This browser cannot open a live camera stream.",
    };
  }

  return null;
}

export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const platform = usePlatform();

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const requestCamera = useCallback(async () => {
    const currentPlatform = detectPlatform();
    const preflight = getCameraPreflightState(currentPlatform, navigator.mediaDevices);

    if (preflight) {
      setStatus(preflight.status);
      setError(preflight.error);
      return;
    }

    setStatus("requesting");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("ready");
    } catch (cameraError) {
      setStatus("blocked");
      const errorMessage = cameraError instanceof Error ? cameraError.message : "Camera permission was denied.";
      if (currentPlatform.isIOS && (errorMessage.includes("Permission") || errorMessage.includes("denied"))) {
        setError("Camera permission was denied. Please enable camera access in Settings > Safari > Camera.");
      } else {
        setError(errorMessage);
      }
    }
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  return {
    videoRef,
    status,
    error,
    requestCamera,
    stopCamera,
    requiresHTTPS: platform.requiresHTTPSForSensors,
  };
}
