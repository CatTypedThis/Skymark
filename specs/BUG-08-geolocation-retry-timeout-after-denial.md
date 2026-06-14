# Bug: Geolocation Retry Times Out After Permission Denial

## Bug Description
After GPS permission is denied, tapping preview or requesting GPS again changes the compact sensor status from `GPS blocked` to `Acquiring GPS`, then eventually to `GPS timeout`, even though no new geolocation watch is started.

Expected behavior: after a permission-denied geolocation error, the app should either remain in the blocked state with the permission guidance visible, or start a real new request if the browser allows retrying. It should not show an acquisition timeout caused by stale internal watch state.

Actual behavior: the first denied request sets status to `blocked`, but leaves `watchIdRef.current` populated. A later retry sets status to `requesting` and creates a timeout. Because `watchIdRef.current` is still non-null, the hook returns before calling `navigator.geolocation.watchPosition()` again. No fix or error can arrive, so the timeout fires and overwrites the blocked state with `GPS timeout`.

## Problem Statement
The geolocation hook does not clear its stored watch ID when `watchPosition` reports an error. This makes follow-up GPS requests enter a requesting state without creating a new browser geolocation watch. The UI then reports a timeout instead of the original permission-denied state, which misleads users and makes retry behavior unreliable.

## Solution Statement
Clear the geolocation watch reference whenever the watch error callback runs, and verify retry state transitions with focused unit coverage. The future implementation should keep the current timeout behavior for genuine no-fix acquisition attempts, but ensure denied or unavailable watches do not leave stale watch IDs behind.

## Steps to Reproduce
- Open the app at `http://127.0.0.1:3001/` or `http://localhost:3001/`.
- Complete onboarding if needed.
- Click `Request GPS and compass`.
- Deny geolocation permission in the browser, or run in a test environment where geolocation is denied.
- Observe the status bar shows `GPS blocked` and the warning text says `User denied Geolocation`.
- Click `Preview beacon placement`.
- Observe the status bar changes to `Acquiring GPS`.
- Wait for the acquisition timeout.
- Observe the status bar changes to `GPS timeout` and the warning says `GPS acquisition timed out. Please ensure location services are enabled and try again.`

## Root Cause Analysis
`lib/sensors/use-geolocation.ts` stores the active watch ID in `watchIdRef.current` after calling `navigator.geolocation.watchPosition()`.

The hook clears the timeout in the watch error callback, then sets status to `blocked` for `PERMISSION_DENIED` or `unavailable` for other errors. It does not call `navigator.geolocation.clearWatch()` and does not set `watchIdRef.current = null`.

On a later call to `requestLocation()`, the hook:

- Sets status to `requesting`.
- Clears any previous timeout and starts a new acquisition timeout.
- Checks `if (watchIdRef.current !== null)`.
- Returns early because the stale watch ID is still present.

Because no new `watchPosition()` call is made, the retry cannot produce a new success or error. When the timer fires, `shouldLocationRequestTimeout()` sees no fresh fix and changes the state to `timeout`.

This is related to the broader GPS acquisition UX covered in `specs/BUG-03-chrome-gps-acquisition.md`, but it is a narrower stale-watch cleanup bug with a separate regression path.

## Relevant Files
Likely files for a future implementation pass:

- `lib/sensors/use-geolocation.ts` - Owns `watchIdRef`, geolocation error handling, retry behavior, and acquisition timeout state.
- `tests/unit/geolocation.test.ts` - Existing pure geolocation tests; can add coverage for stale watch cleanup helpers if the implementation extracts them.
- `tests/e2e/sky-beacon.smoke.spec.ts` - Existing browser smoke tests; can add a denied-then-retry flow that proves the UI does not degrade from blocked to false timeout.
- `components/SkyBeaconApp.tsx` - Calls `location.requestLocation()` from both sensor tools and preview, so it is the user-visible retry path.
- `components/hud/SensorStatusBar.tsx` - Displays `GPS blocked`, `Acquiring GPS`, and `GPS timeout`, making the regression visible.

## Step by Step Tasks
IMPORTANT: These are instructions for a future implementation pass. Do not execute them while using this skill.

### 1. Add a focused failing regression test
- Add coverage for a denied geolocation watch followed by a retry.
- Prefer a hook-level or small extracted-helper test if the project has suitable React hook test support.
- If hook-level testing would require new dependencies, add a Playwright smoke test that mocks `navigator.geolocation.watchPosition` to call the error callback with `PERMISSION_DENIED`, clicks `Request GPS and compass`, then clicks `Preview beacon placement`.
- Assert the UI remains in a blocked/permission-needed state and does not transition to `GPS timeout` unless a real new watch is started and times out.

### 2. Clear stale geolocation watches on errors
- In the `watchPosition` error callback in `lib/sensors/use-geolocation.ts`, clear the active browser watch when possible.
- Set `watchIdRef.current = null` after an error so a later retry can call `watchPosition()` again.
- Keep the existing timeout cleanup in the error callback.
- Preserve iOS-specific permission-denied guidance.

### 3. Preserve genuine acquisition timeout behavior
- Confirm that a request with no success and no error still reaches `timeout` after `LOCATION_ACQUISITION_TIMEOUT_MS`.
- Confirm that a fresh fix before the timeout still reaches `ready` and clears the timer.
- Confirm that repeated retries do not leave multiple active watches or timers.

### 4. Review preview retry messaging
- Check whether `startPreview()` should avoid starting another GPS request when location is already `blocked`.
- If the chosen behavior is to allow retries, ensure the retry starts a real watch and displays permission guidance when the browser denies again.
- If the chosen behavior is to keep blocked state until the user changes browser permissions, keep the UI message stable and do not start a timeout.

### 5. Run Validation Commands
- Execute every command in the Validation Commands section.
- Manually repeat the denied GPS flow in the browser and verify the status no longer degrades into a false timeout.

## Validation Commands
Commands a future implementation pass should execute to validate the bug is fixed with zero regressions.

- `npm run lint` - Run ESLint.
- `npm run test` - Run unit tests, including the new geolocation retry regression.
- `npm run build` - Verify the production build.
- `npm run test:e2e` - Run browser smoke tests.
- Manual browser validation - Deny geolocation, retry preview, and confirm the UI remains blocked or starts a real new request instead of timing out from stale state.

## Notes
During the demo pass on June 11, 2026, the app otherwise handled denied camera access gracefully, kept the fallback instrument UI usable, and showed no browser console errors. This bug was found by clicking `Request GPS and compass`, observing `GPS blocked`, then clicking `Preview beacon placement` and watching the state degrade to `GPS timeout`.
