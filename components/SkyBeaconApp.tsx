"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Compass, LocateFixed } from "lucide-react";
import { BeaconDrawer } from "@/components/beacons/BeaconDrawer";
import { BeaconOverlay } from "@/components/beacons/BeaconOverlay";
import { ColorPalette } from "@/components/beacons/ColorPalette";
import { CameraView } from "@/components/camera/CameraView";
import { BottomActionBar } from "@/components/hud/BottomActionBar";
import { Reticle } from "@/components/hud/Reticle";
import { SensorStatusBar } from "@/components/hud/SensorStatusBar";
import { ToastMessage, ToastViewport } from "@/components/hud/ToastViewport";
import { DebugPanel } from "@/components/hud/DebugPanel";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { Button } from "@/components/ui/button";
import { useDebugMode } from "@/lib/debug/use-debug-mode";
import {
  clearAllBeacons,
  createBeacon,
  listActiveBeacons,
  replaceBeacon,
  softDeleteBeacon,
  undoDeleteBeacon,
  updateBeaconColor,
  updateBeaconName,
} from "@/lib/beacons/beacon-service";
import type { BeaconColorId, BeaconDraft, BeaconRecord } from "@/lib/beacons/beacon-types";
import {
  BEACON_LIMIT,
  DEFAULT_PLACEMENT_DISTANCE_METERS,
  nextAvailableSlot,
} from "@/lib/beacons/validation";
import { destinationPoint } from "@/lib/geospatial/destination";
import { normalizeHeading } from "@/lib/geospatial/angles";
import { deriveConfidence } from "@/lib/sensors/confidence";
import { useCameraStream } from "@/lib/sensors/use-camera-stream";
import { useGeolocation } from "@/lib/sensors/use-geolocation";
import { useOrientation } from "@/lib/sensors/use-orientation";
import { registerServiceWorker } from "@/lib/pwa/register-service-worker";
import { getHTTPSRequiredMessage } from "@/lib/utils/platform";

const ONBOARDING_KEY = "sky-beacon:onboarding-complete";

function sortBeacons(beacons: BeaconRecord[]) {
  return [...beacons].sort((a, b) => a.slot - b.slot || a.created.localeCompare(b.created));
}

