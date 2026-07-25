# RFC: Stable Saved-Beacon Rendering Across Multiple Placements

RFC Type: Combined
Status: Superseded
Date: 2026-06-15
Source: `specs/BUG-11-beacon-multiple-placement-jump.md`; user request: "fix beacon jitter conversation"
Related RFCs: `specs/RFC-map-anchored-beacon-system.md`
Related ADRs: None
Owner: Codex
Approvers: Unassigned
Audience: Future implementation agents, reviewers, and QA
Implementation Approval: Required
Repo Root: `C:\Skymark`

Supersession Note: This RFC remains useful only as a narrow tactical stabilization proposal for the fixed-distance MVP model. It is superseded as product direction by `specs/RFC-map-anchored-beacon-system.md`, which reframes the desired next major update around map/geospatial anchoring options, shared anchor provenance, optional visible map UI, and optional close-range visual refinement. Do not treat this BUG-11 RFC as the roadmap for the post-MVP anchoring system.

## 1. Executive Summary

Saved Sky Beacon anchors currently render from the latest live GPS fix to each saved beacon coordinate. That is correct for long-range navigation, but it is unstable for this product's current placement model: beacons are saved only 100 meters away, so normal phone GPS origin changes of 20 to 35 meters can reproject old anchors by roughly 11 to 19 degrees. With the current 60-degree horizontal overlay mapping, that equals about 19 to 32 percent of the screen width.

The recommended fix is to add a pure saved-beacon render-bearing helper. For each saved beacon with valid placement metadata, the helper reconstructs the original placement origin by projecting backward from the stored beacon coordinate using `placementHeading + 180` and `placementDistanceMeters`. While the current GPS fix remains inside a deterministic local-origin lock radius around that reconstructed origin, the helper returns the stored `placementHeading`. Once the user moves beyond that local radius, the helper falls back to the true live GPS-to-beacon bearing.

This path stabilizes old beacons during same-location multi-placement flows, preserves existing persisted records, keeps the preview behavior unchanged, and continues to support navigation when the user materially moves away from the placement spot. It should be implemented with focused unit tests before any broader rendering or data-model changes.

## 2. Background And Current Behavior

Sky Beacon is a mobile-first PWA for placing camera-overlay beacons 100 meters ahead of the user. A beacon placement stores a geospatial destination coordinate plus metadata about the placement context, including `placementHeading`, `placementDistanceMeters`, `locationAccuracyMeters`, `headingAccuracy`, and `headingStability`.

Current placement flow:

1. `components/SkyBeaconApp.tsx` starts GPS and compass acquisition through `requestPlacementSensors()`.
2. `buildDraft()` normalizes the current heading, calculates a destination with `destinationPoint(location.fix.latitude, location.fix.longitude, heading, DEFAULT_PLACEMENT_DISTANCE_METERS)`, and stores placement metadata.
3. `createBeacon()` or `replaceBeacon()` persists the record in browser `localStorage`.
4. `components/beacons/BeaconOverlay.tsx` later renders each saved beacon.

Current saved-beacon render flow:

1. `BeaconOverlay` requires both `location` and `heading` before directional rendering.
2. For each saved beacon, it calls `bearingBetween(location.latitude, location.longitude, beacon.latitude, beacon.longitude)`.
3. It passes the resulting bearing and the current heading into `mapBearingToOverlayX()`.
4. `mapBearingToOverlayX()` maps angular difference into an x position across a 60-degree horizontal field of view by default.

Current preview behavior:

- The unsaved preview beacon is rendered at `xPercent={50}`.
- Preview is intentionally screen-centered and should not be changed by this RFC.

## 3. Problem Statement

The app needs saved beacons to remain visually anchored to their placement heading while the user is still standing near the original placement spot, even if later placement flows refresh GPS and produce a different nearby location fix.

The implementation must avoid freezing all future navigation behavior. If the user physically moves far enough away from the placement origin, saved beacons should again use the true current GPS-to-beacon bearing.

## Decision Scope And Packaging

This is a combined research, architecture, and implementation RFC because BUG-11 is a contained rendering-policy fix with one expected implementation owner and one approval moment. The RFC decides how saved-beacon render bearings are resolved near the original placement origin, the helper boundaries, the expected files, validation commands, and the agent execution contract.

This RFC does not approve product-code implementation by itself. A future agent may implement only after this RFC is accepted or the user explicitly grants implementation approval in the active task.

Separate follow-up RFCs should be created if implementation expands into persistence schema changes, explicit placement-origin storage, AR/world anchoring, new sensor permissions, production telemetry, or broader navigation behavior.

## 4. Goals

- Keep previously saved beacons visually stable when a user places a second or third beacon from approximately the same physical spot.
- Use existing persisted placement metadata where available.
- Preserve legacy behavior for records without valid placement metadata.
- Preserve current preview, off-screen indicator, drawer, persistence, and sensor acquisition behavior.
- Keep the geospatial decision logic in pure helpers that can be unit tested without React or browser sensor APIs.
- Provide deterministic thresholds and fallback rules for future implementation agents.
- Validate the fix with automated unit tests and existing lint/build checks.

