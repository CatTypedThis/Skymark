# Software Requirements Specification: Sky Beacon Camera App

Version: 1.1  
Source: [PRD.md](PRD.md)  
Date: 2026-06-10

## 1. Purpose

This Software Requirements Specification defines the MVP requirements for Sky Beacon, an outdoor-first progressive web app that lets users place GPS-backed, sky-reaching beacons through a live camera interface.

This version is organized as requirement items. Each item includes a user story and acceptance criteria so the product can be implemented, tested, and reviewed without ambiguity.

## 2. Scope

### 2.1 MVP Scope

The MVP includes:

- Installable PWA shell.
- Custom app icon and splash styling.
- First-run tutorial.
- Camera-first mobile view.
- Progressive camera, location, and orientation permission requests.
- GPS and compass-based beacon placement approximately 100 meters ahead.
- Full beacon preview before confirmation.
- Manual beacon color selection from a curated 5-color palette.
- Up to 3 locally saved beacons.
- Beacon selection, rename, recolor, delete, undo delete, and clear all.
- Local-only persistence.
- Directional camera overlay rendering.
- Off-screen direction indicator.
- Anchor readiness, heading, stability, and confidence indicators.
- Low-confidence warning without blocking approximate placement.
- Haptic feedback where supported.
- Dark instrument visual style inspired by ancient-tech fantasy while remaining original.

### 2.2 Out of Scope for MVP

- Native iOS or Android apps.
- Required WebXR AR anchors.
- Automatic distance or depth estimation.
- Turn-by-turn map navigation.
- User accounts.
- Cloud sync.
- Social sharing.
- Multiplayer beacon placement.
- Demo-only sample beacon or reset flows.
- Dedicated settings screen.
- Indoor precision positioning.
- Copyrighted Zelda names, UI, glyphs, sounds, fonts, colors, or direct visual assets.

### 2.3 Primary Operating Environment

- Primary target: Android Chrome on a modern smartphone.
- Primary usage mode: installed PWA in portrait orientation.
- Secondary targets: iOS Safari and other modern mobile browsers where feasible.
- Network access: allowed for the MVP demo.
- Offline robustness: not required for MVP.

## 3. Definitions

- Anchor: The stored geographic coordinate representing a beacon's ground position.
- Beacon: A saved or previewed vertical marker rendered in the camera overlay.
- Confidence: The app's estimate of whether location and heading data are trustworthy.
- Drawer: The compact panel used to view and manage saved beacons.
- Heading: The compass direction the device is facing, in degrees.
- Off-screen indicator: A lightweight cue showing that a beacon is outside the current camera view.
- Preview beacon: A temporary full beacon shown before placement confirmation.
- Stability: A UI state derived from sensor availability, drift, and recent readings.

## 4. Requirement Priorities

- P0: Required for MVP.
- P1: Expected for a polished MVP unless blocked by platform constraints.
- P2: Stretch or future-facing requirement.

## 5. Functional Requirements

### REQ-001: Installable PWA

Priority: P0

User story: As a mobile user, I want to install Sky Beacon as a PWA so I can launch it like a dedicated outdoor tool during demos and real use.

Acceptance criteria:

- Given a supported mobile browser, when the user opens the app, then the browser recognizes it as installable.
- Given the app is installed, when the user launches it from the device launcher, then it opens to the Sky Beacon experience.
- Given the app is opened in a normal browser tab, when PWA install mode is unavailable, then the core app still runs as a fallback.
- The app includes a valid web app manifest.
- The app includes app icons sized for common PWA install surfaces.
- The app registers a service worker where required for installability.
- The app uses a custom icon and splash styling consistent with the dark instrument theme.

### REQ-002: First-Run Tutorial

Priority: P0

User story: As a first-time user, I want a short explanation before the camera opens so I understand that the app works outdoors with approximate GPS and compass anchoring.

Acceptance criteria:

- Given the user has not completed onboarding, when the app launches, then a brief tutorial appears before the camera experience.
- The tutorial explains that Sky Beacon is outdoor-first.
- The tutorial explains that placement is approximate and depends on GPS and compass data.
- The tutorial previews the flow: aim, choose color, place beacon, and look back toward it.
- The tutorial includes a skip or continue path.
- Given the user completes or skips the tutorial, when they reopen the app, then the tutorial does not appear again by default.
- The tutorial is practical and concise, not a marketing landing page.

### REQ-003: Camera Permission Flow

