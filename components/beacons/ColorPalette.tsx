"use client";

import { Check } from "lucide-react";
import type { CSSProperties } from "react";
import { BEACON_COLORS } from "@/lib/beacons/color-palette";
import type { BeaconColorId } from "@/lib/beacons/beacon-types";
import { cn } from "@/lib/utils";

interface ColorPaletteProps {
  value: BeaconColorId;
  onChange: (value: BeaconColorId) => void;
  compact?: boolean;
}

export function ColorPalette({ value, onChange, compact = false }: ColorPaletteProps) {
  return (
    <div className={cn("color-palette", compact && "color-palette--compact")} aria-label="Beacon color">
      {BEACON_COLORS.map((color) => (
        <button
          key={color.id}
          type="button"
          className={cn("color-swatch", value === color.id && "color-swatch--selected")}
          style={{ "--swatch": color.hex } as CSSProperties}
          onClick={() => onChange(color.id)}
          aria-label={`${color.name} beacon color`}
          aria-pressed={value === color.id}
        >
          {value === color.id ? <Check size={14} /> : null}
        </button>
      ))}
    </div>
  );
}
