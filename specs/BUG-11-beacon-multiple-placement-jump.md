# Bug: Beacon Multiple Placement Jump

## Bug Description
Placing additional beacons still makes previously saved beacons jump around substantially from the screen position where they were originally placed. A single saved beacon appears reasonably stable, but once the user enters placement mode again or confirms another beacon, the already saved beacons can shift left or right by a large amount.

Expected behavior: when the user is still standing near the original placement location, each saved beacon should remain visually anchored to the heading where it was placed. Starting or saving another beacon should not make older beacons jump unless the user has physically moved far enough for a real parallax change.

Actual behavior: adding another beacon can wake or refresh GPS, accept a new location fix, and cause all saved beacons to be reprojected from that new origin. Because saved anchors are only 100 meters away, normal GPS movement of 20 to 35 meters can create large bearing changes and visibly move existing beacons.

## Problem Statement
Saved-beacon rendering needs to distinguish between true user movement and placement-time GPS origin noise. The app should keep existing anchors stable while the user remains near their original placement origin, without removing GPS-backed navigation behavior when the user clearly moves away.

## Solution Statement
Add a pure saved-beacon render-bearing helper that prefers each beacon's stored `placementHeading` while the current GPS fix is still within a local accuracy radius of that beacon's reconstructed placement origin. Reconstruct the placement origin by projecting backward from the saved beacon coordinates using `placementHeading + 180` and `placementDistanceMeters`. When the user moves beyond the lock radius, fall back to the current GPS-to-beacon bearing.

This keeps the beacon stable from the place where it was set, uses existing persisted fields, and still allows directional navigation after material movement. Legacy records without placement metadata should continue using the current `bearingBetween(location, beacon)` behavior.

## Steps to Reproduce
1. Open Sky Beacon on a phone with camera, GPS, and compass enabled.
2. Stand still and place a first beacon while facing a fixed direction.
3. Without intentionally changing position, start previewing or place a second beacon in another direction.
4. Watch the first beacon after the new placement flow refreshes GPS.
5. Observe that the first beacon can jump substantially from its original screen position.
6. Repeat with a third beacon; older beacons can shift again as the live GPS origin changes.

## Root Cause Analysis
`components/beacons/BeaconOverlay.tsx` renders every saved beacon by calculating a fresh bearing from the current live GPS fix to the saved beacon coordinate:

- `bearingBetween(location.latitude, location.longitude, beacon.latitude, beacon.longitude)`
- `mapBearingToOverlayX(bearing, heading)`

This means saved beacons are reprojected every time `location.fix` changes. `components/SkyBeaconApp.tsx` calls `requestPlacementSensors()` when placement preview starts, and the geolocation watcher in `lib/sensors/use-geolocation.ts` may accept a refreshed fix during placement. `stabilizeLocationFix()` filters small jitter, but it still accepts movement above its threshold or a more precise fix that appears materially different.

For a beacon placed 100 meters away, ordinary GPS origin changes are amplified into large bearing changes. A 20 meter lateral origin shift changes the bearing to a 100 meter target by about 11 degrees, which is about 18 percent of the current 60-degree overlay width. A 35 meter shift is about 19 degrees, or roughly 32 percent of the overlay width. That matches the reported "jump around substantially" behavior even when the user is effectively standing in the same place.

The previous `BUG-04-beacon-anchor-drift` plan reduced false movement from heading and GPS jitter, but the current rendering model still uses live GPS as the sole render origin for all saved beacons. It does not use the beacon's saved `placementHeading` to preserve the original visual anchor while the user remains near the placement location.

## Relevant Files
Likely files for a future implementation pass:

- `components/beacons/BeaconOverlay.tsx` - Currently computes saved-beacon bearings directly from the current live location to each saved beacon; should call the new render-bearing helper.
- `components/SkyBeaconApp.tsx` - Starts placement sensor acquisition and passes `location.fix` into the overlay; useful for understanding the placement-time refresh path.
- `lib/sensors/use-geolocation.ts` - Contains the current location stabilization and distance helper; future work should avoid importing sensor hook modules for pure geospatial rendering math.
- `lib/geospatial/destination.ts` - Can reconstruct a beacon's original placement origin by projecting backward from the saved beacon coordinate.
- `lib/geospatial/bearing.ts` - Provides the fallback true GPS bearing when the user has moved beyond the local origin lock radius.
- `tests/unit/geospatial.test.ts` - Existing geospatial coverage can be extended, or a new focused render-bearing test file can be added.
- `tests/unit/geolocation.test.ts` - Existing stabilization tests help guard the prior GPS jitter fix and should remain part of validation.
- `tests/e2e/sky-beacon.smoke.spec.ts` - Optional browser-level coverage can seed saved beacon records and mocked locations if unit coverage is not enough.