Priority: P0

User story: As a user, I want the app to ask for camera access only when it is ready to show the camera view so the permission request feels understandable.

Acceptance criteria:

- Given the user enters the camera flow, when camera access is needed, then the app requests camera permission.
- Given camera permission is granted, when the camera stream starts, then the live camera view fills the app background.
- Given camera permission is denied, when the app cannot show the camera, then it displays a clear blocked state with recovery guidance.
- Given camera APIs are unsupported, when the app loads, then it displays an unsupported browser state rather than a blank screen.
- The camera request is not bundled with all other permissions in a single upfront batch.

### REQ-004: Location Permission Flow

Priority: P0

User story: As a user placing a beacon, I want the app to request location access when it needs my position so the beacon can be anchored near the real world.

Acceptance criteria:

- Given location is needed for placement or rendering, when the user begins the relevant flow, then the app requests location permission.
- Given location permission is granted, when a location fix is received, then the app stores latitude, longitude, accuracy when available, and timestamp in active state.
- Given location permission is denied, when the user attempts placement, then the app explains that GPS anchoring is unavailable.
- Given location data is stale or inaccurate, when the app shows status, then it marks confidence as degraded or low.
- The app does not request location before the user reaches a flow that needs it.

### REQ-005: Orientation Permission Flow

Priority: P0

User story: As a user placing directional beacons, I want the app to access device heading when needed so beacons can appear in the direction they were placed.

Acceptance criteria:

- Given the browser requires explicit orientation permission, when heading is needed, then the app shows a user-triggered permission request.
- Given orientation permission is granted, when heading data is available, then the app derives a normalized heading from 0 to less than 360 degrees.
- Given orientation permission is denied, when the camera view is active, then the app shows a degraded heading state.
- Given orientation APIs are unsupported, when the app runs, then it does not pretend to provide accurate directional anchoring.
- The app handles browser-specific compass behavior through feature detection.

### REQ-006: Progressive Permission Requests

Priority: P0

User story: As a user, I want permissions to be requested in context so I understand why camera, location, and orientation access are needed.

Acceptance criteria:

- Camera, location, and orientation are not requested all at once on first page load.
- Each permission request is preceded or accompanied by UI text explaining its purpose.
- Denying one permission does not crash the app.
- The app preserves as much functionality as possible when one permission is denied.
- The user can retry permission-dependent flows according to browser limitations.

### REQ-007: Live Camera View

Priority: P0

User story: As a user, I want to immediately see the world through my camera so beacon placement feels spatial and direct.

Acceptance criteria:

- Given camera permission is granted, when the camera stream starts, then the feed fills the portrait viewport.
- The camera feed remains the primary visual background.
- Overlay controls remain interactive above the feed.
- Instrument overlays do not block outdoor visibility.
- The view remains usable on common mobile viewport heights.

### REQ-008: Targeting Reticle

Priority: P0

User story: As a user aiming the app, I want a central reticle so I know where the placement preview is directed.

Acceptance criteria:

- The camera overlay includes a central targeting reticle or placement indicator.
- The reticle stays centered during normal camera use.
- The reticle remains visible against bright skies, dark environments, and busy backgrounds.
- The reticle does not obscure too much of the camera feed.

### REQ-009: Sensor Readiness and Status

Priority: P0

User story: As a user, I want to see whether the app has enough sensor data so I know how much to trust placement and beacon direction.

Acceptance criteria:

- The app displays anchor readiness.
- The app displays current heading when available.
- The app displays confidence or stability state.
- The app distinguishes ready, degraded, low-confidence, and unavailable states.
- The app avoids implying exact precision when sensor data is approximate.
- Status indicators remain compact and readable over the camera view.

### REQ-010: Contextual Calibration Prompt

Priority: P1

User story: As a user with poor heading accuracy, I want a small calibration prompt only when needed so I can improve accuracy without being blocked.

Acceptance criteria:

- Given heading readings appear unstable or unavailable, when the camera view is active, then the app may show a concise calibration prompt.
- Given heading readings are stable, when the camera view is active, then no calibration prompt is shown.
- Calibration is never a mandatory step for using the MVP.
- The prompt does not block placement if approximate placement is still possible.

### REQ-011: Start Beacon Preview

Priority: P0

User story: As a user, I want to preview a beacon before saving it so I can understand what will be placed.

Acceptance criteria:

- Given the user taps the placement action, when sensor state is sufficient or degraded-but-usable, then the app enters preview mode.
- Preview mode shows a temporary full beacon in the current facing direction.
- Preview mode displays controls for color selection and confirmation.
- Preview mode includes a cancel path that exits without saving.
- The preview remains visually distinct from saved beacons.

### REQ-012: 100-Meter Beacon Anchor Calculation

Priority: P0

User story: As a user confirming placement, I want the app to place the beacon approximately 100 meters ahead of me so the marker corresponds to the direction I aimed.

Acceptance criteria:

- Given current latitude, longitude, and heading are available, when the user confirms placement, then the app calculates a destination coordinate 100 meters ahead.
- The calculation accepts latitude, longitude, heading in degrees, and distance in meters.
- The heading wraps correctly around 0 and 360 degrees.
- The calculation accounts for Earth's curvature sufficiently for short-distance placement.
- The saved beacon stores the destination latitude and longitude.
- If required location or heading data is completely unavailable, the app prevents saving and explains why.

### REQ-013: Manual Beacon Color Selection

Priority: P0

User story: As a user, I want to choose a beacon color before saving so I can distinguish my markers.

Acceptance criteria:

- Preview mode includes a curated palette of exactly 5 colors.
- The user can change the preview beacon color before confirming placement.
- The selected color is saved with the beacon.
- Palette colors are visually distinct from each other.
- Palette colors remain readable against outdoor camera backgrounds.
- The default cyan accent may be one palette color if UI status colors remain distinguishable.

### REQ-014: Confirm or Cancel Placement

Priority: P0

User story: As a user, I want to confirm or cancel placement so beacons are saved intentionally.

Acceptance criteria:

- Given preview mode is active, when the user confirms, then the app saves the beacon.
- Given preview mode is active, when the user cancels, then no beacon is saved.
- A saved beacon appears immediately in the camera overlay after confirmation.
- Confirmation exits preview mode.
- Cancellation exits preview mode and returns to the normal camera view.

### REQ-015: Beacon Limit

Priority: P0

User story: As a user, I want the app to limit saved beacons so the camera view remains clean and readable.

Acceptance criteria:

- The app supports a maximum of 3 active saved beacons.
- Given the user has 0, 1, or 2 beacons, when they confirm placement, then the new beacon is saved.
- Given the user has 3 beacons, when they try to place another, then the app does not silently save a fourth beacon.
- The camera overlay remains readable with 3 saved beacons.

### REQ-016: Replacement Flow at Beacon Limit

Priority: P0

User story: As a user with 3 saved beacons, I want to choose which existing beacon to replace so I stay in control of my markers.

Acceptance criteria:

- Given the user already has 3 saved beacons, when they attempt another placement, then the app asks whether to replace an existing beacon.
- Replacement selection happens in the beacon drawer using the existing beacon list.
- The app does not silently overwrite a beacon.
- Given the user selects a beacon to replace and confirms, then the new beacon replaces the selected beacon.
- Given the user cancels replacement, then existing beacons remain unchanged.

### REQ-017: Generated Beacon Names

Priority: P0

User story: As a user, I want new beacons to receive simple default names so I can identify them without typing during placement.

Acceptance criteria:

- New beacons receive generated names using the format `Beacon 01`, `Beacon 02`, or `Beacon 03`.
- Generated names correspond to available slots or active beacon count in a predictable way.
- Generated names appear in the beacon drawer.
- Generated names can be edited after placement.
- Empty custom names are rejected or replaced with a valid generated name.

### REQ-018: Low-Confidence Placement

Priority: P0

User story: As a user, I want to place a beacon even when GPS or compass confidence is weak so I can still use the app while understanding that accuracy may be poor.

Acceptance criteria:

- Given GPS or heading confidence is weak but required data exists, when the user enters preview or confirms placement, then the app shows a clear low-confidence warning.
- Low confidence does not block placement by itself.
- Saved beacons include confidence metadata from placement.
- Low-confidence beacon rendering is visually softened, marked, or otherwise distinguished.
- The app does not claim precise placement when confidence is weak.

### REQ-019: Placement Feedback

Priority: P1

User story: As a user, I want immediate feedback after placement so I know whether the beacon was saved.

Acceptance criteria:

- Successful placement triggers immediate visual feedback.
- Successful placement triggers an animation or state change in the beacon overlay.
- Failed placement shows a clear reason.
- Haptic feedback is used on supported devices and browsers.
- Unsupported haptics do not produce errors or block placement.

