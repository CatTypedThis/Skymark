# Bug: Saved Beacons Jump on Compass Heading Jitter (Android Chrome)

## Bug Description
On Android Chrome, saved beacons (and the preview beacon) swing wildly left and right while the phone is held still — sweeping through several cardinal directions in roughly a second (e.g. southwest → north → northeast → settling back) — even though the user has not rotated or moved. Placing additional beacons does not cause the jump; the jump happens continuously during steady aiming.

Expected behavior: while the phone is held approximately still, every beacon's horizontal position should remain approximately stable. Genuine rotation should move beacons predictably relative to camera heading.

Actual behavior: the compass heading reported by `useOrientation` swings by tens to ~180 degrees within a single second of still holding, and `mapBearingToOverlayX(bearing, heading)` reproduces that swing directly on screen for every beacon.

## Problem Statement
The Android heading derivation in `lib/sensors/orientation-heading.ts` and the listener wiring in `lib/sensors/use-orientation.ts` accept `deviceorientation` events whose `absolute` flag is `false` (relative-only readings with no compass meaning) and blend them with `absolute=true` readings (true compass headings). On Android Chrome the `absolute` flag fluctuates between `true` and `false` from event to event, so a single still aim produces a stream that mixes two unrelated coordinate systems. Averaging across that mismatch — even with the existing circular smoother — cannot remove the resulting jumps; it only blurs them.

The current smoothing layer (`smoothHeading`, weight 0.22 per event) has no outlier rejection, and `deviceorientation` on Android fires 30–60 times per second, so even after the absolute/relative mixing is fixed the residual magnetometer jitter on absolute readings will still produce visible motion. BUG-12's render-bearing resolver cannot help here because the moving input is `heading`, not the GPS origin, and the resolver correctly only stabilizes the GPS-origin bearing.

## Solution Statement
Separate acceptance from smoothing. The orientation pipeline must:

1. Prefer the `deviceorientationabsolute` event when the browser fires it (Chrome on Android delivers absolute compass readings there), and otherwise accept a generic `deviceorientation` event **only when `event.absolute === true`**. Discard every `absolute=false` reading. This eliminates the coordinate-system mixing that dominates the observed swings.
2. Reject gross outliers on the cleaned absolute stream: when a new heading differs from the current estimate by more than a deterministic threshold, down-weight it heavily rather than blending it at full smoothing weight. This removes single-frame magnetometer spikes.
3. Smooth the residual magnetometer jitter with a slightly heavier weight than today, and reflect genuine unreliability in the existing `HeadingStability` classifier so the UI can warn when the compass is unusable.

Keep the iOS path (`webkitCompassHeading`) unchanged — it already delivers an absolute compass heading and was not implicated by device QA. Keep all other orientation behavior (pitch extraction, permission flow, simulated fallback) unchanged. Keep BUG-12's render-bearing resolver in place; this fix targets a different input.

This is a bounded stabilization fix. A stateless pipeline with outlier rejection and smoothing cannot recover from a compass that reports a sustained wrong-but-self-consistent direction. The automated contract therefore guarantees the mixing elimination (no relative reading ever reaches the smoother), outlier rejection for a single wild absolute frame, and bounded response for genuine rotation; it cannot guarantee a correct heading when the magnetometer itself is biased.

## Steps to Reproduce
1. Open Sky Beacon on an Android Chrome phone and grant camera, GPS, and motion/compass access.
2. Hold the phone approximately still, aiming at a fixed target.
3. Observe the compass heading in the top status bar sweep through multiple directions within ~1 second.
4. Place a beacon and continue holding still; observe it (and any other saved beacons) swing horizontally with the heading.
5. Open `/?debug=1` and confirm `heading` swings while `lat`/`lon` in the GPS block remain approximately constant — distinguishing this from BUG-12.
6. Open `/sensor-probe` and observe `alpha` jumping while `absolute` flips between `true` and `false`.

## Root Cause Analysis
`components/beacons/BeaconOverlay.tsx` renders each saved beacon's horizontal position with `mapBearingToOverlayX(bearing, heading)` (`lib/geospatial/overlay-position.ts`), where `heading` comes directly from `useOrientation()`. When `heading` swings, every beacon's `xPercent` swings with it. The BUG-12 resolver stabilizes `bearing` against GPS-origin drift but does not touch `heading`, so a GPS-stable, heading-driven jump passes straight through.

