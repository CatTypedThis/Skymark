# Product Requirements Document: Sky Beacon Camera App

## 1. Overview

Sky Beacon is an outdoor-first progressive web app that lets users look through their device camera and place tall, sky-reaching beacons into the world. These beacons act as visible spatial markers, helping users tag, remember, and navigate toward points of interest through a camera-first interface.

Conceptually, each beacon has a durable ground/base anchor and a tall visible column that rises far into the sky. The long-term product goal is not merely to store a coordinate or draw a flat pin. The beacon should feel like a real vertical marker: its base belongs to a specific real-world place, while its upper skyward portion can remain useful even when the base is partially hidden by terrain, trees, buildings, or other obstructions.

The experience is inspired by the feeling of using the Sheikah Slate from *The Legend of Zelda: Breath of the Wild*: mystical, exploratory, spatial, and tool-like. The app should evoke that sense of discovery while maintaining an original visual identity.

## 2. Core Feature

Users open the PWA, grant camera, location, and orientation permissions, aim their phone outdoors, preview a beacon in the direction they are facing, and confirm placement. For the MVP, confirmation places a beacon approximately 100 meters ahead using GPS location and compass/device orientation. The beacon extends vertically upward and remains visible through the camera when the user looks back toward its anchored direction.

Long term, the product should move beyond fixed-distance placement toward beacons whose anchors represent the intended real-world location through a camera-first experience. Accurate placement should not require traditional map interaction in the primary flow. The recommended next direction is a dual-track path: keep the existing PWA as the short-term shareable demo and product-learning surface, while validating Google ARCore Geospatial as the first serious proof of accurate camera-based anchoring. Map/location providers such as Geoapify may enrich anchors with address, place, route, or nearby-context metadata, but they should not be treated as the primary placement-accuracy system. A visible map view may still become a separate feature for inspection, browsing, manual confirmation, or adjustment, but it is not the required placement path.

## 3. Product Goals

- Deliver a polished PWA proof of concept that works reliably on most modern phones.
- Allow users to place GPS-backed outdoor beacons through a camera-first experience.
- Make beacons visually recognizable from a distance through the camera.
- Support a small number of persistent markers without cluttering the camera view.
- Demonstrate strong product, frontend, geospatial, and interaction design ability for job and investor demos.
- Establish a visual language inspired by ancient-tech fantasy without copying existing game assets.
- Evolve the product from an MVP fixed-distance prototype into a more accurately anchored spatial tool where beacon anchors represent intentional real-world locations.
- Preserve camera-first placement as the primary product surface, including for future accurate anchoring work.
- Preserve the beacon concept as a durable ground/base anchor plus a far-rising skyward column, not a flat map pin or simple screen marker.
- Treat the PWA as a convincing concept demo during parallel native/AR work, not as a throwaway placeholder; it should move as close to the final product feeling as browser constraints allow.
- Validate Google ARCore Geospatial as the first serious accuracy prototype for real camera-based placement and recovery.
- Keep the PWA available as the short-term demo/product shell while native or ARCore feasibility is tested separately.
- Use map/geospatial cross-referencing or provider metadata as possible support layers even when the user is not looking at a visible map.
- Treat Geoapify or equivalent providers as metadata/context sources unless a later provider RFC approves a different role.
- Evaluate a visible map view as a possible separate post-MVP feature for browsing, confirming, and adjusting beacons.
- Treat local-first storage as the easier initial persistence path while leaving backend/server-side persistence, cloud sync, and shared beacons open for future route selection.
- Explore close-range camera recognition as a progressive enhancement for refining nearby beacon alignment without making it a baseline requirement.

## 4. MVP Positioning

The MVP should prioritize reliable polish over narrow technical spectacle. Real-world anchoring remains integral to the concept, but for the first version it should be implemented with broadly available web capabilities rather than requiring WebXR AR anchors.

The MVP should be honest about approximate accuracy. If GPS or compass confidence is weak, the interface should allow placement but show a visible low-confidence warning through status text, confidence indicators, or softer beacon rendering.

Selected first-slice confidence behavior: the PWA should save approximate beacons with a warning by default. It should not require retry or block placement merely because confidence is weak; it should block only when required location or heading data is completely unavailable.