### REQ-020: Directional Beacon Rendering

Priority: P0

User story: As a user, I want placed beacons to appear when I look back toward their anchored direction so I can relocate points of interest through the camera.

Acceptance criteria:

- The app calculates bearing from the user's current location to each saved beacon.
- The app compares beacon bearing with current heading.
- Beacons appear horizontally based on bearing difference and estimated camera field of view.
- Beacons near heading wraparound, such as 359 degrees to 1 degree, render correctly.
- Beacons outside the estimated field of view are not drawn as if they are centered.

### REQ-021: Sky-Reaching Beacon Visual

Priority: P0

User story: As a user, I want beacons to extend upward into the sky so they are visible and recognizable from a distance.

Acceptance criteria:

- Saved and preview beacons render as luminous vertical columns.
- Beacons include a glowing base, pulse ring, rise animation, or equivalent placement cue when appropriate.
- Beacons remain visually upright.
- Beacon colors are applied consistently to the pillar and supporting visual elements.
- Beacons remain visible against bright skies, dark environments, and visually busy backgrounds.

### REQ-022: Pitch-Aware Beacon Rendering

Priority: P1

User story: As a user, I want beacons to respond when I tilt my phone upward or downward so the beacon feels like it rises into the sky.

Acceptance criteria:

- The app uses available device pitch or orientation data to adjust beacon vertical position or visible segment.
- Looking upward reveals or emphasizes upper beacon portions.
- Looking downward does not make the beacon appear inverted or detached from its anchor.
- If pitch data is unavailable, the app falls back to a stable non-pitch-aware rendering state.

### REQ-023: Conservative Obstruction Handling

Priority: P0

User story: As a city user, I do not want the app to draw beacon bases through buildings or terrain because that would make the spatial marker feel misleading.

Acceptance criteria:

- The MVP does not render an obstructed ground base as if it is clearly visible.
- If reliable obstruction data is unavailable, the lower beacon portion is clipped, faded, hidden, or visually implied.
- The app may show or imply the skyward portion when the user looks in the correct direction.
- The UI avoids claiming exact line-of-sight accuracy.
- Obstruction handling can be approximate for MVP.

### REQ-024: Off-Screen Direction Indicator

Priority: P0

User story: As a user, I want a subtle indicator when a beacon is off-screen so I know which way to turn.

Acceptance criteria:

- Given a saved beacon is outside the current camera view, when heading is available, then the app shows a lightweight off-screen indicator.
- The indicator communicates left or right direction where possible.
- The indicator updates as heading changes.
- Multiple indicators avoid excessive clutter.
- If heading is unavailable, the indicator is hidden or marked as unreliable.

### REQ-025: Beacon Styling by Distance and Confidence

Priority: P1

User story: As a user, I want beacon visuals to communicate uncertainty and distance without cluttering the camera view.

Acceptance criteria:

- Low-confidence beacons are visually distinct from high-confidence beacons.
- Distant or peripheral beacons scale, fade, simplify, or otherwise reduce visual dominance.
- Styling changes do not make beacons impossible to identify.
- The MVP does not show precise distance in the camera overlay unless accuracy is validated.

### REQ-026: No Misleading Distance Display

Priority: P0

User story: As a user, I do not want the app to show fake precision, such as exact distances, when the system cannot measure them reliably.

Acceptance criteria:

- The camera overlay does not show precise beacon distance by default.
- If distance appears anywhere in the MVP, it is clearly approximate or limited to contexts where accuracy is acceptable.
- The app prioritizes direction and confidence over exact distance.

### REQ-027: Beacon Drawer

Priority: P0

User story: As a user, I want a compact drawer listing my saved beacons so I can manage them without leaving the camera experience.

Acceptance criteria:

- The camera view includes an affordance to open the beacon drawer.
- The drawer lists up to 3 saved beacons.
- Each beacon row shows its color and name.
- The drawer supports selection, rename, recolor, delete, replacement selection, and clear-all access.
- The drawer can be dismissed to return to the camera-first view.
- The drawer remains compact and does not need to show distance or direction for each beacon in the MVP.

### REQ-028: Select Beacon

Priority: P0

User story: As a user, I want to select a beacon so I can understand which marker I am editing or inspecting.

Acceptance criteria:

- Users can select an existing beacon from the drawer.
- The selected beacon state is visible in the drawer.
- The selected beacon state is visible or reflected in the camera overlay when practical.
- Selecting a beacon does not change its anchor coordinate.

