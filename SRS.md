# Software Requirements Specification: Sky Beacon Camera App

Version: 1.4
Source: [PRD.md](PRD.md)
Date: 2026-06-19

## 1. Purpose

This Software Requirements Specification defines the MVP requirements and post-MVP anchoring direction for Sky Beacon, an outdoor-first progressive web app that lets users place GPS-backed, sky-reaching beacons through a live camera interface.

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

### 2.4 Post-MVP Anchoring Direction

The next major product phase should move beyond the fixed 100-meter-ahead MVP placement model. Fixed-distance camera placement may remain useful as a quick draft flow, but durable beacons should represent the intended real-world location through a camera-first experience. Accurate post-MVP placement should not require traditional map interaction in the primary flow.

Future agents must understand the beacon as a vertical world marker with two related concepts: a durable ground/base anchor and a skyward visible column. The long-term product goal is for a beacon to remain accurate and durable even when the base is hidden behind terrain, trees, buildings, or other obstructions. In that situation, the app should not draw the hidden base as if it were visible; it should preserve the anchor and show, fade, clip, or imply only the visible skyward portion as the selected route can support.

The recommended next direction is a dual-track path: keep the existing PWA as the short-term shareable demo and product-learning surface, while validating Google ARCore Geospatial as the first serious proof of accurate camera-based anchoring. Geoapify or equivalent map/location providers may enrich anchors with address, place, route, or nearby-context metadata after provider approval, but they must not be treated as the primary placement-accuracy system. Backend or service-side map/geospatial cross-reference may confirm, reject, enrich, or suggest corrections to draft anchors only after route and provider approval. A visible map view is a possible separate feature for inspection, browsing, confirmation, and adjustment, but it is not the required placement path.

The first selected implementation slice is the Phased Core PWA Upgrade. The PWA should become a convincing concept demo that approaches the final product feeling within browser limits: larger and more sky-reaching beacon visuals, pitch-aware vertical behavior, better off-screen guidance, conservative obstruction cues, and clear confidence/provenance language. This first implementation spec should include the local PWA phases for visual scale/verticality, pitch behavior, conservative base hiding, off-screen guidance, confidence/provenance UI, and backward-compatible anchor model groundwork. Later PWA improvements may add map-backed metadata, hidden geospatial cross-reference, visible map inspection, or browser-accessible geospatial AR/VPS-like capabilities only after the relevant provider/platform evidence and approval gates are satisfied.

For the first PWA concept-demo upgrade, placement should be ground/base-oriented. The user should be asked to aim at the intended beacon base or ground target, then preview and confirm a skyward column rising from that approximate base anchor. This does not mean the PWA has proven the exact ground plane, depth, or line of sight; it is an honest browser-limited interaction model that prepares the product for later AR/depth-based ground placement.

Persistence remains a route-selection decision: local-first browser storage is the easier initial path, while backend/server-side storage, hybrid local cache plus server persistence, accounts, cloud sync, or shared beacons may be selected later after product, privacy, and security review. The camera overlay, ARCore/geospatial prototype, backend/service cross-reference, metadata enrichment, any visible map view, persistence model, confidence indicators, and validation plan must all use the same anchor model.

Close-range camera recognition may be explored as a progressive enhancement for nearby beacons. It must not be treated as required baseline behavior until platform reliability, privacy, performance, and testing constraints are proven.

## 3. Definitions