`lib/sensors/use-orientation.ts:66` attaches a single listener to the generic `deviceorientation` event with no `absolute` filtering. The handler passes each event to `readHeadingFromOrientation` (`lib/sensors/orientation-heading.ts:50`), which:

- Returns `webkitCompassHeading` for iOS (absolute, correct).
- Otherwise derives a heading from `alpha`/`beta`/`gamma` via tilt-compensation, falling back to `360 - alpha`.
- Only changes an `accuracyLabel` string between `"absolute"` and `"relative"` based on `event.absolute`. It does **not** discard the relative readings. The `accuracyLabel` is never consumed by the smoothing or overlay pipeline, so relative and absolute readings are blended identically.

On Android Chrome, `event.absolute` is not stable: the browser delivers `deviceorientation` events with `absolute=true` when the absolute orientation sensor is available and `absolute=false` when only the relative sensor is. A `relative` `alpha` is measured from an arbitrary zero established at sensor start, not from magnetic north, so it has no compass interpretation. Interleaving the two means the smoother is averaging headings from two unrelated coordinate systems, which is the dominant source of the observed multi-directional swings.

`lib/sensors/smoothing.ts` (`smoothHeading`, default weight 0.22) blends on the unit circle, which correctly handles the 0/360 boundary but provides no outlier rejection: a single 180-degree-off frame moves the output by `0.22 * 180 ≈ 40` degrees. Because `deviceorientation` fires at high rate, a burst of consecutive wild samples walks the estimate to the wrong value and back within a second — matching the reported symptom exactly. The `stability` classifier in `use-orientation.ts:53` only flags `unstable` past an 18-degree single-frame delta, so smaller-but-sustained jitter registers as `stable` and passes through to the overlay.

Existing tests (`tests/unit/orientation-heading.test.ts`) cover the iOS path, the alpha fallback, and tilt-compensation math, but hold `absolute` constant within each case; none interleave `absolute=true` and `absolute=false` events, so the mixing defect is uncaught.

This bug is independent of BUG-12. BUG-12 stabilizes the GPS-origin bearing; this bug stabilizes the compass heading. Both are real and both must ship; neither subsumes the other.

## Relevant Files
Likely files for a future implementation pass:

- `lib/sensors/use-orientation.ts` - Attaches the `deviceorientation` listener and runs the smoothing/stability pipeline; must prefer `deviceorientationabsolute` and discard `absolute=false` readings before smoothing.
- `lib/sensors/orientation-heading.ts` - Derives a heading from raw orientation fields and currently only labels (does not filter) relative readings; should expose an absolute-availability signal and/or refuse relative readings.
- `lib/sensors/smoothing.ts` - Circular smoother with no outlier rejection; should gain or be wrapped by an outlier-rejection step.
- `tests/unit/orientation-heading.test.ts` - Should cover interleaved absolute/relative mixing and rejection.
- `tests/unit/geospatial.test.ts` - Already exercises `smoothHeading` across the 0/360 boundary; extend for outlier behavior.
- `components/beacons/BeaconOverlay.tsx` - Consumer of the heading; no change expected, included to confirm the propagation path.
- `components/SkyBeaconApp.tsx` - Wires `orientation.heading` into the overlay; no change expected.
- `app/sensor-probe/page.tsx` - Throwaway diagnostic used to capture the device evidence for this spec; remove as part of cleanup or keep behind a flag per repo convention.

### New Files

- None required. If the cleaner pipeline earns its own module, `lib/sensors/heading-filter.ts` may host the absolute/relative gate plus outlier rejection as pure functions, with `tests/unit/heading-filter.test.ts` covering them; this is optional and should follow existing `lib/sensors/` conventions.

## Step by Step Tasks
IMPORTANT: These are instructions for a future implementation pass. Do not execute them while using this skill.

### 1. Gate on Absolute Readings

- In `lib/sensors/use-orientation.ts`, attach an additional listener for `deviceorientationabsolute` (Chrome fires this for absolute compass readings) and treat it as the preferred source.
- For the generic `deviceorientation` listener, ignore any event whose `absolute !== true`. Keep the iOS `webkitCompassHeading` path absolute by construction.
- Do not change pitch (`beta`) extraction — pitch does not depend on the absolute flag and the frame resolver still needs it.
- Expose the absolute/relative decision only through the existing `HeadingStability` / `accuracyLabel` fields; do not add new public state to the hook beyond what is needed to express "compass unavailable (only relative readings)".

