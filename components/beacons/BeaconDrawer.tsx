"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Check, Pencil, Radio, Trash2 } from "lucide-react";
import type { BeaconColorId, BeaconRecord } from "@/lib/beacons/beacon-types";
import { getBeaconColor } from "@/lib/beacons/color-palette";
import { resolveRenderableAnchor } from "@/lib/beacons/renderable-anchor";
import { Button } from "@/components/ui/button";
import { ColorPalette } from "./ColorPalette";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogActionButton,
  AlertDialogCancelButton,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface BeaconDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beacons: BeaconRecord[];
  selectedBeaconId: string | null;
  replacing: boolean;
  onSelect: (beaconId: string) => void;
  onRename: (beacon: BeaconRecord, name: string) => void;
  onRecolor: (beacon: BeaconRecord, color: BeaconColorId) => void;
  onDelete: (beacon: BeaconRecord) => void;
  onClearAll: () => void;
  onReplace: (beacon: BeaconRecord) => void;
}

export function BeaconDrawer({
  open,
  onOpenChange,
  beacons,
  selectedBeaconId,
  replacing,
  onSelect,
  onRename,
  onRecolor,
  onDelete,
  onClearAll,
  onReplace,
}: BeaconDrawerProps) {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    setNames(Object.fromEntries(beacons.map((beacon) => [beacon.id, beacon.name])));
  }, [beacons]);

  const selectedBeacon = useMemo(
    () => beacons.find((beacon) => beacon.id === selectedBeaconId) ?? beacons[0] ?? null,
    [beacons, selectedBeaconId],
  );

  function commitName(beacon: BeaconRecord) {
    const nextName = names[beacon.id] ?? beacon.name;
    if (nextName.trim() !== beacon.name) {
      onRename(beacon, nextName);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{replacing ? "Replace a beacon" : "Beacon drawer"}</SheetTitle>
          <SheetDescription>
            {replacing
              ? "Choose which active marker should receive the new anchor."
              : "Manage up to three anchors saved on this device."}
          </SheetDescription>
        </SheetHeader>

        <div className="drawer-status">
          <span className="drawer-status-pill ready">
            <Radio size={14} />
            Local storage
          </span>
        </div>

        {beacons.length === 0 ? (
          <div className="drawer-empty">
            <p>No active beacons yet. Use the center placement control to preview one.</p>
          </div>
        ) : null}

        <div className="drawer-list">
          {beacons.map((beacon) => {
            const color = getBeaconColor(beacon.color);
            const selected = selectedBeaconId === beacon.id;
            // Status label reflects anchor source/confidence (e.g. "Approximate / Low").
            const statusLabel = resolveRenderableAnchor(beacon, true, null).statusLabel;
            return (
              <article key={beacon.id} className={cn("drawer-row", selected && "selected")}>
                <button
                  className="drawer-row-main"
                  type="button"
                  onClick={() => onSelect(beacon.id)}
                  aria-label={`Select ${beacon.name}`}
                >
                  <span
                    className="drawer-color"
                    style={{ "--beam": color.hex } as CSSProperties}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{beacon.name}</strong>
                    <small>{statusLabel}</small>
                  </span>
                </button>
                {replacing ? (
                  <Button variant="primary" size="sm" onClick={() => onReplace(beacon)}>
                    <Check size={15} />
                    Replace
                  </Button>
                ) : (
                  <Button variant="danger" size="icon" onClick={() => onDelete(beacon)} aria-label="Delete beacon">
                    <Trash2 size={16} />
                  </Button>
                )}
              </article>
            );
          })}
        </div>

        {selectedBeacon && !replacing ? (
          <section className="drawer-editor" aria-label="Selected beacon editor">
            <div className="editor-heading">
              <Pencil size={16} />
              <span>Edit selected</span>
            </div>
            <p className="editor-status">
              {resolveRenderableAnchor(selectedBeacon, true, null).statusLabel}
            </p>
            <Input
              value={names[selectedBeacon.id] ?? selectedBeacon.name}
              onChange={(event) =>
                setNames((current) => ({ ...current, [selectedBeacon.id]: event.target.value }))
              }
              onBlur={() => commitName(selectedBeacon)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              aria-label="Beacon name"
            />
            <ColorPalette
              value={selectedBeacon.color}
              onChange={(color) => onRecolor(selectedBeacon, color)}
              compact
            />
          </section>
        ) : null}

        {beacons.length > 0 && !replacing ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="drawer-clear" variant="danger">
                Clear all beacons
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all beacons?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes every active marker from the camera overlay. Single-delete undo does not apply
                  to this action.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancelButton>Cancel</AlertDialogCancelButton>
                <AlertDialogActionButton onClick={onClearAll}>Clear all</AlertDialogActionButton>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