## 5. Non-Goals

- Do not implement full AR world tracking, SLAM, or camera-frame anchoring.
- Do not replace the current GPS-backed destination-coordinate model.
- Do not migrate localStorage records or require users to recreate existing beacons.
- Do not change the default placement distance from 100 meters.
- Do not change the visual design of beacon pillars or off-screen indicators.
- Do not change sensor permission flows or GPS acquisition timing as part of the recommended fix.
- Do not add runtime dependencies unless a future implementation discovers an unavoidable need.

## 6. Evidence And Source Map

- `specs/BUG-11-beacon-multiple-placement-jump.md` - Existing bug plan with symptom description, root-cause hypothesis, and first-pass implementation tasks.
- `components/beacons/BeaconOverlay.tsx` - Saved beacons currently calculate bearings directly from the latest live `location` to each saved beacon coordinate.
- `components/SkyBeaconApp.tsx` - Placement flow stores `placementHeading` and `placementDistanceMeters` when creating or replacing beacons.
- `lib/beacons/beacon-types.ts` - `BeaconRecord` supports optional `placementHeading` and required `placementDistanceMeters`.
- `lib/beacons/beacon-service.ts` - LocalStorage normalization defaults missing `placementDistanceMeters` to `100` and preserves optional `placementHeading`.
- `lib/beacons/validation.ts` - Defines `DEFAULT_PLACEMENT_DISTANCE_METERS = 100` and validates normalized placement headings when present.
- `lib/geospatial/bearing.ts` - Provides live GPS-to-beacon bearing math.
- `lib/geospatial/destination.ts` - Provides destination projection; can also reconstruct the original placement origin by projecting backward.
- `lib/geospatial/overlay-position.ts` - Converts bearing difference into overlay x percent with a default 60-degree horizontal field of view.
- `lib/sensors/use-geolocation.ts` - Owns current `LocationFix`, GPS stabilization, and the existing `distanceBetweenLocationFixes()` helper.
- `tests/unit/geospatial.test.ts` - Existing geospatial coverage for heading normalization, destination projection, bearing, and overlay mapping.
- `tests/unit/geolocation.test.ts` - Existing GPS stabilization coverage that must keep passing.
- `tests/unit/beacons.test.ts` - Existing persistence/schema coverage for beacon records.
- `tests/e2e/sky-beacon.smoke.spec.ts` - Browser smoke tests that seed saved beacons in localStorage.

## Prior Decisions And Retrieval Context

- `specs/SPEC-001-sky-beacon-mvp.md` establishes the MVP model: camera-first PWA, local beacon persistence, pure geospatial utilities, and directional DOM/CSS overlays.
- `technical-specification.md` is the broader architecture source for local beacon persistence, PWA behavior, component structure, and testing expectations.
- `specs/BUG-04-beacon-anchor-drift.md` addressed earlier heading and GPS stabilization causes, but did not add per-beacon render-origin policy.
- `specs/BUG-11-beacon-multiple-placement-jump.md` is the immediate bug source for this RFC and describes the observed same-location multi-placement jump.
- No ADR currently records the saved-beacon render-bearing decision.

## 7. Constraints And Invariants

- A saved beacon destination is currently a coordinate approximately 100 meters away from the placement origin.
- `placementHeading` represents the heading the user faced when the destination was created.
- `placementDistanceMeters` represents the projection distance used during placement and is currently 100 meters for new records.
- Records may exist without `placementHeading`, because the field is optional on `BeaconRecord`.
- Records may contain malformed persisted data; the app already normalizes or drops invalid records through `beacon-service` and `validation`.
- Directional rendering currently requires `location !== null` and `heading !== null`.
- `mapBearingToOverlayX()` expects a resolved beacon bearing and a current user heading. It should remain responsible only for overlay mapping.
- `BeaconOverlay` should remain a rendering component and should not grow complex geospatial policy.
- GPS fixes can be materially different even when the user is stationary, especially when `watchPosition` refreshes during later placement attempts.
- Browser sensor tests cannot fully prove outdoor GPS behavior; manual device validation remains necessary as a supplement.

## Assumption Ledger

| Assumption | Confidence | Verification Method | Blocks Implementation? |
| --- | --- | --- | --- |
| Same-location multi-placement jumps are primarily caused by accepted GPS-origin changes rather than heading smoothing alone. | High | Compare `BeaconOverlay` live-bearing render path with manual reproduction and unit geometry cases. | No |
| Existing modern beacon records include enough placement metadata to reconstruct the original placement origin. | High | Inspect `BeaconRecord`, `BeaconDraft`, `buildDraft()`, `createBeacon()`, and persistence normalization. | No |
| A 45 to 80 meter local-origin lock range is a reasonable first product heuristic for 100 meter placements. | Medium | Unit-test the formula and validate outdoors on iOS Safari and Android Chrome. | No |
| Legacy records without valid `placementHeading` are possible and must continue using live bearing. | High | `BeaconRecord.placementHeading` is optional and persisted data can be malformed. | No |
| No new runtime dependency is needed for distance, bearing, or projection math. | High | Existing geospatial helpers already implement bearing and destination projection. | No |
| Manual hardware validation remains necessary for real GPS/compass behavior. | High | Browser sensor APIs and outdoor GPS cannot be fully reproduced by unit tests. | No |

