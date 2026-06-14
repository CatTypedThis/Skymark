# Bug: Camera Requires Secure Context On Phone LAN

## Bug Description
When Sky Beacon is opened from a phone at a LAN HTTP URL such as `http://192.168.10.96:3001`, the camera cannot open. The screenshot shows Chrome warning about the insecure origin, a Sky Beacon warning saying `Camera and sensor features require HTTPS. Please use a secure HTTPS connection.`, and the camera panel falling back to `Camera unsupported` with `This browser cannot open a live camera stream.`

Expected behavior: the app should make the secure-context requirement explicit before attempting camera access, and the test suite should prove that the camera path becomes available only when the app is served from a secure or otherwise trusted origin with `getUserMedia` available.

Actual behavior: the app currently mixes two states. The global app warning correctly notices the insecure LAN origin, but the camera hook only treats insecure origins as HTTPS-blocked on iOS. On Android Chrome over LAN HTTP, `navigator.mediaDevices.getUserMedia` may be hidden by the browser because the origin is not secure, so the camera UI reports `Camera unsupported` instead of a secure-context block.

## Problem Statement
The app needs a testable, browser-agnostic secure-context gate for camera and sensor access. Plain HTTP LAN URLs are not secure contexts for camera APIs, so the app cannot make the camera work from `http://192.168.10.96:3001` by changing React code alone. It must either be served over HTTPS or use a browser/development exception, and the UI/tests must clearly distinguish this from a genuinely unsupported browser.

## Solution Statement
Promote secure-context detection into shared platform logic that applies to every mobile browser, not only iOS. Check the insecure context before checking for `navigator.mediaDevices.getUserMedia`, expose a generic HTTPS-required state to `CameraView`, and keep iOS-specific wording only where it is truly iOS-specific. Add regression tests that fail on the current behavior and pass once insecure LAN HTTP is classified as HTTPS-blocked while secure/trusted contexts continue to request the camera normally.

## Steps to Reproduce
- Start the LAN dev server with `npm run dev:lan`.
- Open the app on a phone using a LAN HTTP URL, for example `http://192.168.10.96:3001/`.
- Complete onboarding or reach the camera screen.
- Tap `Start camera` if the button is visible.
- Observe the browser address bar marks the origin as insecure.
- Observe Sky Beacon shows `Camera and sensor features require HTTPS. Please use a secure HTTPS connection.`
- Observe the camera panel shows `Camera unsupported` and `This browser cannot open a live camera stream.`

## Root Cause Analysis
`lib/utils/platform.ts` already detects non-local HTTP origins through `isInsecureContext`, and `getHTTPSRequiredMessage()` returns a generic HTTPS-required message for every insecure context. This is why the screenshot contains the correct global warning.

`lib/sensors/use-camera-stream.ts` uses a narrower gate. It checks `navigator.mediaDevices?.getUserMedia` first, then only blocks early when `platform.requiresHTTPSForSensors` is true. Today `requiresHTTPSForSensors` is calculated as `isIOS && isInsecureContext`, so Android Chrome on `http://192.168.10.96:3001` is not treated as HTTPS-blocked by the camera hook.

Modern browsers expose camera APIs only to secure contexts, with localhost-style development origins treated specially. On an insecure LAN HTTP origin, Chrome can omit `navigator.mediaDevices`, so the hook enters the `unsupported` branch before it ever has a chance to explain that HTTPS is required. `CameraView` also receives `requiresHTTPS={camera.requiresHTTPS}`, which is false for non-iOS insecure origins, so the camera panel cannot render the generic HTTPS-required state consistently.

This is not the same bug as the earlier blocked Next.js dev-origin/hydration issues in `BUG-05` and `BUG-06`. The app is now rendering the secure-context warning, but it still needs consistent camera/sensor classification and tests for insecure LAN contexts.

## Relevant Files
Likely files for a future implementation pass:

- `lib/utils/platform.ts` - Centralize secure-context detection and expose browser-agnostic sensor HTTPS requirements.
- `lib/sensors/use-camera-stream.ts` - Check insecure context before `navigator.mediaDevices` support checks and return a blocked HTTPS-required camera state.
- `lib/sensors/use-geolocation.ts` - Align GPS gating with the shared secure-context requirement, while preserving clearer iOS permission-denied messages.
- `lib/sensors/use-orientation.ts` - Align compass gating with the shared secure-context requirement, while preserving iOS gesture/permission handling.
- `components/camera/CameraView.tsx` - Render a generic secure-connection message for all insecure origins and avoid duplicating iOS-only copy.
- `components/SkyBeaconApp.tsx` - Keep the global sensor warning consistent with the lower-level camera/sensor hook states.
- `tests/e2e/sky-beacon.smoke.spec.ts` - Existing browser smoke tests can verify the user-visible camera messages and mocked camera success/failure paths.
- `README.md` - Clarify that LAN HTTP cannot open camera without a secure-origin workaround, HTTPS tunnel, or deployment.

### New Files

