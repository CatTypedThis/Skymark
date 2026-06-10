# User Stories and Acceptance Criteria: Sky Beacon Camera App

Version: 1.0  
Source: [PRD.md](PRD.md), [SRS.md](SRS.md)  
Date: 2026-06-10

## 1. Scope

This document converts the MVP scope and stretch goals into backlog-ready user stories with acceptance criteria. Each MVP item maps to one story. Stretch items are listed separately so they can be planned without obscuring the MVP release boundary.

## 2. MVP User Stories

### US-001 Installable PWA

Source item: Installable PWA.

User story:

As a mobile user, I want to install Sky Beacon as a progressive web app so that I can launch it like a focused outdoor tool from my device.

Acceptance criteria:

- Given I open Sky Beacon in a supported mobile browser, when the browser evaluates the app, then the app has a valid manifest with name, short name, start URL, display mode, theme color, background color, and icons.
- Given I use Android Chrome, when the install criteria are met, then the app can be installed to the home screen or app launcher.
- Given I launch the installed app, when the app opens, then it starts in the Sky Beacon experience rather than a generic browser landing page.
- Given the browser does not support PWA installation, when I open the app, then the app remains usable in the browser.
- Given app installability fails because of a missing manifest, icon, or service worker requirement, when the app is audited, then the failure is visible during development or QA.

### US-002 Install-First Demo Flow

Source item: Install-first demo flow.

User story:

As a demo presenter, I want the installed PWA flow to feel polished so that viewers understand Sky Beacon as a real app, not only a web mockup.

Acceptance criteria:

- Given the app has been installed, when I launch it from the device home screen, then the app opens in standalone display mode where the platform supports it.
- Given permissions were previously granted, when I relaunch the installed app, then I can reach the camera view without repeating the full setup flow.
- Given the app is opened in a browser tab during a demo, when installation is not active, then the app still provides the same core camera and beacon behavior.
- Given a first-time demo viewer watches the flow, when the app launches, then the product concept is visible within the first minute.

### US-003 Custom App Icon and Splash Screen

Source item: Custom app icon and splash screen.

User story:

As a user, I want Sky Beacon to have a distinctive icon and splash screen so that the app feels like a cohesive instrument from launch onward.

Acceptance criteria:

- Given the app is installed, when I view it on the home screen or app launcher, then it uses a custom Sky Beacon icon.
- Given the installed app is launching, when the platform displays a splash screen, then the splash styling matches the dark instrument visual direction.
- Given icons are rendered at common platform sizes, when they are inspected, then the symbol remains legible and is not a direct copy of copyrighted game assets.
- Given the manifest references app icons, when those assets are loaded, then no required icon path returns a missing file.

### US-004 Camera-First Outdoor View

Source item: Camera-first outdoor view.

User story:

As an outdoor user, I want the app to open into a live camera view so that I can use the real world as the main interface.

Acceptance criteria:

- Given I have completed or skipped onboarding, when camera permission is granted, then the live camera feed fills the portrait viewport.
- Given the camera view is active, when UI overlays appear, then they do not block the user's ability to see the outdoor scene.
- Given the device is held in portrait orientation, when the camera view renders, then primary controls remain reachable and readable.
- Given camera permission is denied, when the app cannot show the camera feed, then it shows a recoverable blocked state with guidance.
- Given the camera API is unsupported, when I open the app, then the app shows an unsupported-camera state rather than a blank screen.

### US-005 Brief First-Run Tutorial

Source item: Brief first-run tutorial.

User story:

As a first-time user, I want a short practical tutorial so that I understand how to place beacons without feeling slowed down.

Acceptance criteria:

- Given I open the app for the first time, when onboarding state has not been completed, then a tutorial appears before the camera experience.
- Given the tutorial is visible, when I read it, then it explains that Sky Beacon is outdoor-first and uses approximate GPS and compass anchoring.
- Given the tutorial is visible, when I move through it, then it previews the flow: aim, choose color, place beacon, and look back toward it.
- Given I want to skip the tutorial, when I choose skip, then the app saves tutorial completion state locally and proceeds to the camera flow.
- Given I relaunch the app after completing or skipping the tutorial, when local storage is available, then the tutorial does not appear again automatically.