## 5. Non-Goals

- Native iOS or Android apps are not required for the first version.
- Replacing the PWA with a native app is not approved without a separate platform decision.
- WebXR AR anchors are not required for the MVP.
- ARCore Geospatial is not required for the MVP and should not be added to product code without explicit prototype approval.
- Automatic distance/depth estimation is not required for the MVP.
- Full turn-by-turn map navigation is not required for the MVP.
- Traditional map interaction must not be required for the primary camera placement flow unless the product direction is explicitly changed.
- Geoapify, MapTiler, Mapbox, Google Maps Platform, Supabase, Firebase, or equivalent provider integrations are not approved without separate provider, cost, token, attribution, and privacy decisions.
- Third-party OAuth, social sign-in, and shared beacon libraries are not required for the MVP.
- Social sharing and multiplayer beacon placement are not required for the MVP.
- Demo-only sample beacon or reset flows are not required for the MVP; the app should use the normal user flow.
- A dedicated settings screen is not required for the MVP.
- Indoor precision positioning is not a first-version requirement.
- The app should not use copyrighted Zelda names, UI, glyphs, sounds, or direct visual assets.

## 6. Target Users

- Explorers and hikers who want to mark visible outdoor points of interest.
- Urban users who want to remember landmarks, meeting spots, or routes.
- AR and geospatial technology enthusiasts looking for a playful spatial tool.
- Fans of fantasy adventure interfaces who enjoy immersive utility apps.
- Potential employers or investors evaluating the creator's product and engineering ability.

## 7. User Stories

- As a user, I want to open the PWA and immediately see the world through my camera so I can place a beacon without setup friction.
- As a user, I want to aim through the camera, preview a beacon, and confirm placement 100 meters ahead in the direction I am facing.
- As a user, I want beacons to extend upward into the sky so they are easy to spot.
- As a user, I want to place up to 3 saved beacons so I can mark several outdoor points without clutter.
- As a user, I want to choose a beacon color manually and see a generated beacon name so I can distinguish my markers.
- As a user, I want the option to rename a beacon so important markers are easier to remember.
- As a user, I want placed beacons to persist after closing and reopening the PWA so I can return to saved markers.
- As a user, I want to delete beacons I no longer need so my view stays clean.
- As a user, I want the interface to feel like a mysterious scanning instrument, not a standard map app.
- As a user, I want future accurate placement to happen through the camera so I do not have to switch into a traditional map to create a trustworthy beacon.
- As a user, I want the app to be honest when a PWA-placed beacon is only approximate so I know whether to trust it as a real-world marker.
- As a user, I may want to confirm or adjust a beacon on a map so the beacon marks the real place I intend, not just a point 100 meters ahead.
- As a user near a saved beacon, I want the camera view to help refine the beacon's apparent position when visual recognition is reliable.

## 8. Functional Requirements

### 8.1 PWA Foundation

- The app must be installable as a PWA on supported mobile browsers.
- The intended MVP experience is the installed PWA, especially for demos.
- The app may still run in-browser as a fallback, but install flow should be treated as part of the product experience.
- The app must include a web app manifest, app icons, and service worker as needed for installability.
- The MVP must include a custom app icon and splash screen in the dark instrument visual style.
- The app icon may use an abstract symbol, reticle, or instrument mark rather than a literal beacon illustration.
- Network access is acceptable for the MVP demo; robust offline use is not required.
- The app must gracefully handle unsupported or denied permissions.
- The app must request permissions progressively as each feature needs them rather than asking for everything upfront.
- The app must be optimized for portrait mobile use first.
- Android Chrome is the primary MVP test target because it is the available demo device.
- The app should use progressive enhancement to remain functional across the widest practical range of modern mobile browsers.
- Browser-specific gaps, especially around camera, orientation, compass, PWA installability, and haptics, should degrade gracefully.

### 8.2 Onboarding

- The app must include a brief first-run tutorial before the camera experience.
- The tutorial should explain that Sky Beacon is outdoor-first and uses approximate GPS/compass anchoring.
- The tutorial should preview the core flow: aim, choose color, place beacon, look back toward it.
- The tutorial should be practical and concise rather than heavily in-universe.
- The tutorial should be skippable and should not feel like a marketing landing page.

