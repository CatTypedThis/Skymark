# Feature: Pressable Permission Chips

## Feature Description
Make the top HUD permission status chips for camera, GPS, and compass interactive so users can retry browser permission prompts directly from the app header. If a permission-backed sensor is already active, tapping its chip should show a short confirmation instead of re-requesting the browser API.

## User Story
As a Sky Beacon user
I want to tap the camera, GPS, or compass status chip
So that I can grant or retry the matching permission without searching for another control.

## Problem Statement
The top HUD displays permission-related sensor state, but the status chips are inert. Users who deny, dismiss, or otherwise miss a browser permission prompt need an obvious way to retry the matching permission request.

## Solution Statement
Convert the camera, GPS, and compass HUD chips into buttons and pass focused request handlers from the app shell. Each handler should call the existing permission request method when the sensor is not active and show a temporary toast when the sensor is already granted and working. GPS retry behavior should also clear a denied watch so a later tap can start a fresh browser request.

## Relevant Files
Use these files to implement the feature:

- `components/hud/SensorStatusBar.tsx` - Renders the top HUD permission chips and needs button callbacks.
- `components/SkyBeaconApp.tsx` - Owns sensor hook state, permission request methods, and toast messaging.
- `lib/sensors/use-geolocation.ts` - Needs to allow fresh location retries after denied or failed watch requests.
- `app/globals.css` - Styles the converted buttons so they keep the existing HUD appearance and focus behavior.
- `tests/e2e/sky-beacon.smoke.spec.ts` - Adds regression coverage for pressable chips and retry behavior.

## Implementation Plan
### Phase 1: Foundation
Add explicit camera, GPS, and compass click handler props to the sensor status bar and preserve the visual chip layout.

### Phase 2: Core Implementation
Implement app-level handlers that show granted-state toasts for active sensors and invoke the existing browser permission request paths otherwise.

### Phase 3: Integration
Clear failed geolocation watches so denied or blocked GPS states can retry cleanly, then cover the click flow with smoke tests.

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Update HUD chip component
- Replace the camera, GPS, and compass chip spans with `button` elements.
- Add clear accessible labels for each permission retry action.
- Keep non-permission status chips as display-only spans.

### 2. Add app-level handlers
- Add camera, GPS, and compass chip handlers in `SkyBeaconApp`.
- Show a temporary toast when the matching sensor is already ready.
- Call the existing request methods when the sensor is idle, blocked, timed out, unavailable, unsupported, simulated, or otherwise not active.

### 3. Fix GPS retry lifecycle
- Clear the geolocation watch id after an error so later requests can create a new watcher.
- Preserve successful watch behavior for active GPS fixes.

### 4. Add regression tests
- Verify the top status chips are buttons.
- Verify tapping denied camera and GPS chips invokes their browser request paths again.
- Verify tapping already active chips shows the already-granted toast.

### 5. Run Validation Commands
- Run all validation commands listed below.

## Testing Strategy
### Unit Tests
Existing unit tests cover geolocation helper behavior. This feature primarily needs browser interaction coverage.

### Integration Tests
Use Playwright to exercise the top HUD chips after onboarding, including blocked and already-active states.

### Edge Cases
- Camera permission denied, then retried from the top chip.
- GPS permission denied, then retried from the top chip.
- Compass permission denied, then retried from the top chip.
- Sensors already working when their chips are tapped.
- Secure-context preflight blocks permission requests before a browser prompt can appear.

## Acceptance Criteria
- Camera, GPS, and compass chips in the top HUD are keyboard and pointer pressable.
- Tapping a not-ready camera chip invokes the camera permission request path.
- Tapping a not-ready GPS chip invokes the geolocation permission request path, including after a prior denial.
- Tapping a not-ready compass chip invokes the orientation permission request path, including after a prior denial where the browser allows retry.
- Tapping an already working permission chip shows a temporary "already granted" message.
- Confidence and stability chips remain display-only.

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

- `npm run lint` - Run linting.
- `npm run test` - Run Vitest unit tests.
- `npm run test:e2e` - Run Playwright smoke tests.
- `npm run build` - Build the production PWA.

## Notes
The feature skill's documented numbering helper is not present under `C:\Users\Kirill\.claude\skills\feature` or `C:\Users\Kirill\.codex\skills\feature`, so this uses the next visible feature spec number after `SPEC-001`.