export function SkyBeaconApp() {
  const camera = useCameraStream();
  const location = useGeolocation();
  const orientation = useOrientation();
  const debugMode = useDebugMode();
  const toastTimerRef = useRef<number | null>(null);

  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [beacons, setBeacons] = useState<BeaconRecord[]>([]);
  const [selectedBeaconId, setSelectedBeaconId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<BeaconColorId>("cyan");
  const [previewActive, setPreviewActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<BeaconDraft | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [httpsWarning, setHttpsWarning] = useState<string | null>(null);

  const locationAgeMs = location.fix ? Date.now() - location.fix.timestamp : undefined;
  const confidence = useMemo(
    () =>
      deriveConfidence({
        hasLocation: location.fix !== null,
        hasHeading: orientation.heading !== null,
        locationAccuracyMeters: location.fix?.accuracy,
        locationAgeMs,
        headingStability: orientation.stability,
        headingIsSimulated: orientation.isSimulated,
      }),
    [location.fix, locationAgeMs, orientation.heading, orientation.isSimulated, orientation.stability],
  );

  const showToast = useCallback((message: Omit<ToastMessage, "id">, timeout = 4600) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    const nextToast = { ...message, id: Date.now() };
    setToast(nextToast);
    toastTimerRef.current = window.setTimeout(() => {
      setToast((current) => (current?.id === nextToast.id ? null : current));
    }, timeout);
  }, []);

  const refreshBeacons = useCallback(async () => {
    try {
      const records = sortBeacons(await listActiveBeacons());
      setBeacons(records);
      setSelectedBeaconId((current) => current ?? records[0]?.id ?? null);
    } catch (error) {
      showToast({
        title: "Saved beacons unavailable",
        detail: error instanceof Error ? error.message : "Saved beacons could not be loaded.",
      });
    }
  }, [showToast]);

  useEffect(() => {
    registerServiceWorker();
    setOnboardingComplete(window.localStorage.getItem(ONBOARDING_KEY) === "true");
    void refreshBeacons();

    // Check HTTPS requirements for iOS
    const httpsMessage = getHTTPSRequiredMessage();
    if (httpsMessage) {
      setHttpsWarning(httpsMessage);
      showToast({
        title: "HTTPS Required",
        detail: httpsMessage,
      });
    }

    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, [refreshBeacons, showToast]);

  // Auto-notify when sensors become ready during preview
  useEffect(() => {
    if (previewActive && location.status === "ready" && orientation.status === "ready") {
      if (location.fix && orientation.heading !== null) {
        showToast({
          title: "Sensors ready",
          detail: "GPS and compass are now active. You can confirm the beacon placement.",
        });
      }
    }
  }, [previewActive, location.status, orientation.status, location.fix, orientation.heading, showToast]);

  function completeOnboarding() {
    window.localStorage.setItem(ONBOARDING_KEY, "true");
    setOnboardingComplete(true);
    void camera.requestCamera();
  }

  function requestPlacementSensors() {
    location.requestLocation();
    void orientation.requestOrientation();
  }

  function handleCameraPermissionPress() {
    if (camera.status === "ready") {
      showToast(
        {
          title: "Camera permission already granted",
          detail: "The camera stream is active.",
        },
        2800,
      );
      return;
    }

    if (camera.status === "requesting") {
      showToast(
        {
          title: "Camera permission pending",
          detail: "Respond to the browser prompt to continue.",
        },
        2800,
      );
      return;
    }

    void camera.requestCamera();
  }

  function handleLocationPermissionPress() {
    if (location.status === "ready" && location.fix !== null) {
      showToast(
        {
          title: "GPS permission already granted",
          detail: "A GPS fix is active.",
        },
        2800,
      );
      return;
    }

    if (location.status === "requesting") {
      showToast(
        {
          title: "GPS permission pending",
          detail: "Respond to the browser prompt to continue.",
        },
        2800,
      );
      return;
    }

    location.requestLocation();
  }

  function handleCompassPermissionPress() {
    if (orientation.status === "ready" && orientation.heading !== null) {
      showToast(
        {
          title: "Compass permission already granted",
          detail: "Compass heading is active.",
        },
        2800,
      );
      return;
    }

    if (orientation.status === "requesting") {
      showToast(
        {
          title: "Compass permission pending",
          detail: "Respond to the browser prompt to continue.",
        },
        2800,
      );
      return;
    }

    void orientation.requestOrientation();
  }

  function startPreview() {
    requestPlacementSensors();

    // Check if sensors are blocked/unsupported/timeout, not just requesting
    const locationBlocked = location.status === "blocked" || location.status === "unsupported" || location.status === "timeout";
    const orientationBlocked = orientation.status === "blocked" || orientation.status === "unsupported";

    if (locationBlocked || orientationBlocked) {
      showToast({
        title: "Sensor data needed",
        detail: "Grant GPS and compass access, then preview the beacon again.",
      });
      return;
    }

    // If sensors are requesting or ready, start preview
    setPreviewActive(true);

    // Only show warning if we have data but it's low quality
    if ((location.fix || location.status === "requesting") && (orientation.heading !== null || orientation.status === "requesting")) {
      if (confidence === "low" || confidence === "unknown") {
        showToast({
          title: "Low confidence anchor",
          detail: "Placement can continue, but GPS or heading quality is weak.",
        });
      } else if (location.status === "requesting" || orientation.status === "requesting") {
        showToast({
          title: "Acquiring sensors",
          detail: "GPS and compass are being acquired. Beacon preview will activate when ready.",
        });
      }
    }
  }

  function buildDraft(): BeaconDraft | null {
    if (!location.fix || orientation.heading === null) {
      return null;
    }

    const heading = normalizeHeading(orientation.heading);
    const destination = destinationPoint(
      location.fix.latitude,
      location.fix.longitude,
      heading,
      DEFAULT_PLACEMENT_DISTANCE_METERS,
    );

    return {
      color: selectedColor,
      latitude: destination.latitude,
      longitude: destination.longitude,
      confidence,
      placementHeading: heading,
      placementDistanceMeters: DEFAULT_PLACEMENT_DISTANCE_METERS,
      locationAccuracyMeters: location.fix.accuracy,
      headingAccuracy: orientation.accuracyLabel,
      headingStability: orientation.stability,
    };
  }

  const saveDraft = useCallback(
    async (draft: BeaconDraft) => {
      setSaving(true);
      try {
        const active = sortBeacons(await listActiveBeacons());
        setBeacons(active);
        const slot = nextAvailableSlot(active);

        if (!slot) {
          setPendingDraft(draft);
          setReplacing(true);
          setDrawerOpen(true);
          showToast({
            title: "Beacon limit reached",
            detail: "Choose one saved beacon to replace.",
          });
          return;
        }

        const created = await createBeacon(draft, slot);
        setBeacons(sortBeacons([...active, created]));
        setSelectedBeaconId(created.id);
        setPendingDraft(null);
        setPreviewActive(false);
        navigator.vibrate?.(45);
        showToast({ title: "Beacon placed", detail: `${created.name} is now active on this device.` });
      } catch (error) {
        showToast({
          title: "Save failed",
          detail: error instanceof Error ? error.message : "The beacon could not be saved on this device.",
        });
      } finally {
        setSaving(false);
      }
    },
    [showToast],
  );

  async function confirmPlacement() {
    const draft = buildDraft();
    if (!draft) {
      showToast({
        title: "Cannot save yet",
        detail: "A fresh GPS fix and heading are required before confirmation.",
      });
      return;
    }

    await saveDraft(draft);
  }

  async function handleReplace(beacon: BeaconRecord) {
    if (!pendingDraft) {
      return;
    }

    setSaving(true);
    try {
      const updated = await replaceBeacon(beacon.id, pendingDraft, beacon.slot);
      setBeacons((current) => sortBeacons(current.map((item) => (item.id === updated.id ? updated : item))));
      setSelectedBeaconId(updated.id);
      setPendingDraft(null);
      setReplacing(false);
      setPreviewActive(false);
      setDrawerOpen(false);
      navigator.vibrate?.([35, 30, 35]);
      showToast({ title: "Beacon replaced", detail: `${updated.name} has the new anchor.` });
    } catch (error) {
      showToast({
        title: "Replacement failed",
        detail: error instanceof Error ? error.message : "The beacon could not be updated.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRename(beacon: BeaconRecord, name: string) {
    try {
      const updated = await updateBeaconName(beacon, name);
      setBeacons((current) => sortBeacons(current.map((item) => (item.id === updated.id ? updated : item))));
    } catch (error) {
      showToast({
        title: "Rename failed",
        detail: error instanceof Error ? error.message : "The beacon name was not saved.",
      });
    }
  }

  async function handleRecolor(beacon: BeaconRecord, color: BeaconColorId) {
    try {
      const updated = await updateBeaconColor(beacon.id, color);
      setBeacons((current) => sortBeacons(current.map((item) => (item.id === updated.id ? updated : item))));
    } catch (error) {
      showToast({
        title: "Color update failed",
        detail: error instanceof Error ? error.message : "The beacon color was not saved.",
      });
    }
  }

  async function handleDelete(beacon: BeaconRecord) {
    try {
      await softDeleteBeacon(beacon.id);
      setBeacons((current) => current.filter((item) => item.id !== beacon.id));
      setSelectedBeaconId((current) => (current === beacon.id ? null : current));
      showToast(
        {
          title: "Beacon deleted",
          detail: beacon.name,
          actionLabel: "Undo",
          onAction: async () => {
            try {
              const restored = await undoDeleteBeacon(beacon.id);
              setBeacons((current) => sortBeacons([...current, restored]));
              setSelectedBeaconId(restored.id);
              setToast(null);
            } catch (error) {
              showToast({
                title: "Undo failed",
                detail: error instanceof Error ? error.message : "The slot may no longer be available.",
              });
            }
          },
        },
        6000,
      );
    } catch (error) {
      showToast({
        title: "Delete failed",
        detail: error instanceof Error ? error.message : "The beacon was not removed.",
      });
    }
  }

  async function handleClearAll() {
    try {
      await clearAllBeacons(beacons);
      setBeacons([]);
      setSelectedBeaconId(null);
      showToast({ title: "All beacons cleared" });
    } catch (error) {
      showToast({
        title: "Clear all failed",
        detail: error instanceof Error ? error.message : "Saved beacons were not cleared.",
      });
    }
  }

  const mode = saving ? "saving" : previewActive ? "preview" : "normal";
  const canPreview = !saving && camera.status !== "requesting";
  const canConfirm = previewActive && !saving && location.fix !== null && orientation.heading !== null;
  const lowConfidence = confidence === "low" || confidence === "unknown";
  const calibrationVisible =
    orientation.status === "simulated" ||
    orientation.status === "blocked" ||
    orientation.stability === "unstable";

  return (
    <main className="app-shell">
      <CameraView
        videoRef={camera.videoRef}
        status={camera.status}
        error={camera.error}
        onRequestCamera={camera.requestCamera}
        requiresHTTPS={camera.requiresHTTPS}
      />

      <div className="hud-layer">
        <SensorStatusBar
          cameraStatus={camera.status}
          locationStatus={location.status}
          orientationStatus={orientation.status}
          heading={orientation.heading}
          stability={orientation.stability}
          confidence={confidence}
          onRequestCamera={handleCameraPermissionPress}
          onRequestLocation={handleLocationPermissionPress}
          onRequestOrientation={handleCompassPermissionPress}
        />

        {debugMode ? (
          <DebugPanel
            cameraStatus={camera.status}
            location={location.fix}
            heading={orientation.heading}
            pitch={orientation.pitch}
            orientationStatus={orientation.status}
            stability={orientation.stability}
            accuracyLabel={orientation.accuracyLabel}
            confidence={confidence}
            beacons={beacons}
            directional={location.fix !== null && orientation.heading !== null}
          />
        ) : null}

        <BeaconOverlay
          beacons={beacons}
          preview={previewActive ? { color: selectedColor, confidence } : null}
          location={location.fix}
          heading={orientation.heading}
          pitch={orientation.pitch}
          selectedBeaconId={selectedBeaconId}
          onSelectBeacon={(beaconId) => {
            setSelectedBeaconId(beaconId);
            setDrawerOpen(true);
          }}
        />

        <Reticle />

        <div className="side-tools" aria-label="Sensor tools">
          <Button variant="secondary" size="icon" onClick={requestPlacementSensors} aria-label="Request GPS and compass">
            <LocateFixed size={18} />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => void orientation.requestOrientation()} aria-label="Request compass">
            <Compass size={18} />
          </Button>
        </div>

        {previewActive ? (
          <section className="preview-tools" aria-label="Preview controls">
            <div>
              <p className="tiny-label">Beacon color</p>
              <strong>Aim at the beacon base, then save</strong>
            </div>
            <ColorPalette value={selectedColor} onChange={setSelectedColor} />
            {lowConfidence ? (
              <p className="warning-text">
                <AlertTriangle size={14} />
                Approximate anchor: GPS or heading confidence is weak.
              </p>
            ) : (
              <p className="warning-text">
                <AlertTriangle size={14} />
                Approximate browser anchor — not a precise ground location.
              </p>
            )}
          </section>
        ) : null}

        {calibrationVisible ? (
          <aside className="calibration-prompt">
            <AlertTriangle size={15} />
            <span>
              {orientation.status === "simulated"
                ? "Compass is simulated on this device."
                : "Move the phone slowly to improve heading stability."}
            </span>
          </aside>
        ) : null}

        {httpsWarning || location.error || orientation.error ? (
          <aside className="sensor-warning">
            <AlertTriangle size={15} />
            <span>{httpsWarning ?? location.error ?? orientation.error}</span>
          </aside>
        ) : null}

        <BottomActionBar
          mode={mode}
          confidence={confidence}
          canPreview={canPreview}
          canConfirm={canConfirm}
          activeCount={Math.min(beacons.length, BEACON_LIMIT)}
          onStartPreview={startPreview}
          onConfirm={confirmPlacement}
          onCancel={() => {
            setPreviewActive(false);
            setPendingDraft(null);
            setReplacing(false);
          }}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
      </div>

      {onboardingComplete === false ? <OnboardingFlow onComplete={completeOnboarding} /> : null}

      <BeaconDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open && replacing) {
            setReplacing(false);
          }
        }}
        beacons={beacons}
        selectedBeaconId={selectedBeaconId}
        replacing={replacing}
        onSelect={setSelectedBeaconId}
        onRename={handleRename}
        onRecolor={handleRecolor}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
        onReplace={handleReplace}
      />

      <ToastViewport toast={toast} />
    </main>
  );
}