### REQ-029: Rename Beacon

Priority: P0

User story: As a user, I want to rename a beacon so important markers are easier to remember.

Acceptance criteria:

- Users can edit a beacon name from the drawer or selected beacon controls.
- The renamed value appears in the drawer.
- The renamed value persists locally.
- Empty names are rejected or replaced with a valid generated name.
- Renaming does not alter beacon coordinates, color, or confidence metadata.

### REQ-030: Edit Beacon Color

Priority: P1

User story: As a user, I want to change a beacon's color after placement so I can keep my markers distinguishable.

Acceptance criteria:

- Users can edit a selected beacon's color from the drawer or selected beacon controls.
- Color edits use the same curated 5-color palette as placement.
- The updated color appears in the camera overlay.
- The updated color appears in the drawer.
- The updated color persists locally.

### REQ-031: Delete Beacon

Priority: P0

User story: As a user, I want to delete a beacon I no longer need so the camera view stays clean.

Acceptance criteria:

- Users can delete a selected beacon.
- Single-beacon deletion happens immediately without a confirmation modal.
- Deleted beacons disappear from the drawer.
- Deleted beacons disappear from the camera overlay.
- Deletion does not affect other saved beacons.

### REQ-032: Undo Single Delete

Priority: P1

User story: As a user, I want a short undo option after deleting a beacon so an accidental deletion is recoverable.

Acceptance criteria:

- After a single beacon deletion, the app shows a short-lived undo option.
- Activating undo restores the deleted beacon.
- The restored beacon keeps its previous name, color, coordinate, and confidence metadata.
- The undo option expires automatically.
- Undo is not required for clear-all deletion.

### REQ-033: Clear All Beacons

Priority: P0

User story: As a user, I want to clear all beacons when I am done with a session, but only after confirming so I do not lose markers accidentally.

Acceptance criteria:

- The bottom of the beacon drawer includes a clear-all-beacons action.
- Activating clear all asks for confirmation.
- Confirming clear all removes all saved beacons.
- Canceling clear all leaves all saved beacons unchanged.
- After clear all, the camera overlay shows no saved beacons.

### REQ-034: Local Beacon Persistence

Priority: P0

User story: As a user, I want my beacons to remain after closing and reopening the app so I can return to saved markers on the same device.

Acceptance criteria:

- Saved beacons persist locally between app sessions.
- Beacon names persist locally.
- Beacon colors persist locally.
- Beacon coordinates persist locally.
- Beacon confidence metadata persists locally.
- Closing and reopening the installed PWA reloads saved beacons automatically.
- No user account or cloud sync is required.

### REQ-035: Storage Error Handling

Priority: P0

User story: As a user, I want the app to handle storage problems clearly so I understand when my beacon may not have been saved.

Acceptance criteria:

- If a save fails, the app shows a clear message.
- If stored records are corrupt, the app ignores, repairs, or safely reports them without crashing.
- Storage failures do not produce an unrecoverable blank screen.
- The app preserves in-memory state during recoverable storage errors where possible.

### REQ-036: Beacon Data Model

Priority: P0

User story: As a developer, I want a consistent beacon data model so placement, rendering, persistence, and future map features use the same records.

Acceptance criteria:

- Each saved beacon includes `id`, `name`, `latitude`, `longitude`, `color`, `createdAt`, and `confidence`.
- Each saved beacon should include `updatedAt`, `placementHeading`, `placementDistanceMeters`, `locationAccuracyMeters`, and `headingAccuracy` when available.
- Beacon `id` values are stable local identifiers.
- Latitude values are finite numbers from -90 to 90.
- Longitude values are finite numbers from -180 to 180.
- Heading values are normalized from 0 to less than 360 degrees.
- Beacon color values match one of the curated palette options.
- Beacon names are non-empty after trimming.

### REQ-037: First-Run State Persistence

Priority: P0

User story: As a returning user, I want the app to remember that I finished onboarding so I can return directly to the camera experience.

Acceptance criteria:

- Tutorial completion or skip state persists locally.
- Given onboarding is complete, when the user reopens the app, then the app does not show onboarding by default.
- Clearing app storage may reset onboarding state.
- Onboarding state storage errors do not block core camera use.

### REQ-038: Dark Instrument Visual System

Priority: P0

User story: As a user, I want the interface to feel like a mysterious scanning instrument rather than a standard map app.

