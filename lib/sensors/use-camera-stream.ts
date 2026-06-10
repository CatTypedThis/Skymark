"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectPlatform } from "@/lib/utils/platform";

export type CameraStatus = "idle" | "requesting" | "ready" | "blocked" | "unsupported";

export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const platform = detectPlatform();

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const requestCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setError("This browser cannot open a live camera stream.");
      return;
    }

    if (platform.requiresHTTPSForSensors) {
      setStatus("blocked");
      setError("iOS Safari requires HTTPS for camera access. Please use a secure HTTPS connection.");
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
      if (platform.isIOS && (errorMessage.includes("Permission") || errorMessage.includes("denied"))) {
        setError("Camera permission was denied. Please enable camera access in Settings > Safari > Camera.");
      } else {
        setError(errorMessage);
      }
    }
  }, [platform.requiresHTTPSForSensors, platform.isIOS]);

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