## 8. Root Cause And Design Diagnosis

Established facts:

- `BeaconOverlay` uses the latest live GPS fix as the render origin for every saved beacon.
- `SkyBeaconApp` persists placement metadata that is sufficient to reconstruct the original placement origin for modern records.
- `useGeolocation` already filters small jitter, but it can still accept larger movement or materially more precise fixes.
- At a 100-meter target distance, lateral origin changes of 20 to 35 meters produce large bearing changes.

Inference:

- The multi-placement jump occurs because starting or confirming later placements wakes or refreshes GPS. When the app accepts a new live fix, old beacons are reprojected from that new origin. Since the target is close, the bearing changes enough to visibly move the pillar.

Why the previous GPS stabilization is insufficient:

- Stabilization filters small updates near the current fix, but it cannot reliably distinguish real user movement from a newly accepted GPS origin that is still within normal outdoor phone error.
- Even if GPS stabilization thresholds are increased, the overlay still has no per-beacon memory of the visual heading used at placement time.

Geometry sanity check:

For a beacon placed 100 meters north of an origin near Amsterdam:

| Current GPS origin shift | Live bearing to saved beacon | Bearing delta from placement heading | Approx overlay shift with 60-degree FOV |
| --- | ---: | ---: | ---: |
| 20 meters west | 11.31 degrees | 11.31 degrees | 18.8 percent of screen width |
| 35 meters west | 19.29 degrees | 19.29 degrees | 32.1 percent of screen width |
| 20 meters east | 348.69 degrees | -11.31 degrees | -18.8 percent of screen width |
| 35 meters east | 340.71 degrees | -19.29 degrees | -32.1 percent of screen width |

That scale matches the reported "jump around substantially" behavior.

## 9. Requirements

### Functional Requirements

- Saved beacons with valid placement metadata must render at their stored `placementHeading` while the current location remains near the reconstructed placement origin.
- Saved beacons must fall back to live GPS-to-beacon bearing after the current location moves beyond the local-origin lock radius.
- Saved beacons without valid placement metadata must use the existing live `bearingBetween(currentLocation, beacon)` behavior.
- The preview beacon must remain centered at `xPercent={50}`.
- Off-screen indicator behavior must remain driven by `mapBearingToOverlayX()` after the render bearing is resolved.
- Selecting a beacon, opening the drawer, renaming, recoloring, deleting, replacing, and clearing beacons must remain unaffected.

### Non-Functional Requirements

- Geospatial policy must be implemented in pure TypeScript helpers.
- Unit tests must cover helper behavior without camera, GPS, compass, localStorage, or DOM dependencies.
- The fix must not introduce a new package dependency.
- The fix must preserve TypeScript strictness, lint cleanliness, and production build success.
- The helper must behave deterministically for the same beacon and location inputs.

### Compatibility Requirements

- Legacy records with missing `placementHeading` must continue to render using live GPS bearing.
- Records with invalid `placementHeading`, non-positive `placementDistanceMeters`, non-finite coordinates, or missing location data must use live GPS bearing.
- Existing localStorage schema must remain readable.
- `distanceBetweenLocationFixes()` should remain exported from `lib/sensors/use-geolocation.ts` or otherwise keep existing tests and imports compatible.

## 10. Proposed Solution

Add a pure render-bearing module and route saved beacon rendering through it.

### New Helper Module

Create `lib/geospatial/beacon-render-bearing.ts`.

Recommended exports:

```ts
export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export function reconstructBeaconPlacementOrigin(beacon: BeaconRecord): GeoCoordinate | null;

export function resolveBeaconOriginLockRadiusMeters(
  beacon: BeaconRecord,
  location: Pick<LocationFix, "accuracy">,
): number;

export function resolveBeaconRenderBearing(beacon: BeaconRecord, location: LocationFix): number;
```

If importing `BeaconRecord` or `LocationFix` creates awkward coupling, define the helper against structural `Pick<>` types:

```ts
type RenderBeacon = Pick<
  BeaconRecord,
  "latitude" | "longitude" | "placementHeading" | "placementDistanceMeters" | "locationAccuracyMeters"
>;

type RenderLocation = Pick<LocationFix, "latitude" | "longitude" | "accuracy">;
```

### Placement Origin Reconstruction

For valid placement metadata:

```ts
const origin = destinationPoint(
  beacon.latitude,
  beacon.longitude,
  normalizeHeading(beacon.placementHeading + 180),
  beacon.placementDistanceMeters,
);
```

Validity rules:

- `beacon.latitude` and `beacon.longitude` must be finite valid coordinates.
- `beacon.placementHeading` must be finite.
- `beacon.placementDistanceMeters` must be finite and greater than 0.
- A heading outside `[0, 360)` should be normalized for calculation, but persisted records should still be validated elsewhere.

If any rule fails, return `null` from reconstruction and use live GPS bearing.

### Local-Origin Lock Radius

Use a deterministic radius that absorbs normal GPS origin shifts but releases after material movement.

Recommended constants:

```ts
const ORIGIN_LOCK_BASE_RATIO = 0.45;
const ORIGIN_LOCK_CAP_RATIO = 0.8;
const ORIGIN_LOCK_MIN_METERS = 45;
const ORIGIN_LOCK_MIN_CAP_METERS = 80;
const ORIGIN_LOCK_ACCURACY_BUFFER_METERS = 8;
```

Recommended formula:

```ts
const placementDistance = Math.max(0, beacon.placementDistanceMeters);
const baseRadius = Math.max(ORIGIN_LOCK_MIN_METERS, placementDistance * ORIGIN_LOCK_BASE_RATIO);
const capRadius = Math.max(ORIGIN_LOCK_MIN_CAP_METERS, placementDistance * ORIGIN_LOCK_CAP_RATIO);
const currentAccuracy = positiveFinite(location.accuracy) ? location.accuracy : 0;
const placementAccuracy = positiveFinite(beacon.locationAccuracyMeters) ? beacon.locationAccuracyMeters : 0;
const accuracyRadius = currentAccuracy + placementAccuracy + ORIGIN_LOCK_ACCURACY_BUFFER_METERS;

return Math.min(capRadius, Math.max(baseRadius, accuracyRadius));
```

For the current 100-meter placement distance:

- Minimum lock radius is 45 meters.
- Accuracy-based radius can expand the lock for noisy GPS.
- Maximum lock radius is 80 meters.
- A 20 to 35 meter same-spot GPS origin shift remains locked.
- A roughly 85 meter move with normal accuracy unlocks and falls back to live bearing.

This threshold is intentionally local to rendering. It should not change GPS stabilization thresholds or sensor acquisition behavior.

### Render Bearing Resolution

Recommended algorithm:

```ts
export function resolveBeaconRenderBearing(beacon: RenderBeacon, location: RenderLocation): number {
  const fallback = bearingBetween(
    location.latitude,
    location.longitude,
    beacon.latitude,
    beacon.longitude,
  );

  const placementOrigin = reconstructBeaconPlacementOrigin(beacon);
  if (!placementOrigin) {
    return fallback;
  }

  const distanceFromPlacementOrigin = distanceBetweenCoordinates(location, placementOrigin);
  const lockRadius = resolveBeaconOriginLockRadiusMeters(beacon, location);

  if (distanceFromPlacementOrigin <= lockRadius) {
    return normalizeHeading(beacon.placementHeading);
  }

  return fallback;
}
```

### Distance Helper Extraction

Create `lib/geospatial/distance.ts`.

Recommended exports:

```ts
export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export function distanceBetweenCoordinates(from: GeoCoordinate, to: GeoCoordinate): number;
```

Then preserve existing geolocation API compatibility:

```ts
// lib/sensors/use-geolocation.ts
export function distanceBetweenLocationFixes(from: LocationFix, to: LocationFix): number {
  return distanceBetweenCoordinates(from, to);
}
```

This keeps `tests/unit/geolocation.test.ts` stable while allowing render-bearing logic to use distance math without importing a React hook module.

### Overlay Wiring

Update `components/beacons/BeaconOverlay.tsx`:

- Remove direct `bearingBetween` import.
- Import `resolveBeaconRenderBearing`.
- Replace the inline bearing calculation with `resolveBeaconRenderBearing(beacon, location)`.
- Keep `mapBearingToOverlayX(bearing, heading)` unchanged.
- Keep preview rendering unchanged.

Expected local diff shape:

```ts
const bearing = resolveBeaconRenderBearing(beacon, location);
const overlay = mapBearingToOverlayX(bearing, heading);
```

## 11. Stage 0: Research And Route Options

### Path A: Pure Render-Bearing Helper With Reconstructed Origin

Summary:

- Add pure geospatial helpers that use existing placement metadata to lock rendering near each beacon's original placement origin.

Changes:

- Add `lib/geospatial/distance.ts`.
- Add `lib/geospatial/beacon-render-bearing.ts`.
- Update `lib/sensors/use-geolocation.ts` to reuse extracted distance math while preserving exported behavior.
- Update `components/beacons/BeaconOverlay.tsx` to call `resolveBeaconRenderBearing()`.
- Add focused unit tests.

Benefits:

- Uses existing saved data.
- No persistence migration.
- Small UI integration surface.
- Strong unit-testability.
- Directly targets the bug mechanism.
- Allows future live navigation after material movement.

Risks:

- The lock radius is a product heuristic and may require tuning after real-world testing.
- Users who physically move less than the lock radius will still see the original placement heading rather than the live bearing.