- `tests/unit/platform-secure-context.test.ts` - Unit coverage for secure, localhost, loopback, LAN HTTP, Android Chrome, and iOS Safari platform detection.
- Optional: `tests/unit/camera-secure-context.test.tsx` - Hook/component-level coverage if the implementation introduces a testable camera-state helper or existing test tooling can render hooks without adding a dependency.

## Step by Step Tasks
IMPORTANT: These are instructions for a future implementation pass. Do not execute them while using this skill.

### 1. Add failing secure-context platform tests
- Create unit tests around `detectPlatform()` or a newly extracted pure helper.
- Cover `https://example.test` as secure and not HTTPS-blocked.
- Cover `http://localhost:3001` and `http://127.0.0.1:3001` as development-trusted and not HTTPS-blocked.
- Cover `http://192.168.10.96:3001` with an Android Chrome user agent as insecure and HTTPS-blocked for sensors.
- Cover `http://192.168.10.96:3001` with an iOS Safari user agent as insecure and HTTPS-blocked with iOS-specific messaging available.
- Cover server-side execution where `window` is undefined so SSR remains safe.

### 2. Update platform detection
- Prefer `window.isSecureContext` when available, because it reflects the browser's actual secure-context decision.
- Preserve localhost and loopback fallbacks for tests/environments where `isSecureContext` is unavailable.
- Replace the iOS-only `requiresHTTPSForSensors` calculation with a browser-agnostic secure-context requirement for all insecure non-local origins.
- If useful, add a separate flag such as `requiresIOSHTTPSMessaging` or keep `isIOS` available for copy decisions instead of using it to decide whether HTTPS is required.

### 3. Fix camera state classification
- In `useCameraStream()`, check the shared secure-context requirement before checking `navigator.mediaDevices?.getUserMedia`.
- When the origin is insecure, set status to `blocked` and set a generic message such as `Camera access requires HTTPS. Please use a secure HTTPS connection.`
- Keep the existing `unsupported` branch for browsers that are secure/trusted but still do not expose camera APIs.
- Return `requiresHTTPS` from the hook for any insecure non-local origin, not only iOS.

### 4. Align GPS and compass behavior
- In `useGeolocation()` and `useOrientation()`, use the same secure-context requirement so GPS and compass do not try browser APIs from insecure LAN HTTP.
- Keep iOS-specific permission-denied guidance for real permission failures after the app is running in a secure context.
- Make sure the global warning in `SkyBeaconApp` does not fight with the camera panel copy.

### 5. Add user-visible regression tests
- Extend Playwright smoke coverage to assert the camera panel shows secure-connection guidance rather than `Camera unsupported` when the app is evaluated as an insecure non-local origin.
- If Playwright cannot reliably host a non-local insecure origin in CI, keep this as a unit/component test against the extracted platform/camera-state helper and document the manual phone validation below.
- Add or keep a Playwright test for the secure/trusted path where `navigator.mediaDevices.getUserMedia` is mocked and clicking `Start camera` reaches the mocked camera flow.
- Add an assertion that the HTTPS-required state hides or disables `Start camera` until the origin is secure, so the UI cannot imply that another tap will bypass browser security.

### 6. Document the real resolution path
- Update README phone testing notes to say that `npm run dev:lan` is useful for layout and non-camera flows over HTTP, but camera/GPS/compass require HTTPS or a browser secure-origin exception.
- Add a concise Android Chrome note for `chrome://flags/#unsafely-treat-insecure-origin-as-secure` as a development-only workaround.
- Keep iOS guidance focused on HTTPS tunnels or HTTPS deployments because iOS Safari cannot use the Android Chrome flag.
- Optionally add a future task for `npm run dev:lan:https` using Next's local `--experimental-https` support, but only if manual phone validation confirms the generated certificate is trusted enough for camera APIs on the target device.

### 7. Validate on a real phone
- Clear site data for `http://192.168.10.96:3001` on the phone.
- Restart `npm run dev:lan`.
- Open the LAN HTTP URL and confirm the app reports HTTPS-required instead of `Camera unsupported`.
- Open an HTTPS tunnel or deployed HTTPS URL for the same app.
- Confirm the browser prompts for camera permission or shows the live camera feed.
- Confirm the camera cannot be opened from plain LAN HTTP unless Android Chrome has been explicitly configured to treat that origin as secure.

### 8. Run Validation Commands
- Execute every command in the Validation Commands section.

## Validation Commands
Commands a future implementation pass should execute to validate the bug is fixed with zero regressions.

- `npm run lint` - Run ESLint.
- `npm run test` - Run unit tests, including the new secure-context regression tests.
- `npm run build` - Verify the production build.
- `npm run test:e2e` - Run browser smoke tests for camera fallback and mocked camera flows.
- Manual phone HTTPS validation - Verify camera permission and feed on a secure HTTPS origin.

## Notes
The screenshot appears to be Android Chrome at `192.168.10.96:3001`, not iOS Safari. The current UI string `Camera and sensor features require HTTPS. Please use a secure HTTPS connection.` is directionally correct for that origin; the misleading part is the lower camera panel reporting generic unsupported-camera behavior.

This plan intentionally does not try to bypass browser security. The app can make the failure clear, provide a supported HTTPS development path, and test both blocked and working states, but camera access itself still depends on a secure context.