### 8.3 Camera View

- The app must launch into a live camera view.
- The app must request camera permission before showing the AR-style experience.
- The app must display a central targeting reticle or placement indicator.
- The camera view must include subtle instrument-style overlays without blocking outdoor visibility.

### 8.4 Location and Orientation

- The app must request location permission.
- The app must request device orientation or compass access where required by the browser.
- The app must show anchor readiness, heading, and confidence/status indicators.
- Confidence/status vocabulary should use plain source labels plus separate confidence levels. Source labels include `Approximate`, `Map-backed`, `Map-confirmed`, `AR-anchored`, and `Visually refined`; confidence levels include `High`, `Medium`, `Low`, and `Unknown`.
- Confidence/status labels must not clutter the camera view. The camera overlay should use compact selected-beacon status, subtle visual treatment, brief warnings, or the drawer/selected-beacon controls for fuller explanation rather than persistent text labels on every beacon.
- The app must account for GPS drift, compass noise, and unavailable sensor data.
- The app should not require a mandatory calibration step before use.
- The app should show contextual calibration prompts only when heading or orientation accuracy appears poor.

### 8.5 Beacon Placement

- The user must be able to place a beacon from the camera view.
- For MVP, the app must calculate the beacon coordinate approximately 100 meters ahead of the user's current GPS location in the current compass direction.
- For the first PWA concept-demo upgrade, the placement UX should be ground/base-oriented: ask the user to aim at the intended beacon base or ground target, then preview the skyward column rising from that approximate base anchor.
- Ground/base-oriented PWA placement must be described as approximate because browser GPS, compass, and pitch signals do not prove the exact ground plane, terrain contact point, depth, or line of sight.
- Placement must use a confirmation step: the user previews the intended beacon, then confirms before it is saved.
- The preview should render as a full temporary beacon rather than only a ghost or outline.
- The app must support up to 3 saved beacons.
- If the user already has 3 saved beacons and tries to place another, the app should ask whether to replace an existing beacon.
- Replacement selection should happen in the beacon drawer using the existing beacon list.
- The user must choose and adjust the beacon color manually while previewing, before confirming placement.
- Beacon color selection should use a small curated palette of 5 colors rather than a full color picker.
- Palette colors must be visually distinct from each other and readable against outdoor camera backgrounds.
- The default cyan accent color may be included as one of the beacon colors, as long as beacon state and UI status remain visually distinguishable.
- The app must allow placement when GPS or compass confidence is weak, but it must show a clear low-confidence warning.
- The beacon must appear immediately after placement.
- The beacon must extend vertically upward from its anchor point.
- The app should provide visual, animated, and haptic feedback when placement succeeds or fails.
- Haptic feedback should be used as progressive enhancement on devices and browsers that support it.

### 8.6 Beacon Visibility

- Beacons must remain visible through the camera when the user looks toward their anchored bearing.
- Beacons should be designed as sky-reaching columns that remain discoverable by looking upward through the camera.
- The product concept requires a beacon base anchored to the intended real-world location and a skyward column that can remain visible even when the lower portion is hidden.
- If the beacon's ground base is visible from the user's position, the full beacon should be visible by looking through the camera up and down as needed.
- Beacon visibility must avoid implying that the full beacon can be seen through buildings, terrain, or other obstructions.
- If a beacon's ground anchor is behind a building or a few blocks away on a city street, the app should show only the unobstructed skyward portion when the user looks up in the correct direction.
- The lower or ground-level portion of an obstructed beacon should be hidden, clipped, faded out, or visually implied rather than drawn through the obstruction.
- Base visibility vocabulary should use four states: `Visible`, `Obstructed`, `Unknown`, and `Approximated`. `Unknown` means the app has no reliable evidence. `Approximated` means the app is making a conservative browser-limited estimate.
- Accurate obstruction behavior is important, especially for city-street navigation, but the MVP may use approximations if dependable building, terrain, or visibility data is not readily available.
- For the MVP, obstruction handling may be approximated, but the app must not render an obstructed ground base as if it were clearly visible.
- Beacons should move horizontally in the overlay based on the user's heading relative to the beacon bearing.
- Beacons should respond to device pitch based on the camera's estimated framing of the beacon, not by using a simple "up means column, down means base" shortcut.
- Looking upward while aimed at or rotating toward the beacon's bearing should reveal or emphasize the upper skyward column.
- Looking downward should reveal the beacon base only when the camera is estimated to be aimed at the beacon's base; looking straight ahead should not show the base by default unless the base is actually within the estimated camera frame.
- If the camera is tilted or rotated so no part of the beacon is estimated to be inside the current view, the MVP should hide the beacon itself and show a lightweight off-screen direction indicator.
- If pitch data is unavailable, noisy, or unsupported, the PWA should use a stable heading-based fallback that preserves approximate guidance without claiming vertical precision or definite base visibility.
- Beacons should scale, fade, or simplify based on distance, heading confidence, and screen position.
- Beacons should be visible against bright skies, dark environments, and visually busy backgrounds.
- Beacons should remain visually upright.

