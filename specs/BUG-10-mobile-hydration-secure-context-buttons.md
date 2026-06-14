# Bug: Mobile Hydration Breaks Buttons On Insecure LAN

## Bug Description
On Android Chrome, opening Sky Beacon from the LAN HTTP URL loads the UI, but buttons do not respond. The same app works locally on the laptop. Recent phone/server evidence shows React hydration mismatch errors while rendering the camera permission panel on an insecure LAN origin.

Expected behavior: plain LAN HTTP should load an interactive app shell. Sensor features should be blocked with HTTPS guidance, but non-sensor controls such as the drawer, beacon management, and general HUD interactions should remain clickable. The camera panel should show secure-context guidance without causing hydration errors.

Actual behavior: Android Chrome paints the app UI, but taps appear to do nothing. The dev log shows repeated `Hydration failed because the server rendered HTML didn't match the client` errors at `components/camera/CameraView.tsx`, specifically where client-only secure-context text is added to markup that the server could not render.

## Problem Statement
The app reads browser-only platform/security state during render and uses it to conditionally render different markup before hydration is complete. On LAN HTTP, the server renders a generic camera prompt while the first client render adds HTTPS-required copy and hides/replaces controls. React detects the mismatch, regenerates the tree, and mobile users experience a painted but unreliable/inert interface.

## Solution Statement
Make secure-context detection hydration-safe. The initial server render and the first client render must produce the same markup. Browser-only platform values should be resolved after mount or inside event handlers, then update UI state normally. Add regression coverage that fails on hydration mismatch console errors and verifies that non-sensor buttons remain interactive on insecure Android LAN HTTP while camera/GPS/compass correctly report HTTPS-required states.

## Steps to Reproduce
- Start the app on port 3001 and open the LAN HTTP URL from Android Chrome, currently `http://192.168.0.128:3001/`.
- Observe that the app shell paints and shows HTTPS/sensor warnings.
- Try tapping app controls such as `Open beacon drawer`, `Preview beacon placement`, `Request GPS and compass`, or camera actions.
- Observe that taps appear unresponsive on the phone even though laptop-local usage works.
- Check `dev-server-3001.err.log`.
- Observe repeated React hydration mismatch errors pointing to `CameraView`:
  - `Hydration failed because the server rendered HTML didn't match the client`
  - The diff adds `{" Camera access requires HTTPS."}` inside the camera panel paragraph.

## Root Cause Analysis
`detectPlatform()` returns a server-safe default when `window` is unavailable:

- `requiresHTTPSForSensors: false`
- `isInsecureContext: false`

Hooks such as `useCameraStream()`, `useGeolocation()`, and `useOrientation()` call `detectPlatform()` during render. On the server, this produces non-HTTPS-required markup. On Android Chrome over LAN HTTP, the first client render can immediately see `window.location`, `window.isSecureContext === false`, and `navigator.userAgent`, so it produces HTTPS-required markup.

`CameraView` then renders different DOM during hydration:

- Server markup: generic camera prompt, `Start camera` may be present.
- Client markup: extra `Camera access requires HTTPS` text, `Start camera` hidden, HTTPS error copy present.

React reports the mismatch and regenerates the subtree. In development, especially on a phone over LAN with dev resources and insecure-origin sensor blocks also in play, this can leave the user with a visible UI that feels inert.

The screenshot and logs also confirm a separate but expected condition: plain `http://192.168.x.x:3001` is not a secure context for camera, GPS, or compass APIs. That should remain blocked. The bug is not that HTTP cannot open the camera; the bug is that the secure-context state is introduced in a hydration-unsafe way and appears to break all mobile button interactions.

There may also be lingering dev-origin noise. The current server is still owned by a direct `next dev -p 3001` parent process, and recent logs include blocked-origin warnings for `192.168.0.128`. However, the new hydration mismatch evidence is independent and must be fixed even when LAN origins are allowed.

## Relevant Files
Likely files for a future implementation pass:

- `lib/utils/platform.ts` - Owns browser/platform/secure-context detection and should expose a hydration-safe usage path.
- `lib/sensors/use-camera-stream.ts` - Calls platform detection during render and exposes `requiresHTTPS` to `CameraView`.
- `lib/sensors/use-geolocation.ts` - Calls platform detection during render and exposes `requiresHTTPS`.
- `lib/sensors/use-orientation.ts` - Calls platform detection during render and exposes `requiresHTTPS`.
- `components/camera/CameraView.tsx` - Conditionally renders HTTPS copy and the `Start camera` button based on `requiresHTTPS`, causing the logged mismatch.
- `components/SkyBeaconApp.tsx` - Calls `getHTTPSRequiredMessage()` in an effect and coordinates global sensor warnings.
- `components/hud/BottomActionBar.tsx` - Needs e2e coverage proving non-sensor buttons still fire on insecure HTTP.
- `components/beacons/BeaconDrawer.tsx` - Needs e2e coverage proving drawer controls remain interactive on insecure HTTP.
- `tests/e2e/sky-beacon.smoke.spec.ts` - Existing smoke tests cover camera and drawer flows, but should also fail on hydration errors and validate insecure mobile interaction.
- `tests/unit/platform-secure-context.test.ts` - Existing secure-context coverage; can be extended for hydration-safe defaults if platform logic is extracted.
- `tests/unit/camera-secure-context.test.ts` - Existing camera preflight tests; can be extended to ensure HTTPS checks happen in handlers/effects without changing initial markup.
- `specs/BUG-09-lan-http-still-shows-https-required.md` - Related context: LAN HTTP should require HTTPS for sensors.
- `specs/BUG-06-stale-lan-dev-server-origin-block.md` - Related context: stale dev-origin blocking can also make phone UI inert.