### US-006 GPS and Compass Permission Flow

Source item: GPS and compass permission flow.

User story:

As a user, I want the app to request location and compass access at the right moment so that I understand why those permissions are needed.

Acceptance criteria:

- Given I start a flow that requires placement or directional rendering, when location has not been granted, then the app requests location permission with clear context.
- Given the browser requires orientation permission, when heading is needed, then the app provides a user-triggered orientation permission request.
- Given location permission is granted, when the app reads location, then it captures latitude, longitude, accuracy when available, and timestamp.
- Given heading or compass data is available, when the app reads orientation, then it derives a normalized heading value.
- Given either permission is denied, when the user returns to the app, then the UI shows a degraded state and explains what cannot work.

### US-007 Progressive Permission Requests

Source item: Progressive permission requests.

User story:

As a privacy-conscious user, I want Sky Beacon to ask for permissions only when needed so that I can trust what the app is doing.

Acceptance criteria:

- Given I open the app for the first time, when onboarding starts, then the app does not request camera, location, and orientation permissions all at once.
- Given I proceed to the camera experience, when camera access is needed, then the app requests camera permission.
- Given I begin placement or beacon anchoring, when location is needed, then the app requests location permission.
- Given heading is needed and the browser requires explicit access, when orientation permission is needed, then the app requests it through a user action.
- Given a permission has already been granted, when the user repeats the flow, then the app reuses the granted capability without unnecessary prompts.

### US-008 Contextual Calibration Prompts

Source item: Contextual calibration prompts.

User story:

As a user with noisy sensor data, I want calibration guidance only when it is useful so that the app helps me without interrupting normal use.

Acceptance criteria:

- Given heading data is stable, when I use the camera view, then no calibration prompt is shown.
- Given heading accuracy appears poor or unstable, when the app detects the degraded state, then it shows a concise contextual calibration prompt.
- Given a prompt is shown, when I continue using the app, then the prompt does not block placement.
- Given heading quality improves, when the app detects improved stability, then the calibration prompt is hidden or reduced.
- Given orientation data is unavailable, when calibration cannot fix the issue, then the app shows a degraded sensor state instead of misleading calibration instructions.

### US-009 Preview-and-Confirm 100 Meter Beacon Placement

Source item: Preview-and-confirm beacon placement approximately 100m ahead.

User story:

As an outdoor user, I want to preview and confirm a beacon 100 meters ahead in the direction I am facing so that I can mark a point intentionally.

Acceptance criteria:

- Given camera, location, and heading data are available, when I start placement, then the app previews a beacon in the current facing direction.
- Given I confirm placement, when the app has current latitude, longitude, and heading, then it calculates an anchor approximately 100 meters ahead.
- Given the destination is calculated, when the beacon is saved, then the saved record includes latitude, longitude, placement heading, placement distance, color, name, timestamp, and confidence metadata.
- Given I cancel placement, when the preview exits, then no beacon is saved.
- Given location or heading confidence is weak but usable, when I confirm placement, then the app allows placement and marks it as low confidence.
- Given required data is completely unavailable, when I try to confirm placement, then the app explains why placement cannot be completed.

### US-010 Up to 3 Saved Beacons

Source item: Up to 3 saved beacons.

User story:

As a user, I want to save a small number of beacons so that I can mark several points without cluttering the camera view.

Acceptance criteria:

- Given I have no saved beacons, when I place a beacon, then it is saved as the first active beacon.
- Given I have one or two saved beacons, when I place another beacon, then it is added without replacing existing beacons.
- Given I have three saved beacons, when I try to place another beacon, then the app starts the replacement flow instead of saving a fourth active beacon.
- Given three beacons are saved, when the camera overlay renders them, then the view remains readable and interactive.
- Given saved beacon data is loaded from storage, when more than three active beacon records are found, then the app limits or repairs the active list safely.