Validation:

- Unit tests can prove nearby GPS origin shifts keep stored heading and far movement falls back to live bearing.
- Manual outdoor testing can validate threshold feel.

### Path B: Persist Explicit Placement Origin Coordinates For New Records

Summary:

- Store `placementOriginLatitude` and `placementOriginLongitude` on each new beacon, then use those coordinates directly for local-origin locking.

Changes:

- Extend `BeaconDraft` and `BeaconRecord`.
- Update `buildDraft()`, persistence normalization, and validation.
- Use explicit origin fields when present.
- Fall back to reconstructed origin for old records or skip lock for old records.

Benefits:

- Avoids reconstructing origin from destination, heading, and distance.
- More transparent persisted model for future features.
- Could support richer diagnostics or future map views.

Risks:

- Broader data-model change.
- More tests and compatibility rules.
- Existing records still need either reconstruction or fallback.
- Does not improve the current bug more than Path A for modern records, because current records already contain enough metadata.

Validation:

- Requires persistence tests in addition to render-bearing tests.
- Requires migration/legacy compatibility coverage.

### Path C: Freeze Global Render Location During Placement Sessions

Summary:

- When a placement preview starts, keep saved beacons rendering from the previous accepted GPS fix until the placement flow ends.

Changes:

- Add a separate render-location state in `SkyBeaconApp`.
- Avoid updating saved-beacon render origin during preview or save.
- Resume live location after placement ends.

Benefits:

- May reduce visible jumps during the exact placement flow.
- No per-beacon geospatial reconstruction.

Risks:

- Does not solve jumps that happen after the flow accepts a new fix and returns to normal mode.
- Couples a rendering bug to app-level placement state.
- Does not use persisted placement metadata.
- Can make movement behavior confusing during long placement sessions.

Validation:

- Requires app-state tests or E2E tests, and still may miss outdoor GPS behavior.

### Path D: Increase GPS Stabilization Thresholds

Summary:

- Make `stabilizeLocationFix()` ignore larger movements globally.

Changes:

- Tune `LOCATION_STABILITY_MIN_MOVEMENT_METERS`, `LOCATION_STABILITY_MAX_ACCURACY_METERS`, or `nextIsMateriallyMorePrecise` behavior.

Benefits:

- Very small code change.
- May reduce some same-spot jumps.

Risks:

- Global change to GPS behavior, not scoped to saved-beacon rendering.
- Can make real walking movement lag or fail to update.
- Still does not encode the placement-heading visual invariant.
- Hard to tune without degrading navigation.

Validation:

- Existing geolocation tests would need updates, but those tests would not prove visual beacon stability.

### Path E: AR-Style Visual Anchoring

Summary:

- Anchor beacons in camera or world space using device motion, visual tracking, or a more complete AR model.

Changes:

- Major architecture change.
- Likely new dependencies and platform-specific APIs.

Benefits:

- More physically realistic long-term direction and parallax behavior.

Risks:

- Far beyond current MVP.
- High browser compatibility risk.
- Not necessary to fix the reported multi-placement jump.

Validation:

- Requires device-heavy manual and automated strategy beyond current test harness.

### Decision Matrix

| Criterion | Path A: Render Helper | Path B: Persist Origin | Path C: Freeze Session | Path D: GPS Thresholds | Path E: AR Anchoring |
| --- | --- | --- | --- | --- | --- |
| Fixes same-spot multi-placement jump | High | High | Medium | Medium | High |
| Preserves live movement after material relocation | High | High | Medium | Low | High |
| Uses existing metadata | High | Medium | Low | Low | Low |
| Scope control | High | Medium | Medium | High | Low |
| Regression risk | Low | Medium | Medium | Medium | High |
| Testability | High | High | Medium | Medium | Low |
| Data migration required | No | Possibly | No | No | Unknown |
| Recommended now | Yes | No | No | No | No |

## 12. Recommended Path

Choose Path A: Pure Render-Bearing Helper With Reconstructed Origin.

This is the best fit because the app already stores `placementHeading`, `placementDistanceMeters`, and saved destination coordinates. Those fields are sufficient to recover the local placement origin and decide whether the saved beacon should render as a local visual anchor or as a live navigation target. Path A fixes the specific bug without widening the blast radius into persistence, app state, or sensor acquisition.

Path B can be considered later if future features need explicit placement origin data. It should not block BUG-11.

## 13. Detailed Implementation Plan

### Phase 1: Extract Pure Distance Math

- [ ] Create `lib/geospatial/distance.ts`.
- [ ] Move the haversine formula currently embedded in `lib/sensors/use-geolocation.ts` into `distanceBetweenCoordinates(from, to)`.
- [ ] Keep `EARTH_RADIUS_METERS = 6_371_000` so distance behavior remains equivalent.
- [ ] Update `lib/sensors/use-geolocation.ts` to import `distanceBetweenCoordinates`.
- [ ] Preserve the exported `distanceBetweenLocationFixes(from, to)` wrapper for existing tests and callers.
- [ ] Do not change `stabilizeLocationFix()` behavior in this phase.

