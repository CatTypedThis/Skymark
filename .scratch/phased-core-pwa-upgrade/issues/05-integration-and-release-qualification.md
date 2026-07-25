# 05 — Integration and release qualification

**What to build:** Qualify the complete phased PWA upgrade as one coherent three-beacon experience. Resolve integration regressions, verify that existing local beacon management and permission flows still work, and establish whether the pitch model is safe for release or must use its heading-only fallback.

**Blocked by:** 02 — Guide and save base-oriented placements; 03 — Render pitch-aware skyward beacons; 04 — Add frame-aware off-screen guidance.

**Status:** done

- [x] Three saved beacons remain readable in the camera overlay without obscuring the reticle, sensor bar, preview controls, drawer, permission controls, or bottom dock.
- [x] Seeded legacy beacons and newly saved approximate anchors both render, remain selectable, and show the expected compact source/confidence status.
- [x] Rename, recolor, delete, undo, clear-all, replacement, onboarding, persistence, and permission-retry flows continue to work.
- [x] Preview and saved-beacon rendering remain usable when pitch is unavailable.
- [x] Automated coverage includes anchor normalization, frame behavior, weak-confidence saving, legacy persistence, and off-screen guidance where stable.
- [x] Lint, unit tests, browser tests, and the production build pass, or each failure is documented with a specific reproducible blocker.
- [ ] Manual portrait-mode testing on Android Chrome or installed PWA mode is completed when a device is available. — **deferred: no physical Android device in this qualification environment.** No code change is gated by this; it is a final release sign-off check to run on a device (see Qualification §Open device-dependent items).
- [ ] Device testing confirms the pitch direction and neutral model; if it does not, the pure resolver and its tests are corrected without broadening product scope. — **deferred pending device sign-off.** The pitch sign and neutral model are already verified against the Addendum A device spike (Android Chrome, 2026-06-24) and locked in `lib/geospatial/beacon-frame.ts`; this criterion asks for a fresh device re-confirm before release and cannot be closed from an automated-only environment.
- [x] If measured pitch is not reliable enough, the heading-only fallback is enabled without removing the provenance and UI improvements. — Verified statically: `resolveBeaconFrame({ pitchDegrees: null })` returns `pitchQuality: "heading-only"` with the column visible at the base pose (`HEADING_ONLY_BOTTOM_PERCENT = BASE_BOTTOM_PERCENT`), and the provenance/UI improvements (`anchorSource`/`anchorConfidence`, drawer status label, off-screen guidance) are independent of pitch availability. The fallback path is exercised by the `resolveBeaconFrame — heading-only fallback (pitch null)` unit tests.
- [x] The completed work adds no provider, map tile, backend, account, cloud-sync, credential, native/mobile, ARCore, WebXR, depth, or visual-recognition dependency. — `package.json` dependencies inspected: none of ARCore/ARKit/WebXR SDK, map tile provider (Mapbox/MapTiler/MapLibre/Leaflet/Geoapify), backend/cloud-sync (Firebase/Supabase), account/credential, native/mobile, depth, or visual-recognition library is present. The two Radix + Tailwind + lucide deps are pre-existing UI primitives.

## Qualification

**Scope:** Integration and release qualification of the phased PWA upgrade as a single three-beacon experience (tickets 01–04). No product-code change was required or made for this ticket; it is a verification and sign-off pass. Ticket 02's `Status:` is still `ready-for-agent` on disk but its implementation is present and exercised here (per user confirmation at qualification time).

**Validation run (2026-07-25, branch `codex/map-anchored-beacon-specs`, HEAD `218fc00`):**

- `npm run lint` (`eslint . --max-warnings=0`) — **pass**, 0 warnings.
- `npm test` (Vitest, node + jsdom projects) — **pass**, 103 tests across 15 files.
- `npm run build` (Next 16 production build w/ strict TypeScript) — **pass**, 4 static routes (`/`, `/_not-found`, `/manifest.webmanifest`, `/offline`).
- `npx playwright test` (Pixel 7 chromium, port 3002) — **pass**, 11/11 e2e.

