# Bug: LAN HTTP Still Shows HTTPS Required

## Bug Description
The app is being opened from a phone at `http://192.168.10.96:3001/`, but the user still sees an HTTPS-related error after HTTPS/LAN fixes were added.

Expected behavior depends on the exact error:

- If the app shows `Camera and sensor features require HTTPS. Please use a secure HTTPS connection.`, that is expected for plain LAN HTTP. The app can load layout and beacon management over HTTP, but camera, GPS, and compass APIs require a browser-trusted secure context.
- If the camera panel still visibly says `Camera unsupported`, or the `Start camera` button stays available on `http://192.168.10.96:3001/`, that suggests stale client code, stale PWA state, or an incomplete secure-context UI state.
- If the browser itself shows an SSL/protocol page after the user typed `http://192.168.10.96:3001/`, the browser or device may be upgrading the request to HTTPS while the Next dev server is only serving HTTP.

Current local evidence suggests a fix has been implemented in the working tree: the live client bundle contains the new HTTPS messages, unit tests for secure-context detection pass, and a headless browser against the LAN URL reports `window.isSecureContext === false`, hides `Start camera`, and shows HTTPS guidance.

## Problem Statement
Plain `http://192.168.10.96:3001/` is not a secure context for mobile camera, GPS, or compass APIs. The remaining problem is to determine whether the user is seeing the expected secure-context warning, stale/old app behavior, or a browser-level HTTPS upgrade/SSL failure, then route them to the correct validation path.

## Solution Statement
Do not try to bypass browser secure-context requirements in app code. Treat LAN HTTP as a development-only layout/debug URL, ensure the app clearly classifies it as HTTPS-required for sensors, and validate full camera/GPS/compass behavior only through one of these secure paths:

- HTTPS tunnel to the local server, such as `ngrok http 3001`.
- HTTPS deployment, such as Vercel.
- Local HTTPS with a trusted certificate.
- Android Chrome development exception for the exact origin `http://192.168.10.96:3001`, followed by Chrome relaunch. This does not apply to iOS Safari.

Also eliminate stale runtime causes by stopping the current server on port 3001, restarting with `npm run dev:lan`, and clearing phone site data/service worker state for the LAN origin.

## Steps to Reproduce
1. Start the app on port 3001.
2. Open `http://192.168.10.96:3001/` from a phone on the same Wi-Fi.
3. Observe the browser marks the origin as insecure.
4. Try to use camera, GPS, or compass features.
5. Observe an HTTPS-required warning or browser HTTPS/SSL error.

## Root Cause Analysis
The core cause is browser secure-context enforcement. Modern browsers expose camera APIs, geolocation, and device orientation only on HTTPS or another browser-trusted origin. `localhost` and loopback addresses are treated specially, but a private LAN IP such as `192.168.10.96` over plain HTTP is not trusted by default.

A code-side fix has been implemented for the app-level classification:

- `next.config.ts` now dynamically computes `allowedDevOrigins`, including detected IPv4 addresses such as `192.168.10.96`.
- `scripts/dev-lan.mjs` prints phone URLs, passes `NEXT_ALLOWED_DEV_ORIGINS`, and checks for stale port 3001 usage before starting Next.
- `lib/utils/platform.ts` now uses `window.isSecureContext` when available and treats any insecure non-local origin as sensor-blocked, not only iOS.
- `lib/sensors/use-camera-stream.ts` checks HTTPS requirements before checking `navigator.mediaDevices.getUserMedia`, avoiding the misleading Android Chrome `Camera unsupported` classification.
- `lib/sensors/use-geolocation.ts` and `lib/sensors/use-orientation.ts` block insecure origins before calling GPS/compass APIs.
- Focused tests passed locally: `5` test files, `18` tests.

Remaining possible causes:

- Expected behavior: the user is still using `http://192.168.10.96:3001/`, so the app correctly requires HTTPS for sensors.
- Wrong error interpretation: the app warning is not a failed fix; it is the fix communicating that HTTP LAN cannot access sensors.
- Stale server process: port 3001 is currently served by a plain `next dev -p 3001` process, not visibly by `npm run dev:lan`. The current code should still compute LAN origins, but restarting through `npm run dev:lan` gives clearer output and stale-port protection.
- Stale phone state: mobile browser site data, installed PWA state, or service worker cache may preserve old behavior until cleared.
- Browser HTTPS-only upgrade: Chrome/Safari settings, extensions, VPN, enterprise policy, or cached upgrade state may convert `http://192.168.10.96:3001/` into `https://192.168.10.96:3001/`, causing an SSL/protocol error because Next dev is serving plain HTTP.
- Android exception not configured exactly: Chrome's insecure-origin flag must include the exact origin, including protocol and port, and Chrome must be relaunched.
- iOS limitation: iOS Safari cannot use the Android insecure-origin exception; it needs a real HTTPS URL or trusted local certificate.

## Relevant Files
Likely files for a future implementation pass:

- `README.md` - Documents the intended LAN HTTP limitation and secure testing options.
- `next.config.ts` - Computes dynamic Next.js `allowedDevOrigins`.
- `scripts/dev-lan.mjs` - Starts LAN dev server, prints phone URLs, and detects stale port usage.
- `lib/utils/platform.ts` - Central secure-context detection.
- `lib/sensors/use-camera-stream.ts` - Camera HTTPS preflight and messaging.
- `lib/sensors/use-geolocation.ts` - GPS HTTPS preflight and messaging.
- `lib/sensors/use-orientation.ts` - Compass HTTPS preflight and messaging.
- `components/camera/CameraView.tsx` - Camera panel display and disabled/hidden camera action.
- `components/hud/SensorStatusBar.tsx` - May need clearer camera blocked/HTTPS-required status if the top status bar still reads generically.
- `public/sw.js` - Relevant when clearing stale phone PWA/service-worker state.
- `tests/unit/platform-secure-context.test.ts` - Regression coverage for secure-context detection.
- `tests/unit/camera-secure-context.test.ts` - Regression coverage for camera preflight behavior.
- `tests/unit/allowed-dev-origins.test.ts` - Regression coverage for dynamic LAN origins.
- `tests/unit/dev-lan-origin.test.ts` - Regression coverage for LAN wrapper origin output.
- `tests/unit/dev-lan-port.test.ts` - Regression coverage for stale port detection.

## Step by Step Tasks
IMPORTANT: These are instructions for a future implementation pass. Do not execute them while using this skill.

### 1. Classify the exact user-visible error
- Ask for or capture the phone screenshot.
- Distinguish app-level HTTPS guidance from browser-level SSL/protocol failure.
- Record device, OS, browser, and whether it is iOS Safari, Android Chrome, an installed PWA, or another WebView.

### 2. Validate the live LAN server
- Identify the process on port 3001.
- Stop any old/manual server.
- Restart with `npm run dev:lan`.
- Confirm the printed `Allowed Next dev origins` includes `192.168.10.96`.
- Confirm `http://192.168.10.96:3001/` returns HTTP 200 from the desktop.

### 3. Clear stale phone state
- Clear site data for `http://192.168.10.96:3001`.
- Remove/reopen any installed PWA instance for that origin.
- If available in the phone browser, unregister the service worker and clear cached storage.
- Reopen the exact HTTP URL and confirm the visible app state is current.

### 4. Validate expected HTTP behavior
- On plain LAN HTTP, confirm `window.isSecureContext` is false.
- Confirm the app shows HTTPS-required guidance.
- Confirm `Start camera` is not visible or cannot imply that tapping will bypass browser security.
- Confirm the camera panel does not visibly present `Camera unsupported` as the main explanation.

### 5. Validate a real secure path
- Start `npm run dev:lan`.
- Expose port 3001 with an HTTPS tunnel, or deploy to HTTPS.
- Open the HTTPS URL from the phone.
- Confirm camera, GPS, and compass permission flows can run.
- On Android only, alternatively configure `chrome://flags/#unsafely-treat-insecure-origin-as-secure` with `http://192.168.10.96:3001`, relaunch Chrome, and retest.

### 6. Improve UX only if diagnosis shows residual confusion
- If users still confuse the correct HTTP warning for a broken fix, add sharper copy that says LAN HTTP is connected but sensors need HTTPS.
- If the top status bar still reads too generically, consider a camera status label such as `Camera HTTPS required`.
- If local HTTPS should be first-class, add a separate `dev:https` or `dev:lan:https` workflow using a trusted local certificate or documented tunnel.

### 7. Run Validation Commands
- Run the commands listed below.
- Perform manual phone validation on both the LAN HTTP URL and one secure HTTPS URL.

## Validation Commands
Commands a future implementation pass should execute to validate the bug is fixed with zero regressions.

- `node scripts/dev-lan.mjs --print-origins` - Verify local origin discovery includes the active Wi-Fi host.
- `npm run test -- tests/unit/platform-secure-context.test.ts tests/unit/camera-secure-context.test.ts tests/unit/allowed-dev-origins.test.ts tests/unit/dev-lan-origin.test.ts tests/unit/dev-lan-port.test.ts` - Run focused secure-context and LAN-origin regression tests.
- `npm run test` - Run all unit tests.
- `npm run lint` - Run static analysis.
- Manual phone HTTP validation - Confirm plain `http://192.168.10.96:3001/` loads app UI but reports HTTPS required for sensors.
- Manual phone HTTPS validation - Confirm camera, GPS, and compass flows work from a trusted HTTPS URL.

## Notes
During this investigation, `node scripts/dev-lan.mjs --print-origins` reported `192.168.10.96` as an allowed origin and phone URL. `Invoke-WebRequest http://192.168.10.96:3001/` returned HTTP 200 from the desktop. A headless Chromium run against the LAN URL reported `window.isSecureContext: false`, found HTTPS guidance, and found no visible `Start camera` button after hydration.

This plan intentionally separates "the app is reachable over LAN HTTP" from "mobile sensors can run over LAN HTTP." The first is supported for development. The second is blocked by browser security unless the origin is HTTPS or explicitly trusted by the browser.