### 8.7 Beacon Management

- Users must be able to select an existing beacon.
- Users must be able to delete a selected beacon.
- Users must be able to open a compact beacon list or drawer showing saved beacons.
- The beacon list or drawer must support selecting and deleting beacons.
- Deleting a beacon should happen immediately without a confirmation modal.
- After deletion, the app should show a short-lived undo option.
- The bottom of the beacon drawer should include a clear-all-beacons action.
- Clear all must require confirmation before removing all saved beacons.
- The list must show each beacon's color and generated name.
- Generated names should use the format `Beacon 01`, `Beacon 02`, and `Beacon 03`.
- Users must be able to rename beacons.
- Users should be able to edit a beacon's color after placement from the drawer or selected beacon controls.
- The MVP drawer should remain minimal and does not need to show distance or direction for each beacon.
- Users must be able to see enough beacon status data to understand anchor confidence.

### 8.8 Persistence

- The app must persist placed beacons between sessions using browser-local storage.
- Saving and restoring beacons must work without a backend service or account.
- Saved beacons are device-local and browser-local for the MVP.
- Account-based sync, third-party OAuth, social sign-in, and shared beacon libraries should be reserved for the roadmap.

### 8.9 Post-MVP Camera-First Geospatial Anchoring

- The next major product phase should move toward accurate camera-based placement where beacons are tied to the intended real-world location, not only a fixed-distance projection.
- Accurate post-MVP placement should remain camera-first and should not require traditional map interaction in the primary placement flow.
- Durable post-MVP placement should preserve the base-plus-column model: the base anchor should represent the intended real-world location, and rendering should be able to show only the reachable or unobstructed skyward portion when terrain, trees, buildings, or other occluders hide the base.
- Google ARCore Geospatial is the recommended first accuracy prototype for camera-based placement and later recovery of beacons.
- The existing PWA should remain the short-term demo and product-learning surface while ARCore or another approved spatial anchoring path is validated separately.
- Provisional future ARCore behavior: do not save or label a beacon as `AR-anchored` unless ARCore tracking, geospatial state, and VPS/demo-location readiness meet thresholds defined in the future ARCore implementation spec. If those conditions are not met, the prototype should ask the user to move, scan, wait, or try another location rather than creating a misleading AR anchor. This must be confirmed again before ARCore/native implementation.
- PWA-only GPS/compass placement, even with hidden map/geospatial enrichment, must be described as approximate unless a real spatial anchoring route proves higher accuracy.
- The system may use backend, service-side, provider, or local geospatial cross-referencing to confirm, reject, enrich, or suggest corrections to a camera-created beacon coordinate after a separate implementation RFC approves the route.
- Geoapify or an equivalent provider may be used for address, place, route, nearby-context, or metadata enrichment after provider approval, but it must not be presented as the primary camera-placement accuracy source.
- A visible map view remains optional until further RFC analysis selects it, but if selected it should be treated as a separate feature rather than a temporary MVP stretch goal.
- If a visible map view is implemented, users should be able to confirm or adjust a camera-created beacon there before trusting it as an accurate anchor.
- If a visible map view is implemented, users should be able to place a new beacon directly in the map view when camera-only placement is not precise enough.
- ARCore-geospatial, map-cross-referenced, metadata-enriched, map-created, and map-adjusted beacons must use the same beacon model and camera-rendering logic as camera-created beacons.
- The camera view must render any selected geospatial-backed anchors at the correct bearing and with honest confidence indicators.
- Geospatial-backed anchors should preserve the camera-first feel; any visible map is a precision, inspection, or adjustment tool, not a replacement for the instrument view.
- The product should record how an anchor was created or corrected, such as camera placement, ARCore Geospatial placement, map cross-reference, metadata enrichment, map placement, map adjustment, or visual refinement.