### Phase 2: Add Render-Bearing Helper

- [ ] Create `lib/geospatial/beacon-render-bearing.ts`.
- [ ] Import `normalizeHeading`, `bearingBetween`, `destinationPoint`, and `distanceBetweenCoordinates`.
- [ ] Define structural input types that include only the fields required for rendering.
- [ ] Implement a local `positiveFinite(value)` helper.
- [ ] Implement `reconstructBeaconPlacementOrigin(beacon)`.
- [ ] Implement `resolveBeaconOriginLockRadiusMeters(beacon, location)` with the constants from this RFC.
- [ ] Implement `resolveBeaconRenderBearing(beacon, location)`.
- [ ] Ensure invalid or missing placement metadata returns the live `bearingBetween()` fallback.
- [ ] Ensure lock-radius comparison uses meters from `distanceBetweenCoordinates()`.

### Phase 3: Wire Saved-Beacon Rendering

- [ ] Update `components/beacons/BeaconOverlay.tsx`.
- [ ] Remove the direct `bearingBetween` import.
- [ ] Import `resolveBeaconRenderBearing` from `@/lib/geospatial/beacon-render-bearing`.
- [ ] Replace the inline bearing calculation inside `beacons.map()` with `resolveBeaconRenderBearing(beacon, location)`.
- [ ] Leave preview rendering centered at `xPercent={50}`.
- [ ] Leave off-screen indicator rendering unchanged.
- [ ] Leave `pitchBottomPercent()` unchanged.

### Phase 4: Add Regression Tests

- [ ] Add `tests/unit/beacon-render-bearing.test.ts`.
- [ ] Test that a beacon placed 100 meters north renders at heading `0` when current GPS is shifted 20 meters east.
- [ ] Test that the same beacon renders at heading `0` when current GPS is shifted 35 meters west.
- [ ] Test that the helper falls back to live bearing after movement beyond the lock radius, for example 85 to 100 meters laterally with normal accuracy.
- [ ] Test that a missing `placementHeading` falls back to live bearing.
- [ ] Test that invalid `placementDistanceMeters <= 0` falls back to live bearing.
- [ ] Test that poor current or placement accuracy can expand the lock radius up to the cap.
- [ ] Keep `tests/unit/geolocation.test.ts` passing after distance extraction.
- [ ] Optionally extend `tests/unit/geospatial.test.ts` only if shared distance behavior belongs there; otherwise keep render-bearing tests separate.

### Phase 5: Validate

