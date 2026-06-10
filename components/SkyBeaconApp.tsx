"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Compass, LocateFixed } from "lucide-react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { BeaconDrawer } from "@/components/beacons/BeaconDrawer";
import { BeaconOverlay } from "@/components/beacons/BeaconOverlay";
import { ColorPalette } from "@/components/beacons/ColorPalette";
import { CameraView } from "@/components/camera/CameraView";
import { BottomActionBar } from "@/components/hud/BottomActionBar";
import { Reticle } from "@/components/hud/Reticle";
import { SensorStatusBar } from "@/components/hud/SensorStatusBar";
import { ToastMessage, ToastViewport } from "@/components/hud/ToastViewport";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/lib/pocketbase/auth-service";
import { currentAuthUser, signInWithEmail, signOut, signUpWithEmail } from "@/lib/pocketbase/auth-service";
import { getPocketBase, isPocketBaseNetworkError, pocketBaseUrl } from "@/lib/pocketbase/client";
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

const ONBOARDING_KEY = "sky-beacon:onboarding-complete";

function sortBeacons(beacons: BeaconRecord[]) {
  return [...beacons].sort((a, b) => a.slot - b.slot || a.created.localeCompare(b.created));
}

export function SkyBeaconApp() {
  const camera = useCameraStream();
  const location = useGeolocation();
  const orientation = useOrientation();
  const pbRef = useRef<ReturnType<typeof getPocketBase> | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [beacons, setBeacons] = useState<BeaconRecord[]>([]);
  const [selectedBeaconId, setSelectedBeaconId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<BeaconColorId>("cyan");
  const [previewActive, setPreviewActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<BeaconDraft | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

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

  const checkBackendHealth = useCallback(async () => {
    try {
      const response = await fetch(`${pocketBaseUrl()}/api/health`, { cache: "no-store" });
      setBackendOnline(response.ok);
      return response.ok;
    } catch {
      setBackendOnline(false);
      return false;
    }
  }, []);

  const refreshBeacons = useCallback(
    async (authUser = user) => {
      if (!authUser || !pbRef.current) {
        setBeacons([]);
        setSelectedBeaconId(null);
        return;
      }

      try {
        const records = sortBeacons(await listActiveBeacons(pbRef.current));
        setBackendOnline(true);
        setBeacons(records);
        setSelectedBeaconId((current) => current ?? records[0]?.id ?? null);
      } catch (error) {
        setBackendOnline(!isPocketBaseNetworkError(error));
        showToast({
          title: "PocketBase unavailable",
          detail: error instanceof Error ? error.message : "Saved beacons could not be loaded.",
        });
      }
    },
    [showToast, user],
  );

  useEffect(() => {
    registerServiceWorker();
    setOnboardingComplete(window.localStorage.getItem(ONBOARDING_KEY) === "true");

    const pb = getPocketBase();
    pbRef.current = pb;
    setUser(currentAuthUser(pb));

    const unsubscribe = pb.authStore.onChange(() => {
      setUser(currentAuthUser(pb));
    });

    void checkBackendHealth();

    return () => {
      unsubscribe();
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, [checkBackendHealth]);

  useEffect(() => {
    if (authOpen) {
      void checkBackendHealth();
    }
  }, [authOpen, checkBackendHealth]);

  useEffect(() => {
    void refreshBeacons(user);
  }, [refreshBeacons, user]);

  function completeOnboarding() {
    window.localStorage.setItem(ONBOARDING_KEY, "true");
    setOnboardingComplete(true);
    void camera.requestCamera();
  }

  function requestPlacementSensors() {
    location.requestLocation();
    void orientation.requestOrientation();
  }

  function startPreview() {
    requestPlacementSensors();

    if (!location.fix || orientation.heading === null) {
      showToast({
        title: "Sensor data needed",
        detail: "Grant GPS and compass access, then preview the beacon again.",
      });
      return;
    }

    setPreviewActive(true);
    if (confidence === "low" || confidence === "unknown") {
      showToast({
        title: "Low confidence anchor",
        detail: "Placement can continue, but GPS or heading quality is weak.",
      });
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
    async (draft: BeaconDraft, authUser: AuthUser) => {
      if (!pbRef.current) {
        showToast({ title: "PocketBase unavailable", detail: "The client is not initialized." });
        return;
      }

      setSaving(true);
      try {
        const active = sortBeacons(await listActiveBeacons(pbRef.current));
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

        const created = await createBeacon(pbRef.current, authUser.id, draft, slot);
        setBackendOnline(true);
        setBeacons(sortBeacons([...active, created]));
        setSelectedBeaconId(created.id);
        setPendingDraft(null);
        setPreviewActive(false);
        navigator.vibrate?.(45);
        showToast({ title: "Beacon placed", detail: `${created.name} is now active.` });
      } catch (error) {
        setBackendOnline(!isPocketBaseNetworkError(error));
        showToast({
          title: "Save failed",
          detail: error instanceof Error ? error.message : "PocketBase could not save the beacon.",
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

    if (!user) {
      setPendingDraft(draft);
      setAuthOpen(true);
      showToast({
        title: "Sign in required",
        detail: "The preview is preserved while you authenticate.",
      });
      return;
    }

    await saveDraft(draft, user);
  }

  async function handleSignIn(email: string, password: string) {
    if (!pbRef.current) return;
    setAuthLoading(true);
    setAuthError(null);

    try {
      const authUser = await signInWithEmail(pbRef.current, email, password);
      setUser(authUser);
      setBackendOnline(true);
      setAuthOpen(false);
      await refreshBeacons(authUser);
      if (pendingDraft) {
        await saveDraft(pendingDraft, authUser);
      }
    } catch (error) {
      setBackendOnline(!isPocketBaseNetworkError(error));
      setAuthError(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignUp(email: string, password: string) {
    if (!pbRef.current) return;
    setAuthLoading(true);
    setAuthError(null);

    try {
      const authUser = await signUpWithEmail(pbRef.current, email, password);
      setUser(authUser);
      setBackendOnline(true);
      setAuthOpen(false);
      await refreshBeacons(authUser);
      if (pendingDraft) {
        await saveDraft(pendingDraft, authUser);
      }
    } catch (error) {
      setBackendOnline(!isPocketBaseNetworkError(error));
      setAuthError(error instanceof Error ? error.message : "Sign-up failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleSignOut() {
    if (!pbRef.current) return;
    signOut(pbRef.current);
    setUser(null);
    setBeacons([]);
    setSelectedBeaconId(null);
    void checkBackendHealth();
    showToast({ title: "Signed out", detail: "Camera preview remains available." });
  }

  async function handleReplace(beacon: BeaconRecord) {
    if (!pendingDraft || !user || !pbRef.current) {
      return;
    }

    setSaving(true);
    try {
      const updated = await replaceBeacon(pbRef.current, beacon.id, user.id, pendingDraft, beacon.slot);
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
        detail: error instanceof Error ? error.message : "PocketBase could not update the beacon.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRename(beacon: BeaconRecord, name: string) {
    if (!pbRef.current) return;
    try {
      const updated = await updateBeaconName(pbRef.current, beacon, name);
      setBeacons((current) => sortBeacons(current.map((item) => (item.id === updated.id ? updated : item))));
    } catch (error) {
      showToast({
        title: "Rename failed",
        detail: error instanceof Error ? error.message : "The beacon name was not saved.",
      });
    }
  }

  async function handleRecolor(beacon: BeaconRecord, color: BeaconColorId) {
    if (!pbRef.current) return;
    try {
      const updated = await updateBeaconColor(pbRef.current, beacon.id, color);
      setBeacons((current) => sortBeacons(current.map((item) => (item.id === updated.id ? updated : item))));
    } catch (error) {
      showToast({
        title: "Color update failed",
        detail: error instanceof Error ? error.message : "The beacon color was not saved.",
      });
    }
  }

  async function handleDelete(beacon: BeaconRecord) {
    if (!pbRef.current) return;
    try {
      await softDeleteBeacon(pbRef.current, beacon.id);
      setBeacons((current) => current.filter((item) => item.id !== beacon.id));
      setSelectedBeaconId((current) => (current === beacon.id ? null : current));
      showToast(
        {
          title: "Beacon deleted",
          detail: beacon.name,
          actionLabel: "Undo",
          onAction: async () => {
            if (!pbRef.current) return;
            try {
              const restored = await undoDeleteBeacon(pbRef.current, beacon.id);
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
    if (!pbRef.current) return;
    try {
      await clearAllBeacons(pbRef.current, beacons);
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
  const canPreview = camera.status !== "requesting" && !saving;
  const canConfirm = previewActive && location.fix !== null && orientation.heading !== null && !saving;
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
      />

      <div className="hud-layer">
        <SensorStatusBar
          cameraStatus={camera.status}
          locationStatus={location.status}
          orientationStatus={orientation.status}
          heading={orientation.heading}
          stability={orientation.stability}
          confidence={confidence}
          isAuthenticated={user !== null}
          backendOnline={backendOnline}
        />

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
          {user ? (
            <Button variant="secondary" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <span className="avatar-dot" />
            </Button>
          ) : null}
        </div>

        {previewActive ? (
          <section className="preview-tools" aria-label="Preview controls">
            <div>
              <p className="tiny-label">Beacon color</p>
              <strong>Choose before saving</strong>
            </div>
            <ColorPalette value={selectedColor} onChange={setSelectedColor} />
            {lowConfidence ? (
              <p className="warning-text">
                <AlertTriangle size={14} />
                Approximate anchor: GPS or heading confidence is weak.
              </p>
            ) : null}
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

        {location.error || orientation.error ? (
          <aside className="sensor-warning">
            <AlertTriangle size={15} />
            <span>{location.error ?? orientation.error}</span>
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
        isAuthenticated={user !== null}
        backendOnline={backendOnline}
        replacing={replacing}
        onOpenAuth={() => setAuthOpen(true)}
        onSelect={setSelectedBeaconId}
        onRename={handleRename}
        onRecolor={handleRecolor}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
        onReplace={handleReplace}
      />

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        loading={authLoading}
        error={authError}
        backendOnline={backendOnline}
        backendUrl={pocketBaseUrl()}
      />

      <ToastViewport toast={toast} />
    </main>
  );
}