### 8.10 Post-MVP Close-Range Visual Refinement

- The product should research close-range camera recognition for improving beacon alignment when the user is near a saved anchor.
- Visual refinement must be a progressive enhancement; the app must remain useful when recognition is unavailable, denied, unreliable, or too expensive for the device.
- Recognition should only update anchor confidence or local alignment when the system has enough evidence to avoid misleading the user.
- The UI must distinguish GPS/map confidence from visual-recognition confidence.
- Any camera-recognition feature must respect browser permission limits and should avoid storing raw camera imagery unless a future privacy review explicitly approves it.

### 8.11 PWA Concept Demo Improvement Track

- The first approved post-MVP implementation slice should improve the current PWA beacon experience before adding provider, backend, or native dependencies.
- The PWA should become a convincing concept demo: tall sky-reaching beacons, stronger visual scale, camera-frame-aware pitch response, clearer off-screen guidance, conservative obstruction cues, and honest approximate-confidence messaging.
- The PWA should not stay limited to small, always-visible markers if that undersells the final product concept.
- The PWA should not claim final precision, validated obstruction awareness, map-backed truth, or VPS-level accuracy until a selected route provides evidence.
- Future PWA improvements should be staged realistically:
  1. Improve beacon visuals, verticality, pitch behavior, confidence states, and conservative base hiding without external services.
  2. Add shared anchor provenance and rendering contracts so PWA beacons can later represent camera-created, map-backed, ARCore-derived, or visually refined anchors.
  3. Add map-backed metadata or hidden cross-reference only after provider, privacy, quota, token, and fallback behavior are approved.
  4. Add optional visible map inspection or placement only as a separate feature, with beacons still rendered through the camera.
  5. Explore AR/depth-based ground placement as a future precision path, including ARCore/native depth or browser-accessible geospatial AR, VPS-like, WebXR, depth, or visual-positioning capabilities, and add it only when current platform/provider evidence proves it is realistic for the selected implementation surface.

## 9. Visual and Interaction Design

The primary visual baseline is the provided Stitch design direction, titled "Sky Beacon AR - Instrument OS V2."

- The interface should feel like a dark field instrument or exploration operating system.
- Use an obsidian/dark surface palette with luminous cyan accents as the default UI theme.
- Use translucent glass panels with blur, thin borders, and restrained glow.
- Use scan-line overlays, grid textures, reticle brackets, and subtle pulsing to communicate sensing and anchoring.
- Use compact technical labels, uppercase status text, and mono typography for instrument readouts.
- Suggested typography: Inter for body/headings and JetBrains Mono for labels/readouts.
- Suggested icon style: Material Symbols or a comparable clean outlined icon set.
- Beacons should be luminous vertical light pillars with a glowing base, pulse ring, and rise animation.
- The UI should include anchor readiness, heading, selected beacon state, stability, and confidence where useful.
- The MVP should not show beacon distance in the camera overlay unless the distance can be gauged accurately enough to avoid misleading users.
- Primary actions should be thumb-accessible, with a bottom action bar and a prominent place/confirm control.
- The installed app icon and splash screen should feel consistent with the dark instrument theme.
- The design should avoid directly copying Zelda icons, fonts, colors, sounds, or interface layouts.

## 10. Theme Roadmap

The MVP should start with one polished default theme based on the provided dark instrument UI. As a stretch goal, the app should support multiple UI themes:

- Sci-fi: clean technical instrument, cyan light, glass panels, grid/scan effects.
- Fantasy: ancient exploration device, warmer magical accents, crafted ornament, still original.
- Future themes should be possible without rewriting the core camera, beacon, or storage logic.

## 11. Technical Considerations

- PWA platform capabilities:
  - Camera: `getUserMedia`.
  - Location: Geolocation API.
  - Heading/orientation: Device Orientation APIs and browser-specific compass behavior.
  - Persistence: browser `localStorage` for device-local beacon records.
  - Installability: web app manifest and service worker.
- MVP anchoring approach:
  - Store latitude, longitude, generated/custom name, color, created time, and any confidence metadata for each beacon.
  - Calculate destination coordinates from current GPS position, compass heading, and the 100m default distance.
  - Calculate bearing and distance from the user to each beacon.
  - Render beacons in the camera overlay based on bearing difference and estimated field of view.
- Post-MVP anchoring approach:
  - Preserve camera-first placement as the primary user experience.
  - Validate Google ARCore Geospatial as the first serious proof of accurate camera-based beacon placement and recovery.
  - Keep the existing PWA as the short-term demo/product shell while native, Unity, or other ARCore prototype routes are evaluated separately.
  - Treat PWA fixed-distance placement as an approximate draft anchor unless a selected geospatial route provides stronger evidence.
  - Use map/geospatial data to cross-reference camera-created beacon coordinates and identify likely corrections.
  - Use Geoapify or equivalent providers for metadata/context enrichment only after provider approval; do not treat provider metadata as placement truth.
  - Evaluate whether to add a visible map view for user placement, confirmation, and adjustment.
  - Keep camera, ARCore/geospatial prototype, backend/service cross-reference, metadata enrichment, and any visible map flows backed by the same stored beacon data.
  - Treat persistence as a route-selection decision: local-first browser storage is the easier initial path, while backend/server-side storage or hybrid sync may be considered later.
  - Track anchor provenance, confidence, and update history so the UI can explain whether a beacon is approximate, ARCore-geospatial, metadata-enriched, map-cross-referenced, map-confirmed, or visually refined.
  - Research close-range visual recognition separately from baseline geospatial anchoring, with privacy, performance, and platform support review before implementation.
- Obstruction accuracy:
  - Research building, terrain, or map data that could improve whether the ground base should be visible.
  - Preserve the long-term target of accurate, durable, partially obstructable beacons whose bases may be hidden while their skyward columns remain useful.
  - If reliable data is unavailable for the MVP, use conservative visual approximations that avoid showing false ground-level visibility.
- WebXR:
  - WebXR AR should be considered future enhancement or progressive enhancement, not an MVP dependency.
- Outdoor usage should account for GPS drift, compass calibration, poor lighting, bright skies, and device performance differences.
- Compatibility testing should prioritize Android Chrome first, then broaden to iOS Safari and other modern mobile browsers where possible.

## 12. Success Metrics

- Users can place a beacon within 10 seconds of opening the app after permissions are granted.
- At least 90% of successful placements display immediate visual confirmation.
- The app can render up to 3 saved beacons in the camera overlay without clutter or major performance issues.
- A beacon placed from the camera appears in the correct general direction when the user turns back toward it.
- Saved beacons remain available after closing and reopening the installed PWA.
- The camera view maintains a stable interactive frame rate on supported devices.
- Demo viewers understand the product concept within the first minute.

## 13. Risks and Assumptions

- Sensor accuracy is inherently variable in a browser PWA, so the MVP should communicate confidence without blocking the core flow.
- The PWA demo may overpromise if approximate placement is not clearly labeled separately from future ARCore/geospatial accuracy.
- ARCore Geospatial depends on supported devices, Google Cloud/API setup, quota, tracking quality, and VPS availability in selected demo locations.
- The provisional ARCore fallback posture is stricter than the PWA: ARCore/native should not save an `AR-anchored` beacon when tracking/VPS readiness is unavailable, but the exact readiness thresholds remain a future implementation-spec decision.
- Geoapify or another metadata provider may introduce account setup, token handling, cost, attribution, privacy, and fallback requirements.
- Visible map UI could dilute the camera-first identity if it becomes the default placement flow rather than a separate precision tool.
- Obstruction-aware rendering may need approximation if reliable building or terrain data is unavailable.
- Browser compatibility may vary across camera, orientation, compass, haptics, and PWA installation behavior.
- The first version assumes outdoor use and may perform poorly indoors or around severe GPS/compass interference.
- The app should avoid encouraging unsafe outdoor behavior, especially while walking near streets, intersections, or private property.
- Maximum draw distance should be conservative enough to keep the overlay readable and believable; exact tuning can be determined during outdoor testing.

