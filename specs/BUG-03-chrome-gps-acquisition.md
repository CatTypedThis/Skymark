# Bug: Chrome GPS Acquisition Timing Issue

## Bug Description
On Chrome browser (desktop and Android), users receive "Sensor Data needed" notification immediately when attempting to preview beacons, even when GPS is working but hasn't yet acquired the first location fix. This creates a poor user experience where users are told GPS access is needed even when they just granted it.

**Symptoms:**
- "Sensor Data needed" notification appears immediately after clicking preview button
- Notification suggests granting GPS access even when permission was just granted
- GPS may be working fine but hasn't completed first location acquisition
- Users may be confused by repeated "grant GPS access" messages

**Expected Behavior:** The app should allow time for GPS acquisition and show a "requesting location" state before showing "Sensor Data needed" error.

**Actual Behavior:** The app checks for GPS availability immediately after requesting location, before GPS has time to acquire a fix.

## Problem Statement
The GPS acquisition timing issue stems from synchronous checking of location availability immediately after an asynchronous location request. The current implementation:

1. User clicks preview button
2. `requestPlacementSensors()` is called
3. `location.requestLocation()` triggers GPS acquisition (asynchronous)
4. Immediately after, `startPreview()` checks `if (!location.fix || orientation.heading === null)`
5. Since GPS hasn't acquired yet, shows "Sensor Data needed" notification

The problem is that GPS acquisition takes time (1-10+ seconds) but the code checks immediately.

## Solution Statement
Implement proper async state management for GPS acquisition:

1. Show "requesting location" state instead of immediate error
2. Allow reasonable time for GPS acquisition before showing errors
3. Improve user feedback during GPS acquisition phase
4. Add timeout handling for GPS that never acquires
5. Better UX flow for permission → acquisition → ready states

## Steps to Reproduce
1. Open Sky Beacon in Chrome browser
2. Grant GPS permission when prompted
3. Immediately click preview button
4. See "Sensor Data needed" notification even though GPS was just granted
5. Wait a few seconds and try again - GPS now works

## Root Cause Analysis
1. **Synchronous Check After Async Request**: The code checks `!location.fix` immediately after calling `location.requestLocation()`, but GPS acquisition is asynchronous.

2. **No Requesting State Handling**: While GPS is being acquired, the app should show "requesting" state rather than immediately showing error.

3. **User Experience Issue**: Users see "Sensor Data needed" right after granting permission, which is confusing.

4. **Chrome-Specific Timing**: Chrome may have different GPS acquisition timing than other browsers, making this more noticeable.

## Relevant Files
Use these files to fix the GPS acquisition timing issue:

- `components/SkyBeaconApp.tsx` - Main app logic with immediate GPS check
- `lib/sensors/use-geolocation.ts` - Geolocation hook with status management
- `components/hud/SensorStatusBar.tsx` - Status display component
- `components/hud/BottomActionBar.tsx` - Preview button and action handling

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Add GPS Requesting State to UI

**User Story**: As a Chrome user, I want to see "requesting GPS" status instead of an error when GPS is being acquired so that I know the app is working on getting my location.

- Add visual indicator for GPS "requesting" state
- Update sensor status bar to show "Acquiring GPS..." 
- Make the requesting state distinct from error states
- Add timeout handling for GPS that takes too long

**Acceptance Criteria**:
- [ ] GPS requesting state shows immediately after permission grant
- [ ] Clear visual indication differs from error states
- [ ] Appropriate timeout after which error is shown
- [ ] Status bar shows "Acquiring GPS..." during acquisition

### 2. Improve Preview Button Logic

**User Story**: As a user, I want the preview button to handle GPS acquisition gracefully so that I don't see confusing error messages right after granting permission.

- Modify `startPreview()` to handle GPS requesting state
- Don't show "Sensor Data needed" when GPS is requesting
- Show appropriate feedback during acquisition
- Allow preview activation once GPS is ready

**Acceptance Criteria**:
- [ ] Preview button doesn't show error when GPS is requesting
- [ ] Preview becomes available automatically when GPS acquires
- [ ] Clear user feedback during acquisition phase
- [ ] No confusing "grant permission" messages after permission granted

### 3. Add GPS Acquisition Timeout Handling

**User Story**: As a user, I want to know if GPS is taking too long or failed so that I can troubleshoot or try again.

- Implement timeout for GPS acquisition (10-15 seconds)
- Show helpful error after timeout if no GPS fix acquired
- Provide retry option in error message
- Suggest troubleshooting steps for GPS issues

**Acceptance Criteria**:
- [ ] GPS acquisition times out after reasonable period
- [ ] Clear error message after timeout
- [ ] Retry option available for users
- [ ] Troubleshooting suggestions for GPS issues

### 4. Enhance Geolocation Hook

**User Story**: As a developer, I want better state management in the geolocation hook so that the UI can properly handle all GPS acquisition states.

- Ensure geolocation hook properly manages requesting state
- Add timeout handling in the hook itself
- Provide clear status transitions: idle → requesting → ready/error
- Handle GPS acquisition failures gracefully

**Acceptance Criteria**:
- [ ] Clear state management in geolocation hook
- [ ] Proper timeout handling implemented
- [ ] Status transitions are predictable and correct
- [ ] Error states are distinct from requesting states

### 5. Update Sensor Status Bar

**User Story**: As a user, I want to see clear status indicators for all sensor states so that I understand what the app is doing.

- Update sensor status bar to show GPS requesting state
- Make requesting states visually distinct from errors
- Show GPS accuracy when available
- Display acquisition progress indicator

**Acceptance Criteria**:
- [ ] GPS requesting state clearly shown in status bar
- [ ] Requesting states look different from errors
- [ ] GPS accuracy displayed when available
- [ ] Visual feedback during acquisition

## Validation Commands
Execute every command to validate the bug is fixed with zero regressions.

- `npm run lint` - Run ESLint to ensure code quality
- `npm run test` - Run unit tests to validate no regressions  
- `npm run build` - Verify production build succeeds
- Manual Chrome testing:
  - Grant GPS permission and immediately click preview
  - Verify "requesting" state shows instead of error
  - Wait for GPS acquisition and verify preview activates
  - Test on both desktop Chrome and Android Chrome
  - Verify timeout handling works when GPS fails

## Notes
- GPS acquisition typically takes 1-10 seconds depending on device and conditions
- Desktop Chrome uses WiFi/IP-based location which is faster but less accurate
- Android Chrome uses true GPS which may take longer
- The requesting state should be visually distinct from error states
- Consider adding visual feedback like pulsing indicator during acquisition
- This fix should improve UX for all browsers, not just Chrome
- Test on poor GPS conditions to verify timeout handling works properly