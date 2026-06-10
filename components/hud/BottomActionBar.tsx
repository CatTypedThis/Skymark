"use client";

import { Check, List, LocateFixed, Radio, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BeaconConfidence } from "@/lib/beacons/beacon-types";
import { confidenceLabel } from "@/lib/sensors/confidence";

interface BottomActionBarProps {
  mode: "normal" | "preview" | "saving";
  confidence: BeaconConfidence;
  canPreview: boolean;
  canConfirm: boolean;
  activeCount: number;
  onStartPreview: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenDrawer: () => void;
}

export function BottomActionBar({
  mode,
  confidence,
  canPreview,
  canConfirm,
  activeCount,
  onStartPreview,
  onConfirm,
  onCancel,
  onOpenDrawer,
}: BottomActionBarProps) {
  const previewing = mode === "preview" || mode === "saving";

  return (
    <div className="bottom-dock" aria-label="Placement controls">
      <div className="selected-sheet">
        <div className="sheet-main">
          <span className="readout-glyph" aria-hidden="true">
            {previewing ? <Radio size={18} /> : <LocateFixed size={18} />}
          </span>
          <div className="sheet-title">
            <strong>{previewing ? "Preview anchor" : "Placement mode"}</strong>
            <span>{previewing ? confidenceLabel(confidence) : `${activeCount}/3 saved beacons`}</span>
          </div>
          <Button variant="secondary" size="icon" onClick={onOpenDrawer} aria-label="Open beacon drawer">
            <List size={18} />
          </Button>
        </div>
      </div>

      <div className="mobile-controls">
        <div className="mobile-actions-left">
          {previewing ? (
            <Button variant="secondary" size="icon" onClick={onCancel} aria-label="Cancel placement">
              <X size={18} />
            </Button>
          ) : null}
        </div>

        {previewing ? (
          <Button
            className="place-button"
            variant="primary"
            size="circle"
            onClick={onConfirm}
            disabled={!canConfirm || mode === "saving"}
            aria-label="Confirm beacon placement"
          >
            <Check size={25} />
          </Button>
        ) : (
          <Button
            className="place-button"
            variant="primary"
            size="circle"
            onClick={onStartPreview}
            disabled={!canPreview}
            aria-label="Preview beacon placement"
          >
            <Sparkles size={25} />
          </Button>
        )}

        <div className="mobile-actions-right">
          {previewing ? (
            <Button
              variant="primary"
              size="icon"
              onClick={onConfirm}
              disabled={!canConfirm || mode === "saving"}
              aria-label="Save beacon"
            >
              <Check size={18} />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
