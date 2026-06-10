# Feature: Sky Beacon MVP

## Feature Description
Build the Sky Beacon progressive web app MVP from the product requirements, software requirements, technical specification, and visual mockup. The MVP is a mobile-first camera experience where users can preview outdoor beacons, choose a beacon color, sign in with PocketBase email/password auth, save up to three GPS-backed beacons, and manage those beacons through a compact drawer.

## User Story
As an outdoor explorer
I want to open a camera-first PWA, place luminous sky beacons in the direction I am facing, and return to them later
So that I can mark points of interest with a spatial tool that feels useful and memorable.

## Problem Statement
The repository currently contains product documents and static mockups, but no runnable app. Sky Beacon needs a polished MVP that demonstrates the core camera, sensor, placement, persistence, and management experience while remaining honest about browser sensor limits.

## Solution Statement
Create a Next.js App Router TypeScript PWA using Tailwind CSS, lucide-react, and PocketBase. Keep core geospatial and beacon rules in pure utilities, render the camera and beacons with DOM/CSS overlays, request permissions progressively, and provide graceful degraded states when hardware APIs or PocketBase are unavailable.

## Relevant Files
Use these files to implement the feature:

- `PRD.md` - Product scope, user goals, visual direction, and MVP acceptance.
- `SRS.md` - Requirement-level behavior, acceptance scenarios, and local resilience expectations.
- `technical-specification.md` - Authoritative architecture for Next.js, PocketBase, PWA, component structure, and testing.
- `UI.html` - Visual baseline for the dark instrument HUD, beacon pillars, reticle, and drawer styling.

### New Files

- `app/` - Next.js App Router pages, layout, metadata, manifest, and global styles.
- `components/` - Camera, HUD, beacon, onboarding, and auth UI.
- `lib/` - Geospatial math, beacon validation, PocketBase access, sensor helpers, and PWA registration.
- `pocketbase/pb_migrations/` - PocketBase schema migration for the `beacons` collection.
- `public/` - App icons, service worker, and visual assets.
- `tests/` - Vitest coverage for pure geospatial and beacon logic.

## Implementation Plan
### Phase 1: Foundation
Scaffold a Next.js App Router TypeScript project, configure Tailwind CSS, add PWA manifest and service worker, copy the mockup camera backdrop into `public`, and create a custom SVG app icon.

### Phase 2: Core Implementation
Implement PocketBase auth and beacon services, pure geospatial utilities, camera and sensor hooks, confidence derivation, beacon preview, 100-meter placement calculation, and directional overlay rendering.

### Phase 3: Integration
Wire onboarding, auth prompts, preview/confirm flow, max-three replacement flow, beacon drawer management, undo delete, clear all confirmation, PWA registration, and graceful unavailable states into a single camera-first experience.

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Scaffold project
- Add package scripts and Next.js/Tailwind/TypeScript configuration.
- Add `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/manifest.ts`, and `/offline`.
- Add public icon, service worker, and copied camera backdrop.

### 2. Add core libraries
- Add beacon types, color palette, validation, slot helpers, and generated-name helpers.
- Add destination, bearing, angular difference, heading, smoothing, and overlay-position utilities.
- Add PocketBase client, auth helpers, and beacon service functions.

### 3. Build camera MVP
- Implement onboarding flow.
- Implement camera stream and desktop fallback.
- Implement location and orientation watchers with progressive permission requests.
- Implement sensor status HUD and central reticle.

### 4. Build placement flow
- Add preview mode with full temporary beacon.
- Add exactly five curated colors.
- Confirm placement approximately 100 meters ahead.
- Show low-confidence warnings while allowing degraded-but-usable placement.
- Require auth for save and preserve pending preview while auth dialog is open.

### 5. Build beacon management
- Render saved beacons directionally.
- Add off-screen indicators.
- Add compact drawer with selection, rename, recolor, delete, undo, clear all, and replacement.
- Keep camera overlay free of precise distance readouts.

### 6. Add validation coverage
- Add unit tests for geospatial utilities, overlay mapping, heading normalization, validation, and slot helpers.
- Run Validation Commands.

## Testing Strategy
### Unit Tests
Use Vitest for destination coordinate calculation, bearing calculation, angular wraparound, overlay mapping, heading smoothing, confidence derivation, beacon validation, and slot generation.

### Integration Tests
Use manual browser testing for onboarding, camera fallback, auth prompt, preview flow, drawer state, and responsive layout. PocketBase-backed flows should be tested with the local PocketBase server.

### Edge Cases
- Camera denied or unsupported.
- Location unavailable, stale, or low accuracy.
- Heading unavailable or unstable.
- Heading wraparound near 0/360 degrees.
- Attempting to save while signed out.
- Attempting to place a fourth beacon.
- Empty rename values.
- Corrupt or unavailable remote records.
- PocketBase unreachable.

## Acceptance Criteria
- The app runs as a Next.js App Router TypeScript PWA.
- The first-run tutorial appears once and can be skipped.
- Camera permission is requested only when entering the camera experience.
- Location and orientation are requested progressively when placement needs them.
- The HUD shows readiness, heading, stability, confidence, and auth/server state.
- The user can preview a full beacon and select one of exactly five colors.
- Confirmed placement computes a coordinate approximately 100 meters ahead.
- Signed-out users can preview but must authenticate before saving.
- Signed-in users can save up to three PocketBase-backed beacons.
- Fourth placement opens an intentional replacement flow.
- The drawer supports selection, rename, recolor, delete, undo delete, and clear all.
- Beacons render directionally with off-screen indicators and no precise overlay distance.
- The app handles unsupported APIs, denied permissions, and PocketBase outages without a blank screen.

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

- `npm run lint` - Run Next.js linting.
- `npm run test` - Run Vitest unit tests.
- `npm run build` - Build the production PWA.
- `npm run dev` - Run the local app for browser inspection.

## Notes
The feature skill's Python numbering helper was unavailable because neither `python` nor `py` is installed in the shell. With no existing `specs/` directory, the next filename is therefore `SPEC-001-sky-beacon-mvp.md` by the helper's documented algorithm.

`technical-specification.md` supersedes older local-only SRS requirements for persistence. This MVP implements PocketBase as the persistence boundary while retaining graceful local UI behavior when the backend is unreachable.
