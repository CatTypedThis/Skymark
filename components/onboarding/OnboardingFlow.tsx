"use client";

import { Camera, Compass, LocateFixed, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  return (
    <div className="onboarding-layer">
      <div className="onboarding-panel">
        <span className="app-mark" aria-hidden="true" />
        <p className="eyebrow">Sky Beacon</p>
        <h1>A camera instrument for outdoor markers</h1>
        <p>
          Aim through the camera, choose a beacon color, and place an approximate GPS-backed marker
          about 100 meters ahead.
        </p>
        <div className="onboarding-grid">
          <span>
            <Camera size={18} />
            Camera-first view
          </span>
          <span>
            <LocateFixed size={18} />
            Outdoor GPS
          </span>
          <span>
            <Compass size={18} />
            Compass heading
          </span>
          <span>
            <ShieldAlert size={18} />
            Stay aware
          </span>
        </div>
        <div className="onboarding-actions">
          <Button variant="ghost" onClick={onComplete}>
            Skip
          </Button>
          <Button variant="primary" onClick={onComplete}>
            Enter camera
          </Button>
        </div>
      </div>
    </div>
  );
}