### 2. Add Outlier Rejection

- Add a deterministic outlier gate around the smoother: if a new absolute heading differs from the current estimate by more than a threshold (suggested starting point 45 degrees), down-weight the sample heavily (e.g. blend at ~5% rather than the normal weight) instead of dropping it entirely — dropping would make genuine fast turns feel laggy.
- Keep the existing circular smoothing math for the non-outlier case; only lower the default weight modestly (suggested 0.22 → ~0.12) so residual magnetometer jitter is dampened without making deliberate rotation feel sluggish.
- Make the threshold and weights named constants so they can be tuned without touching call sites.

### 3. Reflect Unreliability in Stability

- Update the `HeadingStability` classifier so a sustained run of rejected/relative readings reports `unstable` (or a new "unavailable" state if the type allows it without breaking consumers), so the UI's existing calibration prompt can surface that the compass is unusable rather than silently feeding bad heading to the overlay.

### 4. Add Pure Regression Coverage

- Assert that an `absolute=false` `deviceorientation` event never updates the heading output, even when interleaved with `absolute=true` events carrying a different value.
- Assert that a single absolute reading ~180 degrees off the current estimate moves the smoothed output by no more than the down-weighted budget (e.g. ≤ 10 degrees), not the ~40 degrees the current 0.22 weight produces.
- Assert that a sequence of consistent absolute readings still converges to the true heading within a deterministic number of samples, so genuine rotation is not over-dampened.
- Assert the `deviceorientationabsolute` event is preferred when both it and a generic `deviceorientation` event fire.
- Keep the iOS `webkitCompassHeading` path covered and unchanged.
- Keep the existing tilt-compensation and alpha-fallback tests passing.

### 5. Add Hook-Level Coverage

- Drive `useOrientation` with a scripted sequence of orientation events (absolute=true steady, absolute=false intruder, absolute=true outlier, genuine turn) and assert the rendered heading is stable through the intruder and outlier and tracks the genuine turn.

### 6. Perform Manual Device Validation

- On Android Chrome, reopen `/?debug=1`, hold still, and confirm the `heading` readout is now stable (no multi-directional sweeps within a second).
- Place two or three beacons and confirm they no longer swing while the phone is held still.
- Rotate slowly and confirm beacons track the rotation predictably with acceptable lag.
- Reopen `/sensor-probe` and confirm the fix does not change the raw `alpha`/`absolute` stream (the fix is in the pipeline, not the sensor).
- On iOS Safari, confirm the `webkitCompassHeading` path is unaffected.

### 7. Run Validation Commands

- Run every command below and resolve any failure before considering the bug fixed.

## Validation Commands
Commands a future implementation pass should execute to validate the bug is fixed with zero regressions.

- `npm run test -- tests/unit/orientation-heading.test.ts tests/unit/geospatial.test.ts` - Focused regression for the heading pipeline and shared smoothing.
- `npm run test` - Run the complete unit and component test suite.
- `npm run lint` - Run ESLint with zero warnings.
- `npm run build` - Build the production Next.js application.
- `npm run test:e2e` - Run the browser smoke suite.
- Manual Android Chrome test - Hold still and confirm beacons no longer sweep; rotate and confirm tracking; verify iOS is unaffected.

## Notes
The device evidence for this bug was captured via the throwaway `/sensor-probe` page during phone QA of BUG-12. BUG-12's fix remains correct and committed (`fix: lock saved camera beacons to placement heading (BUG-12)`); the "almost no visible improvement" report during BUG-12 QA was real and is explained by this bug being the dominant on-device failure mode, not by BUG-12 being wrong.

The 45-degree outlier threshold and 0.12 smoothing weight are starting points derived from the observed jitter magnitude, not measured optima. If device QA shows residual jitter, tune the constants before adding temporal smoothing; if it shows excessive turn lag, raise the smoothing weight before relaxing the outlier gate.

This plan is limited to the orientation/compass pipeline. It does not revisit GPS stabilization (BUG-04, BUG-12), the render-bearing resolver (BUG-12), or the iOS `webkitCompassHeading` path, all of which remain as-is.