- Anchor: The stored geographic coordinate representing a beacon's ground position.
- Anchor confidence: The app's estimate of whether the stored anchor represents the intended real-world location.
- Anchor provenance: Metadata describing how a beacon's location was created or refined, such as camera placement, ARCore Geospatial placement, map cross-reference, metadata enrichment, map placement, map adjustment, or visual refinement.
- ARCore Geospatial anchor: A post-MVP geospatial AR anchor created or validated through Google ARCore Geospatial or an approved equivalent real spatial anchoring system.
- Beacon: A saved or previewed vertical marker rendered in the camera overlay.
- Beacon base: The lower point or ground-level origin of the beacon, tied to the durable anchor coordinate. It may be visible, hidden, clipped, or implied depending on obstruction evidence.
- Beacon column: The tall skyward visual portion rising from the beacon base. It is the main long-distance guidance cue and may remain visible even when the base is obstructed.
- Obstruction-aware rendering: Rendering that avoids showing hidden beacon portions through terrain, trees, buildings, or other occluders unless the system has evidence that those portions are visible.
- Sensor confidence: The app's estimate of whether current GPS, heading, orientation, and related device readings are trustworthy.
- Drawer: The compact panel used to view and manage saved beacons.
- Geoapify metadata enrichment: Optional post-MVP provider data that may describe the area near an anchor, such as address, place, route, or nearby-context information, but does not by itself prove camera placement accuracy.
- Heading: The compass direction the device is facing, in degrees.
- Map-confirmed anchor: A beacon coordinate that has been placed or verified through a map interaction.
- Map cross-reference: Backend or service-side validation of a beacon coordinate against map, geospatial, building, terrain, or points-of-interest data.
- Off-screen indicator: A lightweight cue showing that a beacon is outside the current camera view.
- Preview beacon: A temporary full beacon shown before placement confirmation.
- Stability: A UI state derived from sensor availability, drift, and recent readings.
- Visual refinement: A short-range camera-based signal that may improve local beacon alignment or confidence when reliable.

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
- Beacon confidence/status vocabulary uses plain source labels plus separate confidence levels. Source labels include `Approximate`, `Map-backed`, `Map-confirmed`, `AR-anchored`, and `Visually refined`; confidence levels include `High`, `Medium`, `Low`, and `Unknown`.
- Camera-view status avoids clutter. Full labels and explanations should appear only for the selected beacon, in brief warnings/status affordances, or in the drawer/selected-beacon controls.

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
- The first PWA concept-demo upgrade treats this destination coordinate as the approximate beacon base anchor derived from the user's aim at the intended ground/base target.
- The placement UI must not claim exact ground-plane, depth, terrain, building, or line-of-sight accuracy for this approximate base anchor.
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
- The selected first-slice PWA behavior is save-with-warning: weak confidence does not require retry and does not prevent saving when required data exists.
- Low confidence does not block placement by itself.
- Placement is blocked only when required location or heading data is completely unavailable or unusable.
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
- The visual design preserves the distinction between the lower beacon base and the skyward beacon column.
- A beacon is not represented as only a flat map pin, screen dot, or short marker unless a fallback state explicitly requires simplification.
- Beacons remain visually upright.
- Beacon colors are applied consistently to the pillar and supporting visual elements.
- Beacons remain visible against bright skies, dark environments, and visually busy backgrounds.

### REQ-022: Pitch-Aware Beacon Rendering

Priority: P1

User story: As a user, I want beacons to respond when I tilt my phone upward or downward so the beacon feels like it rises into the sky.

Acceptance criteria:

- The app uses available device pitch or orientation data to adjust beacon vertical position or visible segment.
- Pitch behavior is relative to the beacon's estimated bearing and vertical extent; pitch does not make a beacon visible when the camera is aimed away from it.
- Looking upward while the camera is aimed at or rotating into the beacon's bearing reveals or emphasizes upper beacon portions.
- Looking downward reveals the beacon base only when the camera is estimated to be aimed at the beacon base and conservative obstruction rules do not hide it.
- Looking straight ahead does not display the beacon base by default unless the estimated camera frame actually includes the base.
- Looking downward does not make the beacon appear inverted or detached from its anchor.
- If no part of the beacon's estimated vertical segment is inside the camera frame, the beacon itself is hidden and the off-screen indicator is used instead.
- If pitch data is unavailable, noisy, or unsupported, the app falls back to a stable heading-only rendering state that does not claim vertical precision or definite base visibility.

### REQ-023: Conservative Obstruction Handling

Priority: P0

User story: As a city user, I do not want the app to draw beacon bases through buildings or terrain because that would make the spatial marker feel misleading.

Acceptance criteria:

- The MVP does not render an obstructed ground/base anchor as if it is clearly visible.
- If reliable obstruction data is unavailable, the lower beacon portion is clipped, faded, hidden, or visually implied.
- Base visibility vocabulary uses four states: `Visible`, `Obstructed`, `Unknown`, and `Approximated`.
- `Visible` means supporting evidence or conservative rendering rules allow the base to be shown.
- `Obstructed` means supporting evidence or conservative rules indicate the base should not be drawn as visible.
- `Unknown` means the app does not have enough evidence to decide base visibility.
- `Approximated` means the PWA or selected route is making a conservative estimate without validated obstruction evidence.
- The app may show or imply the skyward portion when the user looks in the correct direction.
- The UI avoids claiming exact line-of-sight accuracy.
- Obstruction handling can be approximate for MVP.
- Long-term post-MVP routes should evaluate building, terrain, elevation, AR, or visual evidence that can make this behavior more accurate.

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
- Confidence styling does not add persistent text labels to every beacon in the camera overlay.
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