## 14. MVP Scope

- Installable PWA.
- Install-first demo flow.
- Custom app icon and splash screen.
- Camera-first outdoor view.
- Brief first-run tutorial.
- GPS and compass permission flow.
- Progressive permission requests.
- Contextual calibration prompts.
- Preview-and-confirm beacon placement approximately 100m ahead.
- Up to 3 saved beacons.
- Full temporary beacon preview before confirmation.
- Manual beacon color choice from a curated 5-color palette.
- Post-placement beacon color editing.
- Generated beacon names with rename support.
- Browser-local persistence.
- Compact beacon list or drawer.
- Beacon selection, deletion, immediate single-delete undo, and clear-all with confirmation.
- Replace-existing-beacon flow when the user already has 3 saved beacons.
- Directional camera overlay rendering.
- Lightweight off-screen direction indicator.
- Anchor readiness, heading, stability, and confidence indicators.
- Low-confidence warning without blocking placement.
- Haptic feedback for placement and confirmation where supported.
- Dark instrument visual design based on the provided Stitch direction.

## 15. Stretch Goals

- Google ARCore Geospatial accuracy prototype for camera-based beacon placement and recovery.
- PWA demo improvements that clarify approximate anchors, provenance, and confidence.
- PWA beacon experience upgrades that make beacons taller, more readable, more pitch-aware, and closer to the final skyward-column concept.
- Geoapify or equivalent metadata enrichment for address, place, route, or nearby context after provider approval.
- Possible separate map view for inspecting or adjusting existing beacons.
- Possible separate map view for placing new beacons directly.
- Multiple UI themes, starting with sci-fi and fantasy.
- More advanced placement adjustment flow.
- Distance display only if the app can gauge distance accurately enough to avoid fake precision.
- More accurate obstruction-aware rendering using building, terrain, or map data if readily available.
- Long-term support for accurate beacons whose ground/base anchor can be partially hidden by terrain, trees, or buildings while the skyward column remains visible through the camera.
- Haptic feedback polish.
- Close-range visual refinement for nearby beacons when camera recognition is reliable.
- Anchor provenance and confidence history for map-cross-referenced, map-confirmed, and visually refined beacons.

## 16. Future Enhancements

- Automatic distance estimation.
- More precise geospatial anchoring through ARCore Geospatial or another approved real spatial anchoring system.
- Map/geospatial cross-reference and metadata enrichment for anchor context, confidence, and suggested corrections.
- Realistic future PWA precision improvements, including map-backed context and any validated browser-accessible VPS/geospatial AR route, after separate evidence and provider/platform approval.
- Optional visible map confirmation and adjustment as a separate feature.
- WebXR or native AR support where appropriate.
- OAuth, magic links, and richer account management.
- Shared beacon cloud libraries.
- Shared beacons for groups.
- Beacon icons, notes, folders, and richer metadata.
- Compass or mini-radar view.
- Route guidance toward a selected beacon.
- Photo attachments.
- Weather-aware beacon visuals.
- Sound feedback and audio design.

## 17. Launch Milestones

1. Build PWA shell, camera view, and permission flow.
2. Add GPS, compass heading, and anchor-readiness status.
3. Implement 100m-ahead beacon placement.
4. Render directional beacons in the camera overlay.
5. Add up to 3 saved beacons with manual color selection.
6. Add selection, deletion, and browser-local persistence.
7. Apply the dark instrument visual system and beacon animations.
8. Validate outdoors on multiple phones and browsers.
9. Defer ARCore/geospatial accuracy proof, metadata enrichment, and any visible map UI to the post-MVP architecture track.
10. Prepare MVP demo script and release build.