Acceptance criteria:

- The interface uses an obsidian or dark surface palette.
- The default UI theme uses luminous cyan accents.
- Panels use translucent glass, blur, thin borders, and restrained glow where supported.
- The UI may include scan lines, grid textures, reticle brackets, and subtle pulsing.
- Labels and readouts use compact technical styling.
- The app uses original visual language and does not copy existing game UI assets.

### REQ-039: Thumb-Accessible Controls

Priority: P1

User story: As a mobile user, I want primary actions within thumb reach so I can use the app comfortably outdoors.

Acceptance criteria:

- Primary placement and confirmation controls are located in a bottom action area.
- Secondary controls do not crowd the primary action.
- Controls remain tappable on common phone screen sizes.
- Text and icons do not overlap at supported portrait viewport widths.

### REQ-040: Outdoor Readability

Priority: P0

User story: As an outdoor user, I want controls, beacons, and status text to stay readable over real camera backgrounds.

Acceptance criteria:

- Primary controls remain visible against bright sky backgrounds.
- Primary controls remain visible against dark backgrounds.
- Status indicators remain readable over visually busy scenes.
- Beacon colors remain distinguishable from each other.
- Overlay effects are subtle enough not to obscure the camera feed.

### REQ-041: Safe Outdoor Use

Priority: P1

User story: As a user outdoors, I want the app to keep interactions brief so I can stay aware of my surroundings.

Acceptance criteria:

- Onboarding or appropriate UI messaging reminds users to stay aware of surroundings.
- Core placement interactions require minimal sustained attention.
- The app does not encourage use while crossing streets, entering private property, or ignoring hazards.
- Management actions remain concise and do not require lengthy forms.

### REQ-042: Performance With Three Beacons

Priority: P0

User story: As a user, I want the camera view to remain responsive with my saved beacons so the app feels reliable during a demo.

Acceptance criteria:

- The app renders up to 3 saved beacons without major interaction lag on the primary Android Chrome test device.
- Overlay animations remain smooth enough for demo use.
- Sensor updates do not cause distracting layout jumps.
- The app avoids unnecessary heavy rendering work when no beacons are visible.

### REQ-043: Startup Responsiveness

Priority: P1

User story: As a demo user, I want to place a beacon quickly after granting permissions so the app's value is clear right away.

Acceptance criteria:

- After permissions are granted, users can begin placement within 10 seconds on the primary test device.
- Loading and permission states provide visible feedback.
- The app does not leave users on a silent blank screen during startup.

### REQ-044: Geospatial Utility Functions

Priority: P0

User story: As a developer, I want geospatial calculations isolated and testable so directional rendering and placement can be verified reliably.

Acceptance criteria:

- Destination coordinate calculation is implemented as a reusable function.
- Bearing calculation is implemented as a reusable function.
- Angular difference calculation handles 0/360-degree wraparound.
- Field-of-view mapping is implemented separately from DOM or canvas rendering where practical.
- Core geospatial functions can be tested without camera access.

### REQ-045: Sensor Smoothing

Priority: P1

User story: As a user, I want beacon movement to feel stable so compass jitter does not make the overlay distracting.

Acceptance criteria:

- Minor heading jitter is smoothed enough to reduce distracting beacon movement.
- Turning the phone still updates the overlay responsively.
- Pitch smoothing, if implemented, does not make the beacon feel delayed or disconnected.
- Smoothing behavior can be tuned without rewriting beacon rendering.

### REQ-046: Separation of Core Logic

Priority: P1

User story: As a developer, I want camera UI, sensor state, geospatial math, storage, and rendering separated so future improvements are easier to make.

Acceptance criteria:

- Camera stream handling is not tightly coupled to beacon storage.
- Beacon storage is not tightly coupled to visual theme implementation.
- Geospatial calculations are not embedded only inside UI event handlers.
- The saved beacon model can be reused by a future map view.

### REQ-047: Theme Extensibility

Priority: P2

User story: As a product designer, I want the visual theme to be extensible so future sci-fi and fantasy themes can reuse the same app logic.

Acceptance criteria:

- Theme values are centralized or otherwise easy to modify.
- Changing theme colors does not require rewriting beacon placement logic.
- Changing panel or typography styling does not require changing beacon persistence.
- The default MVP theme remains polished even if additional themes are not implemented.

### REQ-048: Optional Map View

Priority: P2

User story: As a user, I may want a map view to place or adjust beacons more precisely when camera-only placement is not enough.