### REQ-048: Optional Post-MVP Visible Map View

Priority: P2

User story: As a user, I may want a map view to inspect, confirm, or adjust beacons when I need a precision tool separate from the camera-first placement flow.

Acceptance criteria:

- If implemented, the visible map view is accessible without replacing the camera-first flow.
- If implemented, the visible map view is treated as a full post-MVP feature rather than a temporary MVP stretch goal.
- If implemented, the visible map view is not required for the primary camera placement flow.
- If implemented, the visible map view is presented as an inspection, browsing, confirmation, or adjustment tool rather than the default product surface.
- If implemented, map-created beacons use the same data model as camera-created beacons.
- If implemented, map-adjusted beacons render correctly in the camera overlay.
- If implemented, a camera-created beacon can be opened from the map and adjusted to the intended real-world location.
- If implemented, a map-created beacon can be opened from the camera view and rendered at the correct bearing.
- If implemented, the app records whether an anchor was camera-created, map-created, or map-adjusted.
- If implemented, the UI communicates whether a beacon is approximate or map-confirmed.
- If implemented, the 3-beacon limit still applies to map-created beacons.
- If implemented, the replacement flow still applies when the beacon limit is reached.

### REQ-049: Optional WebXR Enhancement

Priority: P2

User story: As a future user on a capable device, I may want more precise AR anchoring so beacons feel more spatially grounded.

Acceptance criteria:

- WebXR AR anchors are not required for MVP functionality.
- If WebXR is added later, it is implemented as progressive enhancement.
- Non-WebXR browsers retain GPS and heading-based behavior.
- WebXR-specific code does not break the baseline PWA experience.

### REQ-050: Post-MVP Close-Range Visual Refinement

Priority: P2

User story: As a user near a saved beacon, I want the camera view to refine the beacon's local alignment when recognition is reliable so the marker feels tied to the place around me.

Acceptance criteria:

- Visual refinement is optional and progressive; lack of support does not block post-MVP beacon anchoring or rendering.
- The app only uses visual refinement when camera permission is granted and the browser/device can process the signal responsively.
- The app distinguishes visual-refinement confidence from GPS, compass, and map confidence.
- Visual refinement may improve local display alignment or confidence, but it must not silently rewrite a durable anchor without an explicit product rule.
- Raw camera imagery is not persisted unless a future privacy review explicitly approves that storage.
- Recognition failures, poor lighting, or ambiguous scenes fall back to GPS/map rendering without blank states or misleading precision.

### REQ-051: Post-MVP Map Cross-Referenced Anchor Confirmation

Priority: P2

User story: As a user placing a beacon through the camera, I want the system to cross-reference the draft anchor against approved map or geospatial evidence so the app can improve confidence without pretending provider metadata proves exact camera aim.

Acceptance criteria:

- Camera-created draft anchors can be evaluated against map or geospatial data before they are treated as high-confidence durable anchors.
- Cross-reference may happen through a backend service, a provider API, or a client-side geospatial data layer approved by a future implementation RFC.
- Cross-reference results can confirm the draft coordinate, lower confidence, or suggest a corrected coordinate.
- The app records when an anchor has been map-cross-referenced separately from when a user has manually confirmed or adjusted it in the visible map view.
- The app does not silently move a user's saved beacon to a suggested correction without an explicit product rule.
- If cross-reference is unavailable, slow, or inconclusive, the app falls back to approximate camera placement with honest confidence messaging.
- Cross-reference or metadata enrichment does not claim ARCore/VPS-level placement accuracy unless an approved spatial anchoring route provides that evidence.
- Provider calls, coordinate transmission, token handling, attribution, quotas, and privacy behavior require separate provider approval before implementation.

### REQ-052: Post-MVP ARCore Geospatial Accuracy Prototype

Priority: P2

User story: As a user, I want future accurate beacon placement to work through the camera so I can place and recover markers without having to create them on a traditional map.

Acceptance criteria:

- If the post-MVP accuracy proof is pursued, Google ARCore Geospatial is the first recommended prototype route unless a later RFC accepts a stronger alternative.
- If implemented, the ARCore Geospatial prototype is isolated from the existing PWA until a platform migration or integration route is explicitly approved.
- If implemented, the prototype supports camera-based beacon placement and later recovery or re-rendering of a saved geospatial anchor in an outdoor demo location.
- If implemented, the prototype records anchor source, coordinate, altitude when available, tracking state, VPS availability when available, confidence, timestamp, and fallback reason when relevant.
- If implemented, the prototype preserves the beacon as a durable base anchor plus skyward column and documents whether base visibility or obstruction behavior is known, unknown, or approximated.
- Provisional future decision, to be confirmed in the ARCore implementation spec: the prototype should require an AR-ready state before saving or labeling a beacon as `AR-anchored`. If ARCore tracking, geospatial state, VPS/demo-location readiness, or required permissions are not good enough, it should show guidance such as move, scan, wait, or try another location rather than creating a misleading AR anchor.
- The exact AR-ready thresholds, fallback wording, and whether a separate `Approximate` PWA-style fallback is offered from the AR prototype must be confirmed before ARCore/native implementation.
- If implemented, unsupported devices, poor tracking, VPS unavailability, denied permissions, quota failures, and slow network states are handled with clear degraded or unavailable states.
- If implemented, ARCore-specific project files, SDK dependencies, Google Cloud/API setup, API keys, quotas, and native or Unity tooling are added only after explicit prototype approval.
- Raw camera imagery is not persisted unless a future privacy review explicitly approves it.
- The PWA remains a short-term demo/product shell unless a later platform decision replaces or integrates it.

### REQ-053: Post-MVP Metadata Enrichment Provider Boundary

Priority: P2

User story: As a user, I want optional map/location metadata to give useful context about a beacon while preserving honest confidence about how accurately the beacon was placed.

Acceptance criteria:

- If implemented, metadata enrichment may attach address, place, route, nearby-context, or similar information to an anchor.
- Geoapify is the first recommended low-cost metadata/context provider unless a later provider RFC selects another provider.
- Metadata enrichment does not replace ARCore Geospatial or another approved spatial anchoring system for accurate camera-placement proof.
- The app distinguishes metadata-enriched anchors from ARCore-geospatial, map-cross-referenced, map-confirmed, map-adjusted, visually refined, and approximate camera anchors.
- If provider metadata is unavailable, slow, inconclusive, quota-limited, billing-disabled, or blocked by privacy settings, existing local beacon placement and rendering continue with honest degraded messaging.
- Coordinates are not sent to a third-party provider or backend unless privacy behavior, provider terms, token handling, attribution, quota, and cost posture have been approved.

### REQ-054: PWA Convincing Concept Demo Improvement Track

Priority: P1

User story: As a demo viewer or early user, I want the PWA beacons to feel much closer to the intended final skyward beacon experience even when placement remains approximate.

Acceptance criteria:

- The first post-MVP PWA implementation slice is the Phased Core PWA Upgrade: beacon visual scale/verticality, camera-frame-aware pitch response, conservative base hiding, off-screen guidance, confidence/provenance UI, and minimal backward-compatible anchor model groundwork.
- First-slice PWA placement uses a ground/base-oriented interaction: guide the user to aim at the intended base or ground target, then preview the tall column from that approximate base anchor.
- First-slice PWA confidence behavior uses save-with-warning: weak GPS, heading, or orientation confidence should produce clear warning/status treatment but should not block approximate placement when required data exists.
- First-slice PWA confidence vocabulary uses plain user-facing source labels plus separate confidence levels, but it must be shown compactly so the camera view remains readable.
- The PWA must label ground/base-oriented placement as approximate unless a later AR/depth, ARCore, map-confirmed, or other approved spatial route validates stronger accuracy.
- PWA beacons are not left as small, always-fully-visible markers when the selected scope is a concept-demo upgrade.
- The PWA clearly labels browser GPS/compass placement as approximate unless a selected spatial anchoring route provides stronger evidence.
- The PWA improvement plan preserves future compatibility with anchor provenance, map-backed metadata, hidden geospatial cross-reference, optional visible map placement, ARCore-derived anchors, and visual refinement.
- The first PWA implementation should keep data-model changes simple; richer true-to-concept anchor structures, provenance history, altitude, vertical extent, and base-visibility evidence are expected later when a selected route needs them.
- Map-backed context or hidden cross-reference is not added until provider, token, quota, privacy, attribution, caching, and fallback behavior are approved.
- AR/depth-based ground placement is a future implementation path. Browser-accessible VPS, WebXR, depth, visual positioning, or geospatial AR capabilities are treated as future research unless current platform evidence proves they are realistic and approved for implementation.
- Any PWA precision improvement degrades safely to local approximate beacons when provider, platform, sensor, or network capability is unavailable.

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
| `anchorSource` | string | How the current anchor was created, such as `camera`, `arcore-geospatial`, `metadata-enriched`, `map-cross-referenced`, `map-created`, `map-confirmed`, `map-adjusted`, or `visual-refined`. |
| `anchorConfidence` | string | User-facing confidence category for the current anchor position. |
| `anchorProvider` | string | Optional provider or system name, such as `arcore-geospatial`, `geoapify`, or another approved source. |
| `anchorProvenance` | object or array | Optional structured provenance or refinement history for future ARCore, metadata, map, or visual refinement flows. |
| `anchorAltitudeMeters` | number | Optional altitude/elevation for future ARCore, terrain, or rooftop anchoring. |
| `beaconVerticalExtentMeters` | number | Optional future representation of how high the beacon column should rise for rendering and visibility decisions. |
| `baseVisibility` | string | Selected base-visibility state: `visible`, `obstructed`, `unknown`, or `approximated`, used only when supported by the selected route. UI may present these as `Visible`, `Obstructed`, `Unknown`, and `Approximated`. |