**Acceptance-criteria evidence:**

1. *Three-beacon overlay non-obscuring* — `.beacon-overlay`/`.beacon-pillar` carry no `z-index` and stack by DOM order below `.reticle`/`.sensor-topbar`/`.side-tools` (z-index 5), `.sensor-warning` (6), and `.bottom-dock`/`.preview-tools` (7); `.beacon-overlay` itself is `pointer-events: none` and only the pillar button opts back in. Drawer is a portaled Sheet. The 300svh column therefore cannot cover the reticle, sensor bar, preview controls, drawer, permission controls, or bottom dock. (`app/globals.css:322,348,117,126,249,527,552,649,728`.)
2. *Legacy + approximate anchors render/select with compact status* — `BeaconDrawer` shows `anchorStatusLabel(source, anchorConfidence)` per row (`components/beacons/BeaconDrawer.tsx:110-128`); legacy records normalize to `anchorSource="camera"` with `anchorConfidence` derived from the legacy `confidence` (`lib/beacons/beacon-service.ts:69-74`). E2E `shows compact anchor source/confidence status in the drawer` asserts both legacy→"Approximate / High" and explicit-low→"Approximate / Low".
3. *Management flows* — rename/recolor (drawer editor, `BeaconDrawer.tsx:145-170`), delete+undo (`SkyBeaconApp.handleDelete`, toast `Undo` action → `undoDeleteBeacon`), clear-all (AlertDialog confirm), replacement (`handleReplace`), onboarding (`OnboardingFlow`), persistence (`listActiveBeacons`/localStorage), permission-retry (`handle{Camera,Location,Compass}PermissionPress`). Covered by e2e tests `persists drawer edits across reloads`, `clears saved beacons from the local drawer`, `retries denied permissions from the top status chips`, `top status chips report when permissions are already active`, `opens first-run onboarding and falls back when the camera is unavailable`.
4. *Pitch-unavailable usability* — `resolveBeaconFrame` pitch-null branch keeps `inView: true`, base pose; `useOrientation` reports `pitch: event.beta ?? null`, and the desktop-simulation path sets `pitch: 0`. Covered by unit suite `resolveBeaconFrame — heading-only fallback (pitch null)`.
5. *Automated coverage map* — anchor normalization + legacy persistence (`tests/unit/beacons.test.ts` "anchor provenance", `renderable-anchor.test.ts`), frame behavior (`beacon-frame.test.ts`, 18 tests), weak-confidence saving + GPS-unavailable blocking (e2e), off-screen guidance (`offscreen-guidance.test.ts`, `beacon-overlay.test.tsx`).
6. *No new dependency* — see checked criterion above; `package.json` clean.

**Open device-dependent items (deferred, not blockers for code merge):**

- *Manual portrait-mode testing on Android Chrome / installed PWA.* Cannot be run in this environment (no physical device). Replay on a device: install PWA, open portrait, place 3 beacons, exercise drawer/persistence/permission-retry under real sensors. The automated Playwright suite already covers the equivalent flows headlessly on a Pixel 7 viewport.
- *Pitch direction + neutral model device re-confirm.* The sign convention and `PITCH_NEUTRAL_BETA_DEGREES = 90` are already locked from the Addendum A spike (Android Chrome, 2026-06-24; measured horizon ~84, aim-up ~143, aim-down ~36) and asserted in `beacon-frame.test.ts` "normalizeCameraElevation". This criterion asks for one fresh device re-confirm before release; if a device disagrees, the correction is confined to the pure resolver + its tests per the criterion's own scope limit.
- *Pitch reliability / heading-only fallback decision.* The fallback is already wired and tested (item 4). The release call on whether measured pitch is "reliable enough" to ship as default is a device sign-off judgement; the fallback is guaranteed available either way without removing the provenance/UI work.