### New Files

- Optional: `lib/utils/use-platform.ts` - A client hook that initializes to a hydration-stable default, then resolves real platform/security state after mount.
- Optional: `tests/unit/hydration-platform.test.tsx` - Component/hook tests if the repo adds a lightweight React render test setup; otherwise prefer Playwright console assertions.

## Step by Step Tasks
IMPORTANT: These are instructions for a future implementation pass. Do not execute them while using this skill.

### 1. Add a failing hydration regression test
- Extend Playwright smoke coverage for an insecure Android-like context.
- Use `page.addInitScript()` to force `window.isSecureContext = false` and hide `navigator.mediaDevices` before app code runs.
- Capture browser console errors during page load.
- Fail if any message includes `Hydration failed` or `server rendered HTML didn't match the client`.
- Assert the page still renders the app shell.

### 2. Add insecure-context interactivity coverage
- In the same e2e scenario, click `Open beacon drawer` and assert the drawer opens.
- Click `Preview beacon placement` and assert the app shows HTTPS/sensor guidance or preview state changes, not a no-op.
- Click `Request GPS and compass` and assert GPS/compass HTTPS guidance is visible.
- Confirm `Camera unsupported` is not the primary camera explanation on insecure LAN HTTP.
- Confirm `Start camera` is hidden or disabled only after hydration has completed cleanly.

### 3. Make platform state hydration-safe
- Avoid calling `detectPlatform()` in render when its result changes DOM before hydration.
- Add a hydration-stable platform hook or state model:
  - Initial value matches the server default.
  - A `ready` or `hydrated` flag starts false.
  - `useEffect()` updates to the real browser platform after mount.
- Use this hook in camera, GPS, compass, and top-level HTTPS-warning flows.
- Keep direct `detectPlatform()` calls inside user event handlers acceptable when needed, because they run after hydration.

### 4. Fix camera panel rendering
- Ensure `CameraView` renders the same markup on the server and first client render.
- After mount/platform-ready, update the UI to show HTTPS-required copy for insecure LAN HTTP.
- Keep `Start camera` behavior honest:
  - On secure/trusted origins with `getUserMedia`, allow the button to request the camera.
  - On insecure LAN HTTP, show HTTPS guidance and do not imply another tap will bypass browser security.
  - On secure origins without camera APIs, show `Camera unsupported`.
- Avoid conditional text inside paragraphs that depends on browser-only values during first render.

### 5. Align GPS and compass hooks
- Apply the same hydration-safe platform state to `useGeolocation()` and `useOrientation()`.
- Ensure initial SSR/client markup does not diverge because of `requiresHTTPS`.
- Keep the actual permission checks inside click handlers and effects after mount.

### 6. Re-check LAN dev-origin state
- Stop the current direct `next dev -p 3001` process.
- Restart with `npm run dev:lan`.
- Confirm the printed allowed origins include the current Wi-Fi IP, now `192.168.0.128`.
- Confirm logs no longer show new blocked-origin warnings after a fresh phone page load.
- This is not the primary hydration fix, but it removes a second source of mobile inertness.

### 7. Validate real mobile behavior
- Clear Android Chrome site data for the LAN URL.
- Reopen `http://192.168.0.128:3001/`.
- Confirm non-sensor buttons respond.
- Confirm camera/GPS/compass show HTTPS-required guidance over plain HTTP.
- Open an HTTPS tunnel or deployed HTTPS URL and confirm camera permission can be requested there.

### 8. Run Validation Commands
- Execute every command in the Validation Commands section.

## Validation Commands
Commands a future implementation pass should execute to validate the bug is fixed with zero regressions.

- `node scripts/dev-lan.mjs --print-origins` - Verify local origin discovery includes the active Wi-Fi host.
- `npm run test -- tests/unit/platform-secure-context.test.ts tests/unit/camera-secure-context.test.ts` - Run focused secure-context unit tests.
- `npm run test` - Run all unit tests.
- `npm run lint` - Run ESLint.
- `npm run build` - Verify production build.
- `npm run test:e2e` - Run browser smoke tests, including hydration-error and insecure-context interactivity coverage.
- Manual Android Chrome LAN HTTP validation - Confirm buttons work but sensors require HTTPS.
- Manual Android Chrome HTTPS validation - Confirm camera permission can be requested from a trusted HTTPS origin.

## Notes
The current active Wi-Fi IP is `192.168.0.128`; earlier plans referenced `192.168.10.96`. The fix and tests should keep using dynamic/deterministic fixtures rather than hard-coding the live IP except in manual validation notes.

Plain LAN HTTP cannot open the camera unless Android Chrome is explicitly configured to treat that exact origin as secure. The app should make that limitation clear while still keeping the rest of the interface interactive.
