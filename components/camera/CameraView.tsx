"use client";

import type { RefObject } from "react";
import { Camera, RefreshCw, VideoOff } from "lucide-react";
import type { CameraStatus } from "@/lib/sensors/use-camera-stream";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  error?: string | null;
  onRequestCamera: () => void;
}

export function CameraView({ videoRef, status, error, onRequestCamera }: CameraViewProps) {
  const needsPrompt = status === "idle" || status === "blocked" || status === "unsupported";

  return (
    <div className={cn("camera-layer", status !== "ready" && "camera-layer--fallback")}>
      <video
        ref={videoRef}
        className={cn("camera-video", status !== "ready" && "opacity-0")}
        playsInline
        muted
        autoPlay
      />
      <div className="camera-backdrop" aria-hidden="true" />
      <div className="camera-grade" aria-hidden="true" />
      <div className="scan-lines" aria-hidden="true" />
      {needsPrompt ? (
        <div className="permission-panel">
          <span className="permission-icon" aria-hidden="true">
            {status === "unsupported" ? <VideoOff size={22} /> : <Camera size={22} />}
          </span>
          <p className="tiny-label">Camera feed</p>
          <h2>{status === "unsupported" ? "Camera unsupported" : "Open camera view"}</h2>
          <p>
            Sky Beacon uses the rear camera as the instrument surface. If the camera is not available,
            the app keeps this simulated backdrop for layout and beacon management.
          </p>
          {error ? <p className="permission-error">{error}</p> : null}
          {status !== "unsupported" ? (
            <Button onClick={onRequestCamera} variant="primary">
              <RefreshCw size={17} />
              Start camera
            </Button>
          ) : null}
        </div>
      ) : null}
      {status === "requesting" ? (
        <div className="permission-panel permission-panel--compact">
          <span className="permission-icon" aria-hidden="true">
            <Camera size={22} />
          </span>
          <p className="tiny-label">Awaiting permission</p>
        </div>
      ) : null}
    </div>
  );
}
