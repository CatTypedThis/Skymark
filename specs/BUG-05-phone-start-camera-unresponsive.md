# Bug: Phone Start Camera Button Unresponsive

## Bug Description
When the Sky Beacon app is run locally for phone testing, the camera permission screen renders on the phone but the `Start camera` button does not respond to taps.

Expected behavior: tapping `Start camera` should reach the React handler and either open the browser camera permission prompt, enter a requesting state, or show a clear unsupported/HTTPS error.

Actual behavior: the button is visible and appears enabled, but tapping it on the LAN URL produces no visible state change.

## Problem Statement
Phone testing over the LAN can render a server-generated page that looks usable while Next.js development resources are blocked for the phone host. That leaves critical client behavior unhydrated or partially loaded, so visible controls such as `Start camera` do not reliably receive React click handlers.

## Solution Statement
Make the LAN development command configure Next.js `allowedDevOrigins` automatically for the machine's reachable local addresses before starting `next dev`. Keep the existing camera permission UI, but ensure the phone URL is a fully hydrated development origin and document how to distinguish a real sensor/HTTPS limitation from an unresponsive app shell.

## Steps to Reproduce
- Start the local LAN server with `npm run dev:lan` and no `.env.local` `NEXT_ALLOWED_DEV_ORIGINS` override.
- Open the app from a phone using the Wi-Fi URL, for example `http://192.168.10.96:3001/`.
- Tap `Start camera`.
- Observe that the visible button does not change the UI.
- Check `dev-server-3001.err.log`.
- The log shows Next.js blocking development resources from `192.168.10.96`, with guidance to add that host to `allowedDevOrigins`.

## Root Cause Analysis
The camera button itself is not the broken piece. `components/camera/CameraView.tsx` renders a normal enabled `Button` with `onClick={onRequestCamera}`, and `lib/sensors/use-camera-stream.ts` has clear state transitions for unsupported, requesting, ready, and blocked camera states. In a phone-sized browser viewport on `http://localhost:3001/`, clicking `Start camera` reaches the handler and changes the UI to a camera error state.

The LAN origin behaves differently. The current dev command binds Next to `0.0.0.0`, but the server prints a virtual-network address (`198.18.0.1`) while the phone uses the actual Wi-Fi host (`192.168.10.96`). `next.config.ts` only applies `allowedDevOrigins` when `NEXT_ALLOWED_DEV_ORIGINS` is set, and this checkout has no `.env.local`. The dev log therefore shows blocked cross-origin requests to Next dev resources from `192.168.10.96` and `127.0.0.1`.

Next.js development mode blocks requests to dev-only assets and endpoints from hostnames other than the one the server was initialized with unless they are listed in `allowedDevOrigins`. The official docs describe this behavior and show `allowedDevOrigins` as the intended fix: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins.

Because the server-rendered HTML is still visible, the phone can show the camera permission panel even when the client bundle/effects are not reliably active for that origin. The result looks like an unresponsive button, but the underlying failure is development-origin hydration/interactivity, not camera permission code or CSS hit testing.

## Relevant Files
Likely files for a future implementation pass:

- `package.json` - Replace the current `dev:lan` script with a wrapper that configures allowed LAN origins before spawning Next.
- `next.config.ts` - Continue reading `NEXT_ALLOWED_DEV_ORIGINS`; optionally normalize host values so manual entries are forgiving.
- `.env.example` - Document the expected comma-separated host format for manual overrides.
- `README.md` - Update phone testing instructions so the LAN command is deterministic and so HTTPS/camera limitations are separate from interactivity failures.
- `components/camera/CameraView.tsx` - Keep as a reference point for the `Start camera` button and expected UI states.
- `lib/sensors/use-camera-stream.ts` - Keep as a reference point for the expected result after the button handler fires.
- `tests/e2e/sky-beacon.smoke.spec.ts` - Existing smoke coverage already verifies that clicking `Start camera` reaches a mocked camera rejection path.
- `public/sw.js` - Reference during manual validation to clear any stale phone service worker/cache state before retesting.

### New Files

- `scripts/dev-lan.mjs` - New LAN dev wrapper that discovers local addresses, sets `NEXT_ALLOWED_DEV_ORIGINS`, prints usable URLs, and starts Next.
- `tests/unit/dev-lan-origin.test.ts` - Optional unit coverage for origin normalization and dry-run output if the wrapper exposes pure helpers.

