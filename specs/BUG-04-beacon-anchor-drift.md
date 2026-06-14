# Bug: Beacon Anchor Drift

## Bug Description
Saved beacons do not visually stay attached to the direction/location where they were placed. Beacons can move when the camera is tilted or physically moved, and existing beacons can shift substantially after additional beacons are set.

Expected behavior: a saved beacon should keep a stable screen position for the same real-world heading and approximate user position, while still moving responsively when the user intentionally turns.

Actual behavior: the overlay can react to device tilt as if the heading changed, and small GPS watch updates can reproject saved beacon bearings enough to make anchors look detached.

## Problem Statement
The app needs to reduce false beacon movement caused by sensor representation and GPS jitter without changing the saved beacon data model or the bearing-based MVP rendering approach.

## Solution Statement
Use a tilt-compensated heading when browser orientation events expose alpha, beta, and gamma values, and stabilize geolocation fixes by ignoring small updates that fall inside the active accuracy/noise radius. Keep the existing GPS-backed directional overlay model, but feed it steadier camera pose data.

## Steps to Reproduce
1. Open the app on a supported phone and grant camera, GPS, and orientation access.
2. Place a beacon while facing a fixed direction.
3. Tilt the phone up/down without intentionally rotating left/right.
4. Observe the beacon shift horizontally or detach from the expected bearing.
5. Place one or two additional beacons from roughly the same spot.
6. Observe previously saved beacons jump when new GPS fixes arrive during later placements.

## Root Cause Analysis
The orientation hook falls back to `360 - event.alpha` for non-iOS compass readings. Raw alpha is not reliable as a camera heading when the device is pitched or rolled, so tilting the phone can be interpreted as yaw changes.

The geolocation hook stores every `watchPosition` update immediately. For beacons placed only 100 meters away, normal GPS jitter within the reported accuracy circle can materially change the calculated bearing from user to beacon, causing visible overlay movement even when the user has not actually moved enough to justify a reprojected anchor.

## Relevant Files
- `lib/sensors/use-orientation.ts` - Reads browser orientation events and derives the heading used by beacon rendering.
- `lib/sensors/use-geolocation.ts` - Stores GPS fixes used as the origin for saved beacon bearing calculations.
- `tests/unit/geospatial.test.ts` - Existing coverage for bearing and overlay mapping.
- `tests/unit/geolocation.test.ts` - Existing location acquisition tests; add stabilization coverage.

### New Files
- `lib/sensors/orientation-heading.ts` - Pure heading helper for tilt-compensated orientation math and unit tests.
- `tests/unit/orientation-heading.test.ts` - Regression coverage for tilt-compensated heading behavior.

## Step by Step Tasks
### 1. Add Tilt-Compensated Heading Helper
- Extract heading derivation into a pure helper.
- Preserve iOS `webkitCompassHeading` behavior.
- Use alpha/beta/gamma compensation when available before falling back to simple alpha.

### 2. Stabilize GPS Fix Updates
- Add a small pure helper to decide whether a new GPS fix should replace the rendered fix.
- Ignore noisy updates within the larger of a minimum movement threshold and the reported accuracy envelope.
- Continue accepting clearly newer movement so the app updates while the user walks.

### 3. Wire Helpers Into Hooks
- Update `useOrientation` to call the new heading helper.
- Update `useGeolocation` to filter incoming watch updates before setting state.

### 4. Add Regression Tests
- Cover tilt compensation so pitch/roll no longer produce false heading changes for equivalent compass orientation.
- Cover GPS stabilization so minor jitter is ignored and real movement is accepted.

### 5. Run Validation Commands
- Run the validation commands below and fix any failures.

## Validation Commands
- `npm run test` - Run unit tests for geospatial, beacon, orientation, and geolocation behavior.
- `npm run lint` - Run ESLint with zero warnings.
- `npm run build` - Build the Next.js app.

## Notes
The bug skill's numbering script could not be run because `python` is unavailable in this environment and `C:\Users\Kirill\.claude\skills\bug\next_bug.py` does not exist. The next bug number was selected from the existing `specs/BUG-01` through `specs/BUG-03` files.