- [ ] Run `npm run test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Optionally run `npm run test:e2e` if the implementation touches app state, persistence, or browser-visible behavior beyond the planned overlay import.
- [ ] Manually test on a phone when hardware is available.

## 14. Testing Strategy

### Unit Tests

Create `tests/unit/beacon-render-bearing.test.ts`.

Recommended fixtures:

```ts
const origin = { latitude: 52.3676, longitude: 4.9041 };
const placementHeading = 0;
const placementDistanceMeters = 100;
const beaconPoint = destinationPoint(
  origin.latitude,
  origin.longitude,
  placementHeading,
  placementDistanceMeters,
);
```

Nearby GPS origin shift cases:

- Current location is `destinationPoint(origin.latitude, origin.longitude, 90, 20)`.
- Current location is `destinationPoint(origin.latitude, origin.longitude, 270, 35)`.
- Expected resolved bearing is close to `0`, not the live bearing.

Material movement case:

- Current location is `destinationPoint(origin.latitude, origin.longitude, 90, 90)` with normal accuracy.
- Expected resolved bearing equals `bearingBetween(current.latitude, current.longitude, beacon.latitude, beacon.longitude)`.
- Assert it is not close to the placement heading.

Legacy fallback cases:

- `placementHeading` is `undefined`.
- `placementHeading` is `Number.NaN`.
- `placementDistanceMeters` is `0` or negative.
- Expected resolved bearing equals live `bearingBetween()`.

Radius formula cases:

- With normal accuracy such as current `12` and placement `12`, 100-meter placement distance resolves lock radius to `45`.
- With poor accuracy such as current `35` and placement `35`, 100-meter placement distance resolves lock radius to `78`.
- With extreme accuracy such as current `100` and placement `100`, 100-meter placement distance caps lock radius at `80`.

Distance extraction cases:

- Existing `tests/unit/geolocation.test.ts` should keep proving small jitter is retained as stable coordinates and meaningful movement is accepted.

### Integration Or Component Tests

No component test is strictly required if the overlay integration is a one-line helper call and the helper has unit coverage. If implementation agents add a component test, keep it focused:

- Render `BeaconOverlay` with one saved beacon, fixed heading, and a current location shifted 35 meters from reconstructed origin.
- Assert the beacon pillar remains visible near the expected placement heading mapping.

Do not add fragile visual pixel assertions for this fix unless a stable testing utility already exists.

### E2E Tests

Existing Playwright smoke tests seed saved beacons in localStorage. A new E2E test is optional because mocking browser geolocation and compass across multiple watch updates can become more expensive than the risk warrants.

Add E2E only if future implementation touches `SkyBeaconApp` placement state or persistence. If added:

- Seed one beacon with valid placement metadata.
- Mock geolocation to start at placement origin.
- Mock heading to match the placement heading.
- Refresh geolocation to a 35-meter lateral shift.
- Assert the saved beacon remains visible near center.

### Manual QA

On a phone with camera, GPS, and compass enabled:

1. Open Sky Beacon over HTTPS or an Android trusted insecure local origin.
2. Grant camera, GPS, and orientation permissions.
3. Stand still in an open area.
4. Place beacon 1 while facing a distinct fixed direction.
5. Without intentionally changing position, place beacon 2 while facing another direction.
6. Observe beacon 1 while entering preview and after confirming beacon 2.
7. Place beacon 3 from the same spot.
8. Confirm older beacons remain near their original headings.
9. Walk materially away, beyond roughly 80 to 100 meters if practical.
10. Confirm beacons begin behaving like live GPS navigation targets.

## 15. Rollout, Migration, And Backout

Rollout:

- This can ship as a normal code change without feature flags.
- No server-side rollout is needed.
- No database or localStorage migration is needed.

Migration:

- Existing records with `placementHeading` and `placementDistanceMeters` gain stable rendering automatically.
- Existing records without `placementHeading` continue using live GPS bearing.
- Existing records with missing `placementDistanceMeters` are already normalized to `100` in `beacon-service`, but the render helper must still guard against invalid values.

Backout:

- Revert the `BeaconOverlay` import and helper call to restore direct `bearingBetween()` rendering.
- Leave `lib/geospatial/distance.ts` in place if other code has started using it, or revert it together with the wrapper if the change is otherwise isolated.
- No user data cleanup is required.

## 16. Risks And Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Lock radius feels too sticky while the user walks a short distance | Beacon may stay on placement heading longer than expected | Keep cap at 80 meters for 100-meter placements; manual QA movement case; constants isolated in helper |
| Lock radius too small for poor GPS | Same-spot jumps may persist for noisy devices | Include accuracy envelope and buffer; unit test poor-accuracy expansion |
| Invalid legacy data causes misleading output | Beacon could render at wrong heading | Validate finite heading and positive distance; fallback to live bearing |
| Helper imports sensor hook code | React/client coupling leaks into pure geospatial math | Extract distance helper; use structural types |
| Tests overfit one coordinate | Misses lat/lon edge cases | Use `destinationPoint()` fixtures and assert behavior, not hard-coded coordinates |
| Future agents tune GPS stabilization instead | Could regress walking navigation | RFC marks GPS threshold tuning as non-recommended Path D |

## 17. Observability And Debuggability

No production telemetry is required for this fix.

Optional development-only diagnostics, if future agents need them during manual testing:

- Temporarily log resolved render mode per beacon: `"placement-lock"` or `"live-bearing"`.
- Temporarily log distance from reconstructed origin and lock radius.
- Remove all temporary logs before final validation.

Do not add persistent user-visible debug UI for this bug unless product explicitly asks for it.

## 18. Acceptance Criteria

- [ ] Adding a second or third beacon from the same physical spot does not cause older beacons with placement metadata to jump due only to a nearby refreshed GPS origin.
- [ ] `resolveBeaconRenderBearing()` returns stored `placementHeading` for 20 to 35 meter nearby GPS shifts around a 100-meter placement.
- [ ] `resolveBeaconRenderBearing()` returns live GPS bearing after movement beyond the computed lock radius.
- [ ] Records with missing or invalid placement metadata use live GPS bearing.
- [ ] `BeaconOverlay` delegates saved-beacon bearing resolution to the new helper.
- [ ] Preview beacon rendering remains centered.
- [ ] Existing geolocation stabilization tests pass unchanged or with only import-preserving refactor updates.
- [ ] `npm run test` passes.
- [ ] `npm run lint` passes with zero warnings.
- [ ] `npm run build` passes.

## Approval Gates

- Draft review may refine wording, constants, and test cases without approving implementation.
- Implementation may proceed only after this RFC is marked `Accepted` or the user explicitly grants implementation approval in the active task.
- A reviewer should inspect any lock-radius constant change, persistence/schema change, or app-state change before merge.
- Manual outdoor QA is recommended before treating the bug as fully closed, but it does not need to block local automated implementation validation.

## Approval And Amendment Rules

Approvers are currently unassigned. Until an approver accepts the RFC or the user explicitly authorizes implementation, future agents must treat this document as a proposed plan rather than an execution order.

Agents may make narrowly equivalent implementation choices inside the recommended path, such as structural `Pick<>` input types instead of importing `BeaconRecord` directly. Agents must create an Amendment RFC or return for approval before changing persistence schema, adding dependencies, changing sensor acquisition UX, changing placement distance, removing live-bearing fallback, or broadening the fix beyond saved-beacon render-bearing resolution.

## 19. Agent Execution Contract

Preconditions:

- Work from repo root `C:\Skymark`.
- Read this RFC and `specs/BUG-11-beacon-multiple-placement-jump.md` before editing.
- Do not implement unrelated refactors.

Files expected to change:

- `lib/geospatial/distance.ts`
- `lib/geospatial/beacon-render-bearing.ts`
- `lib/sensors/use-geolocation.ts`
- `components/beacons/BeaconOverlay.tsx`
- `tests/unit/beacon-render-bearing.test.ts`
- Possibly `tests/unit/geolocation.test.ts` only if import paths or helper ownership require it.

Files that should usually remain unchanged:

- `components/SkyBeaconApp.tsx`
- `lib/beacons/beacon-types.ts`
- `lib/beacons/beacon-service.ts`
- `lib/beacons/validation.ts`
- `lib/geospatial/overlay-position.ts`
- Visual components such as `BeaconPillar` and `OffscreenIndicator`
- Package manifests and lockfiles

Forbidden changes for the recommended path:

- Do not change `DEFAULT_PLACEMENT_DISTANCE_METERS`.
- Do not add dependencies.
- Do not migrate localStorage schema.
- Do not change sensor permission UX.
- Do not change preview centering.
- Do not remove live-bearing fallback.

Implementation order:

1. Add distance helper and preserve geolocation wrapper.
2. Add render-bearing helper.
3. Add unit tests for helper behavior.
4. Wire overlay through helper.
5. Run validation commands.

Validation commands:

```powershell
npm run test
npm run lint
npm run build
```

Expected command results:

- Unit tests pass with new render-bearing coverage.
- ESLint exits successfully with zero warnings.
- Next production build completes.

Handoff notes:

- If tests show the recommended 45 to 80 meter lock range is wrong, adjust only the constants and update the tests to document the new product heuristic.
- If TypeScript complains about importing `LocationFix` into a pure helper, switch to structural `Pick<>` types instead of importing the hook type.
- If a future agent chooses Path B, it must update this RFC or create a follow-up RFC because that path changes persistence scope.

## ADR Follow-Up

- If accepted and implemented, create an ADR capturing the decision that saved beacons use placement-heading render lock near their reconstructed placement origin and live GPS bearing after material relocation.
- No ADR is needed if the RFC is rejected or superseded before implementation.

## 20. Open Questions

- Should the lock radius be tuned after outdoor testing on both iOS Safari and Android Chrome? This does not block the first implementation because the constants are isolated and testable.
- Should future records persist explicit placement origin coordinates? This is a possible follow-up and does not block BUG-11.
- Should the app eventually expose a recalibrate or replace-anchor action for stale beacons? This is product scope outside the current bug.

## 21. Appendix

### A. Why Placement Heading Is A Reasonable Local Lock

During placement, the user sees the preview beacon centered and confirms while facing a particular direction. For a saved beacon near the same physical origin, the user's mental model is "that beacon is in the direction I placed it." The stored `placementHeading` captures that local visual intent.

When the user remains near the placement origin, a new GPS fix should not overwrite that intent. When the user moves away, parallax and navigation matter more, so live bearing becomes appropriate again.

### B. Formula Details

Reconstruct origin:

```ts
origin = destinationPoint(
  beacon.latitude,
  beacon.longitude,
  normalizeHeading(beacon.placementHeading + 180),
  beacon.placementDistanceMeters,
);
```

Resolve lock:

```ts
distanceFromOrigin = distanceBetweenCoordinates(currentLocation, origin);
lockRadius = resolveBeaconOriginLockRadiusMeters(beacon, currentLocation);
usePlacementHeading = distanceFromOrigin <= lockRadius;
```

Resolve bearing:

```ts
if (usePlacementHeading) {
  return normalizeHeading(beacon.placementHeading);
}

return bearingBetween(
  currentLocation.latitude,
  currentLocation.longitude,
  beacon.latitude,
  beacon.longitude,
);
```

### C. Overlay Shift Calculation

`mapBearingToOverlayX()` maps visible angular difference to screen x:

```ts
xPercent = 50 + (differenceDegrees / halfFov) * 50
```

With default `horizontalFovDegrees = 60`, `halfFov = 30`.

Therefore:

- 11.31 degree bearing delta maps to `11.31 / 30 * 50 = 18.85` percent of screen width.
- 19.29 degree bearing delta maps to `19.29 / 30 * 50 = 32.15` percent of screen width.

This explains why ordinary nearby GPS movement can look like a large horizontal jump.

### D. Relationship To BUG-04

`specs/BUG-04-beacon-anchor-drift.md` addressed two earlier causes of instability:

- Heading derivation could change when the phone tilted.
- Small GPS jitter could update the render origin.

BUG-11 is narrower and remains after those improvements because the rendering model still uses the latest accepted GPS fix as the origin for every saved beacon. The recommended BUG-11 fix adds per-beacon local anchoring on top of the existing sensor stabilization.