### US-011 Full Temporary Beacon Preview

Source item: Full temporary beacon preview before confirmation.

User story:

As a user placing a beacon, I want to see a full temporary beacon before I confirm so that I understand what will be saved.

Acceptance criteria:

- Given placement preview is active, when the camera overlay renders, then the temporary beacon appears as a complete vertical light pillar.
- Given the preview beacon is shown, when I change the selected color, then the preview updates immediately.
- Given the preview is temporary, when I have not confirmed placement, then the beacon is visually distinct from saved beacons.
- Given I cancel the preview, when the app returns to normal camera mode, then the temporary beacon disappears.
- Given I confirm the preview, when placement succeeds, then the saved beacon appears immediately in the camera overlay.

### US-012 Manual 5-Color Beacon Palette

Source item: Manual beacon color choice from a curated 5-color palette.

User story:

As a user, I want to choose from five clear beacon colors so that my markers are easy to tell apart outdoors.

Acceptance criteria:

- Given I am previewing a beacon, when the color control is visible, then it shows exactly five curated color options.
- Given I select a color, when the preview is visible, then the preview beacon changes to that color.
- Given colors are displayed over the camera feed, when viewed against bright skies and busy backgrounds, then each option remains distinguishable.
- Given the default cyan accent is included as a beacon color, when UI status also uses cyan, then selected beacon state and app status remain visually distinguishable.
- Given I confirm placement, when the beacon is saved, then the selected color persists in the saved record.

### US-013 Post-Placement Beacon Color Editing

Source item: Post-placement beacon color editing.

User story:

As a user, I want to edit a beacon's color after placement so that I can keep my markers organized as my plans change.

Acceptance criteria:

- Given a saved beacon exists, when I open the beacon drawer or selected beacon controls, then I can access color editing.
- Given I choose a new palette color, when the edit is applied, then the drawer and camera overlay update to the new color.
- Given the app is reopened, when the beacon loads from local storage, then the edited color is preserved.
- Given the user attempts to set a color outside the curated palette, when validation runs, then the app rejects it or maps it to a valid palette color.

### US-014 Generated Beacon Names with Rename Support

Source item: Generated beacon names with rename support.

User story:

As a user, I want new beacons to get simple generated names that I can rename so that I can recognize important markers later.

Acceptance criteria:

- Given I place a new beacon, when it is saved, then it receives a generated name using the format `Beacon 01`, `Beacon 02`, or `Beacon 03`.
- Given a generated name appears in the drawer, when I select rename, then I can enter a custom name.
- Given I save a custom name, when the drawer updates, then the custom name is shown.
- Given I reopen the app, when saved beacons load, then custom names persist.
- Given I submit an empty or whitespace-only name, when validation runs, then the app rejects it or restores a valid generated name.

### US-015 Local-Only Persistence

Source item: Local-only persistence.

User story:

As a user, I want my beacons to stay on my device after I close the app so that I can return to them without creating an account.

Acceptance criteria:

- Given I save one or more beacons, when I close and reopen the app on the same device, then the beacons are still available.
- Given I rename or recolor a beacon, when I reopen the app, then those edits are preserved.
- Given persistence is local-only, when I use the MVP, then no user account is required.
- Given persistence is local-only, when core beacon data is saved, then the app does not require a backend service.
- Given storage fails or is unavailable, when the app tries to save a beacon, then the user receives a clear failure message.

### US-016 Compact Beacon List or Drawer

Source item: Compact beacon list or drawer.

User story:

As a user, I want a compact beacon drawer so that I can manage markers without leaving the camera-first experience.

Acceptance criteria:

- Given the camera view is active, when I open the beacon drawer, then it appears over the camera without replacing the main experience.
- Given saved beacons exist, when the drawer opens, then each beacon row shows its color and name.
- Given no beacons exist, when the drawer opens, then it shows an empty state appropriate to the instrument UI.
- Given the drawer is open, when I close it, then I return to the camera view with prior context preserved.
- Given the drawer contains management actions, when displayed on a mobile viewport, then controls remain usable and uncluttered.