### New Files
- `lib/geospatial/distance.ts` - Pure location distance helper extracted from `use-geolocation.ts` so both GPS stabilization and render-bearing logic can share it without coupling rendering to a hook module.
- `lib/geospatial/beacon-render-bearing.ts` - Pure helper for reconstructing placement origin, deciding whether the current location is still inside the local origin lock radius, and choosing either `placementHeading` or live GPS bearing.
- `tests/unit/beacon-render-bearing.test.ts` - Regression coverage proving existing beacons do not jump during nearby GPS-origin changes, while still updating after material movement.

## Step by Step Tasks
IMPORTANT: These are instructions for a future implementation pass. Do not execute them while using this skill.

### 1. Extract Pure Distance Math
- Move the haversine distance calculation from `lib/sensors/use-geolocation.ts` into `lib/geospatial/distance.ts`.
- Keep the exported behavior equivalent to `distanceBetweenLocationFixes()` so existing geolocation tests continue to pass.
- Update `use-geolocation.ts` to import the pure helper and preserve the existing stabilization behavior.

### 2. Add Saved Beacon Render-Bearing Helper
- Create `lib/geospatial/beacon-render-bearing.ts`.
- Add a helper to reconstruct a beacon's placement origin:
  - Require finite `placementHeading` and positive `placementDistanceMeters`.
  - Use `destinationPoint(beacon.latitude, beacon.longitude, normalizeHeading(beacon.placementHeading + 180), beacon.placementDistanceMeters)`.
- Add a helper that computes an origin lock radius from the current fix accuracy, the beacon's `locationAccuracyMeters`, and a minimum local radius around the placement distance. For the current 100 meter placement distance, the radius should be large enough to absorb normal 20 to 35 meter GPS-origin shifts.
- Add `resolveBeaconRenderBearing(beacon, location)`:
  - If placement metadata is missing or invalid, return `bearingBetween(currentLocation, beacon)`.
  - If the current fix is within the origin lock radius of the reconstructed placement origin, return the normalized `beacon.placementHeading`.
  - Otherwise return the live `bearingBetween(currentLocation, beacon)`.

### 3. Wire Overlay Rendering Through The Helper
- Update `components/beacons/BeaconOverlay.tsx` so saved beacons call `resolveBeaconRenderBearing()` instead of calculating `bearingBetween()` inline.
- Keep preview behavior unchanged: the preview beacon remains centered at `xPercent={50}`.
- Keep off-screen indicators and `mapBearingToOverlayX()` behavior unchanged after the bearing is resolved.

### 4. Add Regression Tests
- Add a unit test that places a beacon 100 meters north from an origin, then renders from a current fix shifted 20 to 35 meters east or west; assert the resolved bearing stays close to the stored `placementHeading`.
- Add a unit test that moves the current fix beyond the origin lock radius; assert the helper falls back to the true GPS bearing.
- Add a unit test for legacy or corrupt records with missing placement metadata; assert the helper uses `bearingBetween()` fallback.
- Keep existing `geolocation.test.ts` expectations passing after extracting distance math.

### 5. Run Validation Commands
- Run the validation commands below and fix any failures.

## Validation Commands
Commands a future implementation pass should execute to validate the bug is fixed with zero regressions.

- `npm run test` - Run unit tests for geospatial, beacon, orientation, and geolocation behavior.
- `npm run lint` - Run ESLint with zero warnings.
- `npm run build` - Build the Next.js app.
- Optional manual validation: on a phone, place beacon 1, place beacon 2 and beacon 3 from the same physical spot, and verify older beacons remain near their original headings while the phone is not materially moved.

## Notes
No new runtime library should be needed. The bug skill's `python3` command resolved to the Windows Store alias, so the numbering script was run with Codex's bundled Python executable instead: `C:\Users\Kirill\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`.
