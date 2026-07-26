# Bug: Saved Beacons Jump on Subsequent Placement

## Bug Description
The first saved beacon appears visually anchored while the user moves the camera, but placing a second or third beacon can make the already saved beacon or beacons jump to a different horizontal screen position.

Expected behavior: saving another beacon must not change the apparent world heading of an existing beacon while the user remains at approximately the same physical placement location. Existing beacons should continue to move predictably relative to camera heading, and genuine user travel should still update their navigation bearing.

Actual behavior: a later placement can coincide with an accepted GPS fix from a different origin. The overlay immediately recomputes every saved beacon's bearing from that new origin, so older 100-meter anchors can move by a large fraction of the screen even though their stored records were not changed.

## Problem Statement
Saved beacon rendering is coupled directly to the latest accepted GPS fix. The existing geolocation jitter filter is not sufficient to preserve the visual placement bearing of a short-range beacon when a later placement uses a materially different or more accurate GPS fix.

## Solution Statement
Introduce a pure saved-beacon render-bearing resolver for approximate camera-created records. For eligible records with valid placement metadata, reconstruct the original placement origin from the saved destination, `placementHeading`, and `placementDistanceMeters`. Keep the stored placement heading inside a deterministic local origin-lock radius, blend over the shortest angular path from the stored heading to the live GPS bearing across a deterministic eased transition band, and use the live bearing after the user has materially moved away. Legacy records without an `anchorSource` remain eligible because current storage normalization treats them as camera-created. Invalid records and non-camera anchor sources retain the current live-bearing fallback.

Wire `BeaconOverlay` through this resolver without changing preview, pitch/frame, selection, or off-screen-indicator behavior. Add pure math and overlay regression tests that update the current GPS fix while keeping the saved beacon record constant.

This is a bounded PWA stabilization fix. A stateless resolver cannot distinguish every arbitrarily large GPS error from genuine travel. The automated contract therefore guarantees a full lock through a 35-meter same-place origin shift and a bounded visual response for a representative one-update 55-meter lateral GPS change under normal accuracy. Movement beyond the computed transition end must use the live navigation bearing.

## Steps to Reproduce
1. Open Sky Beacon on a phone and grant camera, GPS, and compass access.
2. Stand still and place the first beacon toward a recognizable direction.
3. Rotate or tilt the camera and confirm the first beacon remains associated with its placed world direction.
4. From approximately the same physical spot, start and confirm a second beacon in another direction.
5. Observe the first beacon jump horizontally when the live location fix changes.
6. Place a third beacon and observe that one or both older beacons can jump again.
7. In debug mode, compare the accepted latitude and longitude before and after the jump; the saved coordinates remain unchanged while the render origin changes.

## Root Cause Analysis
`components/beacons/BeaconOverlay.tsx` calculates every saved beacon's bearing on every render with:

- `bearingBetween(location.latitude, location.longitude, beacon.latitude, beacon.longitude)`
- `mapBearingToOverlayX(bearing, heading)`

The saved records are not mutated by this rendering path. `components/SkyBeaconApp.tsx` does reload active records during `saveDraft()`, but their coordinates remain the same. Selection styling also does not alter horizontal position; `BeaconPillar` receives `left` directly from the overlay's calculated `xPercent`.

`lib/sensors/use-geolocation.ts` keeps a high-accuracy `watchPosition()` subscription active and passes new readings through `stabilizeLocationFix()`. Starting another preview calls `requestPlacementSensors()`, and a later placement is therefore likely to occur around fresh sensor readings. The stabilizer intentionally accepts fixes after its movement threshold or when a new fix is materially more precise. This is valid for tracking location, but it means the location supplied to `BeaconOverlay` can change even while the user considers themselves stationary.

The current placement model stores a destination only 100 meters from the placement origin. A lateral origin change of 20 meters changes the bearing to a 100-meter target by approximately 11 degrees; 35 meters changes it by approximately 19 degrees. With the default 60-degree field of view, those changes correspond to roughly 19% and 32% of the overlay width. This geometric amplification explains why the jump is large and apparently unpredictable.

Current tests do not cover the interaction. `tests/unit/geolocation.test.ts` verifies which GPS fixes are accepted, while `tests/unit/beacon-overlay.test.tsx` verifies direction and frame behavior from a single fixed origin. No test holds an existing beacon constant, changes the live GPS origin as a later placement would, and asserts continuity of the rendered bearing.

