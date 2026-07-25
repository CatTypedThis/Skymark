# Skymark

**Leave a landmark in the world, then find it by looking.**

Skymark is a camera-first spatial wayfinding tool. It lets someone point their phone at a real-world place and raise a luminous marker above it—a landmark that can be found later by looking through the camera instead of searching a map.

The goal is to make marking a place feel direct and physical. A trail junction, campsite, parked car, meeting point, viewpoint, or distant destination should be something you can mark where you see it and recognize again in the landscape.

## The idea

A Skymark is not a flat map pin or a graphic attached to the screen. It has two connected parts:

- a durable base anchored to an intended real-world location;
- a tall, sky-reaching column that makes that location visible from a distance.

The distinction matters. The base may disappear behind terrain, trees, or buildings, while the upper column can remain visible above the obstruction and continue to guide the user. Skymark should never draw a hidden base as though it were visible or present an approximate position as exact.

The primary experience remains in the camera. Maps may eventually help inspect, confirm, or adjust a marker, but placing and finding one should not require leaving the world in front of you for a conventional map interface.

## What using Skymark should feel like

1. Open the instrument and see the world through the camera.
2. Aim at the place you want to remember.
3. Choose a color and raise a Skymark from that location.
4. Return later and turn toward its bearing.
5. Follow the visible column—even when its base is out of frame or obscured.

The interface is designed as a focused field instrument: dark, luminous, exploratory, and slightly mysterious without sacrificing clarity or trust.

## Product principles

- **Camera first.** The physical world is the main interface.
- **Anchored to places.** A marker represents an intended location, not merely a direction or a screen coordinate.
- **Visible at a distance.** Vertical markers are easier to rediscover in a landscape than ordinary pins.
- **Honest about certainty.** Every anchor should communicate its source and confidence. Approximate data must look approximate.
- **Useful before it is perfect.** The product should degrade gracefully when sensors or advanced spatial capabilities are unavailable.
- **Focused and local first.** A small set of meaningful markers is more useful than a crowded overlay. The prototype needs no account or cloud service.

## The current prototype

The repository contains a mobile-first Next.js PWA that proves the core interaction with browser capabilities available today.

It currently:

- opens into a live camera instrument;
- requests camera, location, and orientation access progressively;
- previews and places a marker approximately 100 metres ahead using GPS and compass heading;
- renders sky-reaching markers with pitch-aware framing and off-screen guidance;
- records anchor provenance and confidence without claiming false precision;
- saves up to three named, coloured markers in the browser;
- supports selection, renaming, recolouring, replacement, deletion, undo, and clear-all;
- works without a backend, account, or runtime service.

The PWA is an intentional product-learning and demonstration surface, not the final anchoring system. Browser GPS and compass readings can establish a useful approximate direction, but they cannot reliably prove an exact ground point, depth, line of sight, or obstruction.

> The application and older product documents currently use the working name **Sky Beacon**. **Skymark** describes the product vision represented by this repository.

## Where it is going

The long-term objective is accurate, durable camera-based placement and recovery of markers at intended real-world locations.

The current direction is:

1. Keep refining the PWA until it communicates the full spatial idea convincingly while remaining honest about browser limitations.
2. Maintain one shared anchor model that records where a marker came from, how confident it is, and how it should be rendered.
3. Validate a true geospatial AR path—currently ARCore Geospatial is the leading candidate—for precise camera-based anchoring.
4. Add map or place metadata only where it improves context, confirmation, or adjustment without replacing the camera-first flow.
5. Explore close-range visual refinement and obstruction-aware rendering only when the available evidence is reliable enough to improve, rather than merely imply, accuracy.

This is not intended to become a conventional turn-by-turn navigation app. Skymark is about spatial memory and visual orientation: giving people a persistent landmark in the world when a map pin is too abstract.

## Technology

- Next.js App Router, React, and TypeScript
- Tailwind CSS
- browser Camera, Geolocation, and Device Orientation APIs
- local-first persistence with `localStorage`
- installable PWA manifest and service worker
- Vitest and Playwright

## Run locally

Install dependencies and start the development server:

```powershell
npm install
npm run dev
```

For layout and non-sensor testing from a phone on the same Wi-Fi:

```powershell
npm run dev:lan
```

Open one of the printed network URLs on the phone. Camera, location, and orientation APIs require a secure context on mobile browsers, so full device testing requires a trusted HTTPS URL. A secure tunnel or an HTTPS deployment such as Vercel is the simplest option; the plain LAN URL is primarily useful for UI testing.

## Validate

```powershell
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Product and engineering documents

- [`PRD.md`](./PRD.md) — product requirements and longer-term direction
- [`SRS.md`](./SRS.md) — detailed software requirements
- [`technical-specification.md`](./technical-specification.md) — implementation architecture
- [`USER_STORIES.md`](./USER_STORIES.md) — user stories and acceptance criteria
- [`specs/RFC-map-anchored-beacon-system.md`](./specs/RFC-map-anchored-beacon-system.md) — post-MVP anchoring strategy
- [`UI.html`](./UI.html) — high-fidelity interface mockups