## Step by Step Tasks
IMPORTANT: These are instructions for a future implementation pass. Do not execute them while using this skill.

### 1. Confirm the current failure mode
- Start the existing app with `npm run dev:lan`.
- Open the app locally through `http://localhost:3001/` and verify `Start camera` changes state when clicked.
- Open the app through the active Wi-Fi URL, for example `http://192.168.10.96:3001/`, and verify the button is visible but does not change state on the phone.
- Confirm the dev server logs include blocked cross-origin messages for the Wi-Fi host.

### 2. Add a deterministic LAN dev wrapper
- Create `scripts/dev-lan.mjs`.
- Discover non-internal IPv4 addresses with Node's `os.networkInterfaces()`.
- Include `localhost`, `127.0.0.1`, the OS hostname, and every detected local IPv4 host in the allowed-origin host list.
- Merge any user-provided `NEXT_ALLOWED_DEV_ORIGINS` values without dropping them.
- Normalize entries so `192.168.10.96`, `http://192.168.10.96:3001`, and whitespace-padded values resolve to hostnames Next accepts.
- Spawn Next with `next dev -H 0.0.0.0 -p 3001` and the computed `NEXT_ALLOWED_DEV_ORIGINS`.
- Add a `--print-origins` or `--dry-run` mode that prints the computed host list and exits for validation.

### 3. Wire the wrapper into project scripts
- Change `package.json` so `npm run dev:lan` calls the wrapper instead of calling `next dev` directly.
- Preserve the current default port `3001`.
- Allow a future developer to override the port through an environment variable if the wrapper can do this without extra complexity.

### 4. Harden configuration and docs
- Review `next.config.ts` and keep `allowedDevOrigins` tied to `NEXT_ALLOWED_DEV_ORIGINS`.
- If normalization is not fully handled in the wrapper, normalize values in `next.config.ts`.
- Update `.env.example` with a short example that uses hostnames/IPs, not full URLs, unless normalization accepts both.
- Update `README.md` phone testing instructions to say the LAN script now auto-allows current local addresses.
- Keep the existing HTTPS caveat: even after button interactivity is fixed, camera access on iOS requires HTTPS, and Android HTTP testing requires an insecure-origin exception or HTTPS tunnel.

### 5. Add regression coverage
- Add unit coverage for the LAN origin normalization helper or wrapper dry-run output.
- Keep the existing e2e smoke test that clicks `Start camera` with a mocked camera rejection and expects the error text to appear.
- If practical, add a local development validation note or script that fails when `npm run dev:lan` starts without including the active Wi-Fi host in `NEXT_ALLOWED_DEV_ORIGINS`.

### 6. Validate on a real phone
- Clear site data for the LAN origin on the phone, including service worker/cache state if the browser exposes it.
- Restart the LAN dev server after the wrapper change.
- Open the active Wi-Fi URL from the phone.
- Confirm the dev server log no longer shows blocked cross-origin requests for the phone host.
- Tap `Start camera`.
- Confirm the UI changes state: camera permission prompt, camera feed, `Camera unsupported`, or HTTPS guidance are all acceptable; a no-op tap is not.

### 7. Run Validation Commands
- Execute every command in the Validation Commands section.

## Validation Commands
Commands a future implementation pass should execute to validate the bug is fixed with zero regressions.

- `node scripts/dev-lan.mjs --print-origins` - Verify the wrapper computes local allowed origins without starting the long-running dev server.
- `npm run lint` - Run ESLint.
- `npm run test` - Run unit tests.
- `npm run build` - Verify the production build.
- `npm run test:e2e` - Run the browser smoke tests.

## Notes
The current active Wi-Fi host observed in logs is `192.168.10.96`, but this can change after reconnecting to Wi-Fi. The future fix should not hard-code this address.

The current server log also shows `127.0.0.1` being blocked, so the wrapper should allow both `localhost` and `127.0.0.1`.

If the phone is iOS Safari over plain HTTP, a working tap still cannot grant camera access because iOS requires HTTPS for camera, GPS, and compass APIs. That should appear as clear HTTPS guidance, not as an inert button.