### US-017 Beacon Selection, Deletion, Undo, and Clear All

Source item: Beacon selection, deletion, immediate single-delete undo, and clear-all with confirmation.

User story:

As a user, I want to select, remove, undo removal, or clear beacons so that my marker list stays current.

Acceptance criteria:

- Given saved beacons exist, when I select one from the drawer or camera controls, then selected state is visible.
- Given a beacon is selected, when I delete it, then it is removed immediately without a confirmation modal.
- Given a single beacon was deleted, when the undo affordance appears, then choosing undo restores the deleted beacon.
- Given the undo window expires, when I try to undo, then the deleted beacon remains removed.
- Given the drawer is open, when I choose clear all, then the app asks for confirmation before removing all beacons.
- Given I confirm clear all, when the action completes, then all saved beacons are removed from storage, drawer, and overlay.
- Given I cancel clear all, when the confirmation closes, then no beacons are removed.

### US-018 Replace Existing Beacon at Limit

Source item: Replace-existing-beacon flow when the user already has 3 saved beacons.

User story:

As a user with three saved beacons, I want to choose which existing beacon to replace so that I stay in control of my markers.

Acceptance criteria:

- Given I already have three saved beacons, when I attempt to place another beacon, then the app informs me that the limit has been reached.
- Given the limit has been reached, when replacement is needed, then the app opens or directs me to the beacon drawer.
- Given the drawer shows existing beacons, when I select one for replacement, then the app clearly marks the replacement target.
- Given I confirm replacement, when the new beacon is saved, then it replaces only the selected existing beacon.
- Given I cancel replacement, when the flow exits, then no existing beacon is changed.
- Given replacement succeeds, when the drawer and overlay update, then there are still no more than three active saved beacons.

### US-019 Directional Camera Overlay Rendering

Source item: Directional camera overlay rendering.

User story:

As a user, I want saved beacons to appear in the camera view based on where they are anchored so that I can turn back toward them naturally.

Acceptance criteria:

- Given a saved beacon exists and location and heading are available, when the app renders the overlay, then it calculates bearing from the user to the beacon.
- Given the beacon bearing is near the current heading, when I look toward the beacon, then the beacon appears near the center of the camera overlay.
- Given I rotate away from the beacon, when the bearing difference increases, then the beacon moves horizontally toward the edge or becomes off-screen.
- Given heading crosses the 0 or 360 degree boundary, when bearing difference is calculated, then the beacon position remains correct.
- Given up to three beacons are visible, when the overlay renders, then it remains stable, upright, and readable.
- Given pitch data is available, when I tilt the device upward or downward, then the beacon's vertical presentation responds in a way that reinforces skyward height.

### US-020 Lightweight Off-Screen Direction Indicator

Source item: Lightweight off-screen direction indicator.

User story:

As a user, I want a subtle indicator when a beacon is off-screen so that I know which way to turn without losing the camera-first feel.

Acceptance criteria:

- Given a beacon is outside the current camera field of view, when heading data is available, then the app shows a lightweight direction indicator.
- Given the beacon is to the left, when the indicator renders, then it points or anchors left.
- Given the beacon is to the right, when the indicator renders, then it points or anchors right.
- Given the beacon returns into view, when it is rendered in the overlay, then the off-screen indicator is hidden or reduced.
- Given multiple beacons are off-screen, when indicators render, then they avoid excessive clutter.
- Given heading data is unavailable, when direction cannot be trusted, then the indicator is hidden or marked as unreliable.

### US-021 Anchor Readiness, Heading, Stability, and Confidence Indicators

Source item: Anchor readiness, heading, stability, and confidence indicators.

User story:

As a user, I want to see whether the app has a usable anchor and heading so that I know how much to trust placement.

Acceptance criteria:

- Given the app is waiting for location or heading, when the camera view is active, then it shows a pending or scanning state.
- Given location and heading are usable, when readiness is achieved, then the app shows an anchor-ready state.
- Given heading is available, when the status readout is visible, then it exposes heading in a concise instrument-style way.
- Given sensor readings are unstable, when confidence is low, then the app shows degraded stability or confidence status.
- Given confidence changes while the app is open, when status updates, then the UI reflects the new state without requiring a reload.
- Given a beacon was placed under low confidence, when that beacon is selected, then its confidence metadata is understandable to the user.

### US-022 Low-Confidence Warning Without Blocking Placement

Source item: Low-confidence warning without blocking placement.

User story:

As a user, I want low-confidence warnings that still let me place a beacon so that I can continue using the tool while understanding the risk.

Acceptance criteria:

- Given GPS accuracy is poor or heading is unstable, when I start or confirm placement, then the app shows a low-confidence warning.
- Given required sensor data is weak but present, when I confirm placement, then the app allows the placement.
- Given a beacon is placed under low confidence, when it is saved, then the beacon record includes low-confidence metadata.
- Given low confidence affects rendering, when the beacon appears, then its visual treatment communicates uncertainty through softer, faded, or qualified styling.
- Given required sensor data is completely missing, when placement cannot be computed, then the app blocks confirmation with an explanation rather than saving invalid coordinates.

### US-023 Haptic Feedback for Placement and Confirmation

Source item: Haptic feedback for placement and confirmation where supported.

User story:

As a mobile user, I want subtle haptic feedback during placement so that confirming or failing an action feels immediate.

Acceptance criteria:

- Given the device and browser support vibration or haptics, when placement succeeds, then the app triggers a short success feedback pattern.
- Given the device and browser support vibration or haptics, when placement fails, then the app triggers a distinct failure feedback pattern.
- Given the browser does not support haptics, when placement succeeds or fails, then the app continues without errors.
- Given haptic feedback runs, when the user is interacting with the app, then the feedback is brief and not disruptive.

### US-024 Dark Instrument Visual Design

Source item: Dark instrument visual design based on the provided Stitch direction.

User story:

As a user, I want the app to feel like a mysterious field instrument so that beacon placement feels exploratory and distinct from a standard map app.

Acceptance criteria:

- Given the app is viewed in the camera experience, when UI panels and controls render, then they use dark surfaces, translucent glass, thin borders, and restrained glow.
- Given status labels and readouts are visible, when they render, then they use compact technical styling consistent with an instrument UI.
- Given beacons render in the overlay, when they are visible, then they appear as luminous sky-reaching pillars with animated or pulsing energy cues.
- Given the app uses fantasy-adventure inspiration, when UI assets are inspected, then they do not copy Zelda names, glyphs, fonts, sounds, colors, or interface layouts.
- Given the app is used outdoors, when backgrounds are bright, dark, or visually busy, then controls and beacons remain readable.

## 3. Stretch Goal User Stories

### US-S01 Map View for Adjusting Existing Beacons

Source item: Map view for adjusting existing beacons.

User story:

As a user, I want to adjust an existing beacon on a map so that I can correct approximate camera placement when I know the intended location.

Acceptance criteria:

- Given a saved beacon exists, when I open the map view, then the beacon appears at its stored coordinate.
- Given I move the beacon on the map, when I save the adjustment, then the beacon's latitude and longitude update.
- Given the adjusted beacon is saved, when I return to the camera view, then the overlay uses the updated coordinate.
- Given the map cannot load, when I try to adjust a beacon, then the app shows a recoverable map error without affecting the saved beacon.

### US-S02 Map View for Placing New Beacons

Source item: Map view for placing new beacons directly.

User story:

As a user, I want to place a new beacon directly on a map so that I can mark a location without physically aiming at it.

Acceptance criteria:

- Given the map view is available, when I choose a location on the map, then the app can create a beacon at that coordinate.
- Given I create a map beacon, when it is saved, then it uses the same data model as camera-created beacons.
- Given I already have three saved beacons, when I place a map beacon, then the same replacement flow applies.
- Given the map-created beacon is saved, when I return to the camera view, then it renders through the same directional overlay logic.

