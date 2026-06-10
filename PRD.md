# Product Requirements Document: Sky Beacon Camera App

## 1. Overview

Sky Beacon is an augmented-reality camera app that lets users look through their device camera and place tall, sky-reaching beacons at selected locations on the screen. These beacons act as visible markers in the world, helping users tag, remember, and navigate toward points of interest through the camera view.

The experience is inspired by the feeling of using the Sheikah Slate from *The Legend of Zelda: Breath of the Wild*: mystical, exploratory, spatial, and tool-like. The app should evoke that sense of discovery while maintaining an original visual identity.

## 2. Core Feature

Users can open the camera, aim at a location, and place a beacon on the screen. Once placed, the beacon appears anchored to the real-world location and extends vertically into the sky. When the user looks back through the camera, the beacon remains visible from appropriate angles and distances.

## 3. Goals

- Allow users to place persistent AR beacons in real-world space.
- Make beacons visually recognizable from a distance through the camera.
- Create a simple, immersive camera-first interaction model.
- Provide a magical but practical exploration tool.
- Establish a visual language inspired by ancient-tech fantasy without copying existing game assets.

## 4. Non-Goals

- Full map navigation is not required for the first version.
- Social sharing and multiplayer beacon placement are not required for the first version.
- Indoor precision positioning is not a first-version requirement.
- The app should not use copyrighted Zelda names, UI, glyphs, sounds, or direct visual assets.

## 5. Target Users

- Explorers and hikers who want to mark visible points of interest.
- Urban users who want to remember landmarks, meeting spots, or routes.
- AR enthusiasts looking for a playful spatial tool.
- Fans of fantasy adventure interfaces who enjoy immersive utility apps.

## 6. User Stories

- As a user, I want to open the camera and immediately see the world around me so I can place a beacon without setup friction.
- As a user, I want to tap a location on the screen and create a beacon there so I can mark something important.
- As a user, I want beacons to extend upward into the sky so they are easy to spot.
- As a user, I want previously placed beacons to remain visible when I return to the area so they feel anchored in the world.
- As a user, I want to remove beacons I no longer need so my view stays uncluttered.
- As a user, I want the interface to feel like a mysterious scanning device, not a standard map app.

## 7. Functional Requirements

### 7.1 Camera View

- The app must launch into a live camera view.
- The app must request camera permission before showing the AR experience.
- The camera view must support portrait orientation for the first version.
- The app must display a subtle targeting reticle or placement indicator.

### 7.2 Beacon Placement

- The user must be able to place a beacon by tapping a target location in the camera view.
- The app must estimate a real-world anchor point using AR plane detection, depth, geospatial anchors, or another platform-appropriate spatial method.
- The beacon must appear immediately after placement.
- The beacon must extend vertically upward from its anchor point.
- The app should provide visual feedback when placement succeeds or fails.

### 7.3 Beacon Visibility

- Beacons must remain visible through the camera when the user looks toward their anchored location.
- Beacons should scale, fade, or simplify based on distance to preserve performance and readability.
- Beacons should be visible against bright skies, dark environments, and visually busy backgrounds.
- Beacons should remain upright relative to gravity.

### 7.4 Beacon Management

- Users must be able to select an existing beacon.
- Users must be able to delete a selected beacon.
- Users should be able to name or label a beacon in a later version.
- Users should be able to view a list of placed beacons in a later version.

### 7.5 Persistence

- The app should persist placed beacons between sessions.
- The app should store enough spatial data to restore beacons when the user returns to the area.
- If precise restoration is unavailable, the app should communicate uncertainty visually.

## 8. Visual and Interaction Design

- The primary interface should be camera-first with minimal overlays.
- Beacons should feel luminous, vertical, and sky-reaching.
- UI elements should suggest a crafted exploration instrument: clean geometry, scanning motion, glyph-like but original symbols, and restrained animation.
- The design should avoid directly copying Zelda icons, fonts, colors, sounds, or interface layouts.
- Placement should feel intentional: aim, confirm, pulse, beacon rise.
- The app should avoid clutter by limiting visible UI while the user is exploring.

## 9. Technical Considerations

- Candidate AR platforms:
  - iOS: ARKit with ARGeoAnchor where available.
  - Android: ARCore with Geospatial API where available.
  - Cross-platform: Unity AR Foundation, React Native with native AR modules, or a custom native implementation.
- Beacon persistence may require a combination of:
  - GPS coordinates.
  - Device compass and orientation.
  - AR world anchors.
  - Cloud anchors or geospatial anchors.
- Outdoor usage should account for GPS drift, compass noise, poor lighting, and device performance differences.
- The beacon renderer should support long vertical geometry without causing clipping, z-fighting, or excessive GPU cost.

## 10. Success Metrics

- Users can place a beacon within 10 seconds of opening the app.
- At least 90% of successful placements display immediate visual confirmation.
- Returning users can relocate a previously placed outdoor beacon within an acceptable accuracy range.
- The camera view maintains a stable interactive frame rate on supported devices.
- Users report that the app feels immersive, magical, and useful.

## 11. Risks and Open Questions

- How accurate does beacon persistence need to be for the first version?
- Should beacons be private by default, or should shared beacons be part of the roadmap?
- Should the app require geospatial AR support, or should it gracefully support simpler local-only anchors?
- How should the app handle restricted areas, private property, or unsafe placement behavior?
- What is the desired maximum beacon height and draw distance?

## 12. MVP Scope

- Camera-first AR view.
- Tap-to-place beacon.
- Beacon rises vertically into the sky.
- Existing beacons remain visible during the current session.
- Delete selected beacon.
- Basic visual feedback for placement success or failure.
- Original fantasy-tech visual style.

## 13. Future Enhancements

- Persistent outdoor geospatial beacons.
- Beacon names, colors, and icons.
- Compass or mini-radar view.
- Distance indicators.
- Route guidance toward a selected beacon.
- Shared beacons for groups.
- Photo or note attachments.
- Weather-aware beacon visuals.
- Sound and haptic feedback.

## 14. Launch Milestones

1. Prototype camera view with simulated beacon placement.
2. Add AR anchoring and vertical beacon rendering.
3. Add beacon selection and deletion.
4. Add first-pass visual identity and animation.
5. Validate outdoor placement accuracy.
6. Add persistence strategy.
7. Run usability testing.
8. Prepare MVP release.