For the first Phased Core PWA Upgrade, agents should add only minimal optional fields and pure render helpers needed for confidence/provenance display. They should not introduce a full nested anchor object, mandatory altitude fields, complete provenance history, or irreversible schema migration in this first slice.

### DATA-002: Persisted App State

Priority: P0

User story: As a returning user, I want the app to remember only the local state needed for the MVP so it stays lightweight and private.

Acceptance criteria:

- The app persists saved beacons.
- The app persists tutorial completion or skip state.
- The app may persist last selected beacon id.
- The app does not require account identifiers for MVP state.
- The app does not require server-backed state for MVP state.

### DATA-003: Anchor Provenance and Refinement History

Priority: P2

User story: As a developer and reviewer, I want anchor records to explain how a beacon location was created and refined so camera, ARCore/geospatial, metadata, map, and future recognition features remain auditable.

Acceptance criteria:

- The app can distinguish camera-created, ARCore-geospatial, metadata-enriched, map-cross-referenced, map-created, map-adjusted, and visually refined anchors.
- The app records enough metadata to explain the latest anchor confidence to the user.
- The anchor model supports future history or audit fields without breaking existing MVP records.
- The anchor model can evolve to represent altitude, vertical extent, and base visibility without making those fields mandatory for MVP records.
- The first PWA upgrade may use minimal optional fields, but later PWA stages should move toward richer anchor semantics when map-backed, ARCore-derived, visual-refined, or obstruction-aware routes require them.
- Legacy MVP records without provenance remain readable and are treated as approximate camera-created anchors.
- The persistence layer validates provenance values and ignores malformed optional refinement metadata safely.
- Metadata enrichment history is distinguishable from coordinate-changing provenance.
- Suggested coordinate corrections remain distinguishable from accepted coordinate changes.

## 7. Non-Functional Requirements

### NFR-001: Privacy

Priority: P0

User story: As a user, I want my beacon locations to stay on my device so I can use the MVP without creating an account or sharing data.

Acceptance criteria:

- Beacon coordinates are stored locally for the MVP.
- Beacon coordinates are not transmitted to a backend for core MVP behavior.
- Post-MVP provider or backend coordinate transmission requires explicit privacy and provider approval.
- No account is required.
- No cloud sync is required.
- Permission needs are explained before or during requests.
- Raw camera imagery is not persisted unless a future privacy review explicitly approves that storage.

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
- Future ARCore/geospatial prototype data can map into the same conceptual anchor model.
- Provider integrations are isolated behind adapter or service boundaries rather than embedded directly in UI rendering code.

### NFR-005: Provider and Platform Approval Boundaries

Priority: P2

User story: As a product owner, I want provider, platform, backend, and native-prototype choices to be explicit so the project does not accidentally take on cost, privacy, token, or maintenance obligations.

Acceptance criteria:

- ARCore SDK dependencies, native or Unity project files, Google Cloud/API setup, API keys, quotas, and supported-device assumptions are not introduced without explicit prototype approval.
- Geoapify, MapTiler, Mapbox, Google Maps Platform, Supabase, Firebase, public OSM services, or equivalent providers are not introduced without provider approval.
- Provider approval records pricing or free-tier posture, token handling, attribution and licensing requirements, privacy impact, quota behavior, and fallback behavior.
- Backend/server-side persistence, accounts, cloud sync, shared beacons, or hybrid local/server storage are not introduced without explicit persistence-route approval.
- Public OpenStreetMap Foundation tiles, public Nominatim, and public Overpass services are not used as production app dependencies.
- CI and automated tests do not depend on live third-party provider calls.

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

### 9.4 Post-MVP Anchoring Validation Gates

Before implementing post-MVP anchoring work:

1. Confirm whether the selected route is PWA demo improvement, ARCore Geospatial accuracy prototype, metadata enrichment, backend/service-side cross-reference, separate visible map UI, close-range visual refinement research, or deferral.
2. Confirm persistence posture: local-first browser storage, backend/server-side persistence, hybrid local cache plus server persistence, persistence research only, or deferral.
3. Confirm provider or platform posture, including setup obligations, pricing or free-tier limits, token handling, attribution, privacy impact, fallback behavior, and whether live provider calls can be mocked in tests.
4. If ARCore Geospatial is selected, confirm native or Unity route, supported device availability, Google Cloud/API setup, quota posture, demo locations, VPS availability where relevant, and manual outdoor QA plan.
5. If metadata enrichment or map cross-reference is selected, confirm that provider metadata is not presented as proof of exact camera-placement accuracy.
6. Confirm whether the selected route treats obstruction-aware base visibility as unsupported, approximated, or validated by building, terrain, elevation, AR, or visual evidence.
7. Confirm whether the selected PWA slice is visual/demo-only, local data-model groundwork, provider-backed metadata/cross-reference, optional visible map, browser geospatial AR/VPS research, or a staged hybrid.
8. Confirm `technical-specification.md` is updated or explicitly supplemented before product-code implementation begins.

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
| Maintainability | REQ-044, REQ-046, REQ-047, NFR-004, NFR-005 |
| Optional post-MVP visible map view | REQ-048, DATA-003 |
| Post-MVP map cross-reference | REQ-051, DATA-003 |
| Post-MVP ARCore/geospatial accuracy prototype | REQ-052, DATA-001, DATA-003, NFR-005 |
| Post-MVP metadata enrichment | REQ-053, DATA-001, DATA-003, NFR-001, NFR-005 |
| PWA concept demo improvement track | REQ-054, REQ-020 through REQ-026, DATA-003, NFR-005 |
| Future WebXR enhancement | REQ-049 |
| Close-range visual refinement | REQ-050, DATA-003 |
| Privacy | NFR-001 |

## 11. Future Enhancements

- ARCore Geospatial accuracy prototype for camera-based beacon placement and recovery.
- PWA demo improvements that clarify approximate anchors, provenance, and confidence.
- PWA beacon experience upgrades that make the web demo feel closer to the final skyward-column product while preserving accuracy honesty.
- Geoapify or equivalent metadata enrichment for address, place, route, or nearby context after provider approval.
- Possible separate map view for beacon inspection, placement, confirmation, and adjustment.
- Multiple themes, starting with sci-fi and fantasy variants.
- Automatic distance estimation.
- More precise geospatial anchoring through ARCore Geospatial or another approved real spatial anchoring system.
- Map cross-reference and provider metadata for anchor context, confidence, and suggested corrections.
- Future PWA precision improvements where realistic, including map-backed context and any validated browser-accessible VPS/geospatial AR route after provider/platform approval.
- More accurate obstruction-aware rendering where the beacon base can be hidden by terrain, trees, or buildings while the skyward column remains useful.
- AR/depth-based ground placement, including ARCore/native depth or browser-accessible depth/geospatial AR if proven realistic, so future implementations can validate the intended base more accurately than the first PWA approximation.
- Close-range camera recognition for nearby visual refinement.
- WebXR or native AR support.
- User accounts and cloud sync.
- Shared group beacons.
- Beacon icons, notes, folders, and richer metadata.
- Compass or mini-radar view.
- Route guidance toward selected beacons.
- Photo attachments.
- Weather-aware beacon visuals.
- Sound feedback and audio design.