### US-S03 Multiple UI Themes

Source item: Multiple UI themes, starting with sci-fi and fantasy.

User story:

As a user, I want to choose between polished visual themes so that the instrument can feel more technical or more magical while preserving the same core behavior.

Acceptance criteria:

- Given multiple themes are implemented, when I switch themes, then the core camera, beacon, storage, and geospatial behavior remains unchanged.
- Given the sci-fi theme is selected, when the UI renders, then it uses clean technical styling with cyan light, glass panels, and grid or scan effects.
- Given the fantasy theme is selected, when the UI renders, then it uses warmer magical accents and original crafted ornament.
- Given theme preference is saved, when I reopen the app, then the selected theme persists.
- Given theme assets are inspected, when compared with copyrighted game assets, then they remain original.

### US-S04 Advanced Placement Adjustment Flow

Source item: More advanced placement adjustment flow.

User story:

As a user, I want to fine-tune a beacon before or after saving it so that approximate placement can better match the real point I intended.

Acceptance criteria:

- Given placement preview is active, when adjustment controls are available, then I can change the intended anchor before confirming.
- Given a saved beacon is selected, when adjustment controls are available, then I can update its anchor without deleting and recreating it.
- Given an adjustment is saved, when the camera overlay re-renders, then the updated anchor is used.
- Given adjustment is canceled, when the flow exits, then the previous anchor remains unchanged.

### US-S05 Distance Display Only When Reliable

Source item: Distance display only if the app can gauge distance accurately enough to avoid fake precision.

User story:

As a user, I want distance information only when it is trustworthy so that the app does not imply false precision.

Acceptance criteria:

- Given distance accuracy is not validated, when the camera overlay renders, then no precise distance label is shown.
- Given distance display is enabled, when confidence is high enough, then the distance is shown with appropriate precision or qualification.
- Given GPS accuracy is poor, when distance would be misleading, then the app hides or qualifies the distance.
- Given a distance value is displayed, when it is tested against known locations, then it stays within an acceptable error range defined for the release.

### US-S06 More Accurate Obstruction-Aware Rendering

Source item: More accurate obstruction-aware rendering using building, terrain, or map data if readily available.

User story:

As a city user, I want beacon rendering to respect likely obstructions so that the app does not show a ground base through buildings or terrain.

Acceptance criteria:

- Given reliable obstruction data is available, when a beacon base is likely hidden, then the app clips, fades, or hides the lower beacon portion.
- Given only the skyward beacon portion should be implied, when I look upward in the correct direction, then the app can show the unobstructed upper portion.
- Given obstruction data is unavailable or unreliable, when rendering beacons, then the app uses conservative visual approximations.
- Given obstruction-aware rendering is active, when it is compared with the MVP fallback, then it avoids making stronger visibility claims than the data supports.

### US-S07 Haptic Feedback Polish

Source item: Haptic feedback polish.

User story:

As a mobile user, I want refined haptic feedback so that scanning, previewing, confirming, and errors each feel distinct but subtle.

Acceptance criteria:

- Given haptics are supported, when I start placement preview, then the app may provide a subtle start feedback pattern.
- Given haptics are supported, when I confirm placement successfully, then the success pattern is distinct from preview feedback.
- Given haptics are supported, when placement fails or confidence is low, then the warning or failure pattern is distinct and brief.
- Given haptics are unsupported or disabled, when these events occur, then the app continues with visual and animated feedback only.
- Given haptic patterns are tested on the primary demo device, when repeated during normal use, then they do not feel excessive or distracting.

## 4. Release Boundary Notes

- Stories US-001 through US-024 define the MVP backlog.
- Stories US-S01 through US-S07 are stretch goals and should not block MVP release unless explicitly pulled into scope.
- User accounts, cloud sync, native apps, required WebXR anchors, social sharing, multiplayer, indoor precision positioning, and copyrighted game assets remain out of scope for the MVP.