`specs/BUG-11-beacon-multiple-placement-jump.md` identifies the same underlying defect, but its hard switch from stored heading to live bearing can create a new jump at the lock boundary. This plan supersedes BUG-11 for implementation, preserves its deterministic radius policy, and adds an eased transition band, provenance scoping, and measurable continuity requirements. Do not implement both plans.

The shared record model already distinguishes `camera`, map-backed, map-created, map-adjusted, ARCore, and visually refined anchors. Applying a camera-placement-heading lock to every record with placement metadata could override a later, more authoritative coordinate. This resolver must therefore opt in only `anchorSource: "camera"` and legacy source-less records. All other sources use their live coordinate bearing unless a future source-specific specification explicitly opts them in.

## Relevant Files
Likely files for a future implementation pass:

- `components/beacons/BeaconOverlay.tsx` - Computes saved-beacon bearings directly from the latest live location and should delegate to the new resolver.
- `components/SkyBeaconApp.tsx` - Starts placement sensor requests, builds drafts from the latest fix, reloads saved records, and supplies live location to the overlay.
- `components/beacons/BeaconPillar.tsx` - Confirms horizontal position is a direct presentation of the overlay's `xPercent`, not a selection-state side effect.
- `lib/sensors/use-geolocation.ts` - Defines accepted location-fix movement and currently contains reusable haversine distance math inside a sensor hook module.
- `lib/geospatial/bearing.ts` - Provides the live GPS fallback bearing.
- `lib/geospatial/destination.ts` - Provides the projection needed to reconstruct the approximate original placement origin.
- `lib/geospatial/angles.ts` - Provides heading normalization and should host or support shortest-arc angular interpolation if appropriate.
- `lib/beacons/beacon-types.ts` - Defines `anchorSource`, `placementHeading`, `placementDistanceMeters`, and accuracy metadata used by resolver eligibility and threshold policy.
- `lib/beacons/beacon-service.ts` - Confirms that legacy source-less stored records are normalized to `anchorSource: "camera"`; no persistence migration is required.
- `tests/unit/geolocation.test.ts` - Guards existing location stabilization while distance math is extracted.
- `tests/unit/beacon-overlay.test.tsx` - Should prove the overlay actually uses the stable resolved bearing without regressing frame and off-screen behavior.

### New Files

- `lib/geospatial/distance.ts` - Pure haversine distance helper shared by geolocation stabilization and beacon rendering.
- `lib/geospatial/beacon-render-bearing.ts` - Pure placement-origin reconstruction, lock/transition thresholds, angular blending, and live-bearing fallback.
- `tests/unit/beacon-render-bearing.test.ts` - Focused regression coverage for same-location GPS changes, transition continuity, material travel, and legacy data.

## Step by Step Tasks
IMPORTANT: These are instructions for a future implementation pass. Do not execute them while using this skill.

### 1. Extract Shared Geospatial Distance Math

- Move the haversine calculation from `lib/sensors/use-geolocation.ts` into `lib/geospatial/distance.ts`.
- Keep `distanceBetweenLocationFixes()` behavior and its existing public contract intact, either by delegating to the pure helper or by updating imports deliberately.
- Preserve all existing stale-fix, accuracy-envelope, and movement-threshold behavior.

### 2. Implement the Saved-Beacon Render-Bearing Resolver

- Create `lib/geospatial/beacon-render-bearing.ts` with no React, browser, storage, or sensor-hook dependencies.
- Define `isPlacementHeadingLockEligible(beacon)` and return `true` only when `anchorSource` is `"camera"` or `undefined`. Treat `undefined` as a legacy camera record. Return the live-bearing fallback for `metadata-enriched`, `map-cross-referenced`, `map-created`, `map-confirmed`, `map-adjusted`, `arcore-geospatial`, `visual-refined`, and unknown sources.
- Validate that the eligible beacon has valid finite coordinates, a finite `placementHeading`, and a positive finite `placementDistanceMeters`.
- Reconstruct the approximate placement origin by projecting from the saved destination along `placementHeading + 180` for `placementDistanceMeters`.
- Calculate the current distance from that reconstructed origin.
- Define and export or directly test the following named policy constants:

  ```ts
  const ORIGIN_LOCK_BASE_RATIO = 0.45;
  const ORIGIN_LOCK_CAP_RATIO = 0.8;
  const ORIGIN_LOCK_MIN_METERS = 45;
  const ORIGIN_LOCK_MIN_CAP_METERS = 80;
  const ORIGIN_LOCK_ACCURACY_BUFFER_METERS = 8;
  const ORIGIN_TRANSITION_WIDTH_RATIO = 0.55;
  const ORIGIN_TRANSITION_MIN_WIDTH_METERS = 35;
  ```