Acceptance criteria:

- If implemented, the map view is accessible without replacing the camera-first flow.
- Map-created beacons use the same data model as camera-created beacons.
- Map-adjusted beacons render correctly in the camera overlay.
- The 3-beacon limit still applies to map-created beacons.
- The replacement flow still applies when the beacon limit is reached.

### REQ-049: Optional WebXR Enhancement

Priority: P2

User story: As a future user on a capable device, I may want more precise AR anchoring so beacons feel more spatially grounded.

Acceptance criteria:

- WebXR AR anchors are not required for MVP functionality.
- If WebXR is added later, it is implemented as progressive enhancement.
- Non-WebXR browsers retain GPS and heading-based behavior.
- WebXR-specific code does not break the baseline PWA experience.

## 6. Data Requirements

### DATA-001: Saved Beacon Record

Priority: P0

User story: As a developer, I want every beacon record to contain the fields needed for display, storage, and directional rendering.

Acceptance criteria:

- Each beacon record contains the required fields listed below.
- Optional fields are saved when available and omitted or set to null when unavailable.
- Invalid records are not allowed to crash the app.

Required fields:

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Stable unique local identifier. |
| `name` | string | Generated or user-edited display name. |
| `latitude` | number | Anchor latitude in decimal degrees. |
| `longitude` | number | Anchor longitude in decimal degrees. |
| `color` | string | Curated palette color identifier or value. |
| `createdAt` | string or number | Creation timestamp. |
| `confidence` | string | Placement confidence, such as `high`, `medium`, `low`, or `unknown`. |

Recommended fields:

| Field | Type | Description |
| --- | --- | --- |
| `updatedAt` | string or number | Last edit timestamp. |
| `placementHeading` | number | Heading used when the beacon was placed. |
| `placementDistanceMeters` | number | MVP default is 100. |
| `locationAccuracyMeters` | number | GPS accuracy at placement if available. |
| `headingAccuracy` | number or string | Heading accuracy or quality state if available. |

### DATA-002: Persisted App State

Priority: P0

User story: As a returning user, I want the app to remember only the local state needed for the MVP so it stays lightweight and private.

Acceptance criteria:

- The app persists saved beacons.
- The app persists tutorial completion or skip state.
- The app may persist last selected beacon id.
- The app does not require account identifiers for MVP state.
- The app does not require server-backed state for MVP state.

## 7. Non-Functional Requirements

### NFR-001: Privacy

Priority: P0

User story: As a user, I want my beacon locations to stay on my device so I can use the MVP without creating an account or sharing data.

Acceptance criteria:

- Beacon coordinates are stored locally for the MVP.
- Beacon coordinates are not transmitted to a backend for core MVP behavior.
- No account is required.
- No cloud sync is required.
- Permission needs are explained before or during requests.

### NFR-002: Reliability

Priority: P0

User story: As a user, I want the app to recover gracefully from denied permissions, unsupported APIs, and bad sensor data.

Acceptance criteria:

- Camera failure shows a recoverable blocked or unsupported state.
- Location failure shows a clear degraded or blocked state.
- Orientation failure shows a clear degraded heading state.
- Storage failure shows a clear save or load problem state.
- No known failure mode results in an unrecoverable blank screen.

### NFR-003: Browser Compatibility

Priority: P1

User story: As a user on a modern phone, I want the app to work as well as my browser capabilities allow.

Acceptance criteria:

- Android Chrome receives priority testing.
- Installed Android Chrome PWA mode is tested.
- Android Chrome regular tab mode is tested.
- iOS Safari is tested where available.
- Missing haptics, orientation quirks, or install limitations degrade gracefully.

### NFR-004: Maintainability

Priority: P1

User story: As a developer, I want the implementation to be modular so future features like maps, themes, and WebXR can be added safely.

Acceptance criteria:

- Geospatial math is reusable outside the camera view.
- Beacon storage uses a clear schema.
- UI theme values are separate from beacon data.
- Sensor state can be inspected without reading rendering code.
- Future map placement can reuse the same beacon data model.

## 8. MVP Acceptance Summary

The MVP is accepted when:

- A user can install or open the app as a PWA.
- A first-time user sees and can skip a concise tutorial.
- Permissions are requested progressively.
- The app opens into a live camera view with a reticle and instrument overlay.
- The app shows heading, readiness, stability, and confidence state.
- The user can preview a full beacon, choose one of 5 colors, and confirm placement.
- Confirmed placement stores a beacon approximately 100 meters ahead.
- The app supports up to 3 saved beacons and handles replacement intentionally.
- Saved beacons render directionally in the camera overlay.
- Off-screen direction indicators appear when useful.
- Beacon visuals avoid misleading obstruction and distance precision.
- The drawer supports selection, rename, recolor, delete, undo delete, and clear all with confirmation.
- Saved beacons persist locally after reopening the app.
- Low-confidence states are visible but do not block approximate placement when required data exists.
- The app remains readable and responsive on the primary Android Chrome test device.

## 9. Verification Plan

### 9.1 Manual Test Scenarios

1. Fresh install and first launch.
2. Complete tutorial and verify it does not reappear on relaunch.
3. Skip tutorial and verify it does not reappear on relaunch.
4. Grant camera permission and verify live camera view.
5. Deny camera permission and verify blocked state.
6. Grant location permission and verify readiness status updates.
7. Deny location permission and verify placement is blocked or degraded with explanation.
8. Grant orientation permission where required and verify heading appears.
9. Deny orientation permission and verify degraded heading state.
10. Start placement preview and verify a full temporary beacon appears.
11. Change beacon color before confirmation.
12. Confirm placement and verify the beacon appears immediately.
13. Cancel placement and verify no beacon is saved.
14. Place 3 beacons and verify the drawer and overlay remain readable.
15. Attempt a fourth placement and verify replacement flow.
16. Rename a beacon and verify persistence after relaunch.
17. Recolor a beacon and verify persistence after relaunch.
18. Delete a beacon and restore it with undo.
19. Delete a beacon and allow undo to expire.
20. Clear all beacons and verify confirmation is required.
21. Turn toward and away from a beacon and verify directional rendering.
22. Verify off-screen indicator behavior.
23. Pitch the phone upward and downward and verify beacon vertical behavior where supported.
24. Test low-confidence GPS or heading state and verify warning behavior.
25. Close and reopen the installed PWA and verify saved beacons load.

### 9.2 Device and Browser Matrix

Minimum MVP testing:

- Android Chrome on the primary demo phone.
- Android Chrome installed PWA mode.
- Android Chrome regular browser tab.

Recommended additional testing:

- iOS Safari where available.
- A second Android device with different sensor behavior.
- Desktop browser for non-camera layout and storage sanity checks.

### 9.3 Success Metrics

- Users can place a beacon within 10 seconds after permissions are granted.
- At least 90% of successful placements show immediate visual confirmation during testing.
- The app renders up to 3 saved beacons without major performance issues.
- A camera-placed beacon appears in the correct general direction when the user turns back toward it.
- Locally saved beacons remain available after closing and reopening the installed PWA.
- Demo viewers understand the product concept within the first minute.

## 10. Traceability Matrix

| PRD Area | SRS Items |
| --- | --- |
| PWA foundation | REQ-001, REQ-003, REQ-006, NFR-003 |
| Onboarding | REQ-002, REQ-037 |
| Camera view | REQ-003, REQ-007, REQ-008, REQ-038, REQ-039, REQ-040 |
| Location and orientation | REQ-004, REQ-005, REQ-009, REQ-010, REQ-045 |
| Beacon placement | REQ-011 through REQ-019, REQ-044 |
| Beacon visibility | REQ-020 through REQ-026 |
| Beacon management | REQ-027 through REQ-033 |
| Persistence | REQ-034, REQ-035, REQ-037, DATA-002 |
| Data model | REQ-036, DATA-001 |
| Visual and interaction design | REQ-038 through REQ-041 |
| Performance and reliability | REQ-042, REQ-043, NFR-002 |
| Maintainability | REQ-044, REQ-046, REQ-047, NFR-004 |
| Map stretch goal | REQ-048 |
| Future WebXR enhancement | REQ-049 |
| Privacy | NFR-001 |

## 11. Future Enhancements

- Map view for beacon placement and adjustment.
- Multiple themes, starting with sci-fi and fantasy variants.
- Automatic distance estimation.
- More precise geospatial anchoring.
- WebXR or native AR support.
- User accounts and cloud sync.
- Shared group beacons.
- Beacon icons, notes, folders, and richer metadata.
- Compass or mini-radar view.
- Route guidance toward selected beacons.
- Photo attachments.
- Weather-aware beacon visuals.
- Sound feedback and audio design.