- Calculate the lock radius exactly as follows:

  ```ts
  const baseRadius = Math.max(
    ORIGIN_LOCK_MIN_METERS,
    placementDistance * ORIGIN_LOCK_BASE_RATIO,
  );
  const capRadius = Math.max(
    ORIGIN_LOCK_MIN_CAP_METERS,
    placementDistance * ORIGIN_LOCK_CAP_RATIO,
  );
  const currentAccuracy = positiveFinite(location.accuracy) ? location.accuracy : 0;
  const placementAccuracy = positiveFinite(beacon.locationAccuracyMeters)
    ? beacon.locationAccuracyMeters
    : 0;
  const accuracyRadius =
    currentAccuracy + placementAccuracy + ORIGIN_LOCK_ACCURACY_BUFFER_METERS;
  const lockRadius = Math.min(capRadius, Math.max(baseRadius, accuracyRadius));
  ```

- Calculate the transition end exactly as follows:

  ```ts
  const transitionWidth = Math.max(
    ORIGIN_TRANSITION_MIN_WIDTH_METERS,
    placementDistance * ORIGIN_TRANSITION_WIDTH_RATIO,
  );
  const transitionEnd = lockRadius + transitionWidth;
  ```

- For the current 100-meter model, normal accuracy resolves to a 45-meter lock radius and a 100-meter transition end. Accuracy may expand the lock radius to 80 meters and the transition end to 135 meters. Same-location GPS shifts through 35 meters therefore remain fully locked.
- Return the normalized stored `placementHeading` inside the lock radius.
- Between the lock radius and transition end, calculate clamped raw progress, apply smoothstep easing, and interpolate over the shortest angular arc:

  ```ts
  const rawProgress = clamp(
    (distanceFromPlacementOrigin - lockRadius) / (transitionEnd - lockRadius),
    0,
    1,
  );
  const easedProgress = rawProgress * rawProgress * (3 - 2 * rawProgress);
  const resolved = normalizeHeading(
    placementHeading + angularDifference(placementHeading, liveBearing) * easedProgress,
  );
  ```

- Do not interpolate headings as ordinary linear numbers across the 0/360-degree boundary.
- At or beyond the transition end, return the live GPS-to-beacon bearing.
- For legacy or malformed placement metadata, return the current live bearing without throwing.
- Keep eligibility and threshold policy exported or otherwise directly testable so later tuning does not require DOM tests.
- Do not add stateful smoothing, change GPS stabilization, or claim that this resolver can distinguish every large GPS error from physical movement. If device QA shows unacceptable jumps beyond the specified 55-meter test case, create a separate plan for hysteresis or temporal smoothing rather than silently expanding this bug.

### 3. Route Saved Overlay Positions Through the Resolver

- Replace the inline `bearingBetween()` call in `components/beacons/BeaconOverlay.tsx` with `resolveBeaconRenderBearing(beacon, location)`.
- Keep `mapBearingToOverlayX()`, `resolveRenderableAnchor()`, pitch behavior, selection behavior, indicator staggering, and status labels unchanged.
- Keep the preview beacon centered and independent of saved-beacon render-bearing logic.
- Do not rewrite saved beacon coordinates or placement metadata as part of rendering.

### 4. Add Pure Regression Coverage

- Create a beacon 100 meters from a known placement origin with matching placement metadata.
- Shift only the current location 20 meters and 35 meters laterally while keeping the record and camera heading constant; assert the resolved bearing remains the stored placement heading.
- Test both east and west GPS shifts so the behavior is not directionally biased.
- Assert the exact threshold policy for a 100-meter placement:
  - Normal current and placement accuracies produce a 45-meter lock radius and 100-meter transition end.
  - Current and placement accuracies of 35 meters produce a 78-meter lock radius and 133-meter transition end.
  - Extreme positive accuracies cap the lock radius at 80 meters and transition end at 135 meters.
- Simulate a single accepted fix changing directly from the reconstructed placement origin to 55 meters laterally under normal accuracy. Assert the resolved bearing changes by no more than 6 degrees from the stored heading, equivalent to no more than 10 percentage points of horizontal movement with the current 60-degree field of view. Test east and west.
- Test locations just below and just above the lock radius and transition end. Use explicit angular-delta assertions of at most 1 degree for locations separated by 1 meter across either boundary instead of the vague phrase "no large discontinuity."
- Test shortest-arc interpolation across 359/0 degrees.
- Move beyond the transition band and assert the resolver equals `bearingBetween()` so genuine travel still supports navigation.
- Test missing, non-finite, and invalid placement metadata and assert safe live-bearing fallback.
- Test `anchorSource: "camera"` and `anchorSource: undefined` as eligible.
- Test every non-camera `AnchorSource` as ineligible and assert it uses the live bearing even when placement metadata is valid. This protects future map-backed, map-adjusted, ARCore, and visually refined anchors from being overridden.
- Retain all existing geolocation stabilization tests after extracting distance math.

### 5. Add Overlay Integration Coverage

- Add a `BeaconOverlay` regression test with a saved record whose placement heading differs materially from the live bearing produced by a nearby shifted GPS fix.
- Assert the beacon remains centered for its stored world heading instead of becoming an incorrect left/right indicator.
- Rerender the same immutable camera beacon with the representative 55-meter lateral fix change and assert its horizontal presentation remains within the specified 10-percentage-point movement budget.
- Rerender with a materially distant location and assert the component switches to the expected live-bearing presentation.
- Render a non-camera anchor with otherwise identical placement metadata and assert the overlay uses its live coordinate bearing rather than the camera placement lock.
- Keep the existing preview, vertical miss, horizontal edge, and indicator-stagger tests passing.

### 6. Perform Manual Device Validation

- Use debug mode to record the accepted GPS coordinates before and during placement of beacons two and three.
- Verify older beacons do not jump while the device remains near the reconstructed placement origin.
- Walk materially beyond the transition distance and verify bearings converge smoothly to GPS navigation bearings.
- Verify rotating the phone still moves all beacons predictably relative to the camera.
- Verify pitch-only movement continues to affect vertical framing without changing horizontal world bearing.
- If map-backed or other non-camera fixtures are available, verify their coordinate bearings are not replaced with historical camera placement headings.

### 7. Run Validation Commands

- Run every command below and resolve any failure before considering the bug fixed.

## Validation Commands
Commands a future implementation pass should execute to validate the bug is fixed with zero regressions.

- `npm run test -- tests/unit/beacon-render-bearing.test.ts tests/unit/beacon-overlay.test.tsx tests/unit/geolocation.test.ts tests/unit/geospatial.test.ts` - Run focused regression and shared geospatial tests.
- `npm run test` - Run the complete unit and component test suite.
- `npm run lint` - Run ESLint with zero warnings.
- `npm run build` - Build the production Next.js application.
- `npm run test:e2e` - Run the browser smoke suite.
- Manual HTTPS phone test - Place three beacons from the same physical spot, then rotate, tilt, and walk beyond the transition distance while observing old beacon continuity.

## Notes
No new runtime dependency should be needed.

The focused pre-fix tests (`geospatial`, `geolocation`, and `beacon-overlay`) pass, confirming that the current suite lacks this interaction-level regression rather than detecting it already.

This plan supersedes `specs/BUG-11-beacon-multiple-placement-jump.md` for implementation. BUG-11 and BUG-12 must not both be implemented.

The 6-degree/10-percentage-point budget applies to the specified origin-to-55-meter lateral fix change under the deterministic normal-accuracy policy. It is a measurable regression target, not a claim that a stateless PWA resolver can hide every arbitrarily large or incorrect GPS fix. Larger observed stationary jumps require separate stateful hysteresis or temporal smoothing work.

This plan is intentionally limited to tactical stabilization of approximate camera anchors. It does not implement provider, map, ARCore, or broader anchor-provenance routes described by the map-anchoring RFCs, and it explicitly avoids overriding those stronger future anchor sources.
