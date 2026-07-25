# Addendum 1: Pitch Spike, BUG-11 Collision, Visual Done-Targets

Spec Type: Addendum
Status: Draft
Date: 2026-06-24
Supplements: `specs/SPEC-004-phased-core-pwa-upgrade-implementation-spec.md`
Source RFC: `specs/RFC-map-anchored-beacon-system.md`
Source Technical Plan: `specs/SPEC-003-map-backed-beacon-anchoring-technical-plan.md`
Repo Root: `C:\Skymark`

## 1. Purpose

This addendum supplements `specs/SPEC-004-phased-core-pwa-upgrade-implementation-spec.md`. It does not supersede it, change the selected route, or approve new dependencies. It adds three narrow refinements that reduce the risk of an implementing agent producing code that is faithful to the spec but wrong in practice:

- Addendum A inserts a Phase 0.5 pitch-model device spike before the frame helper is written.
- Addendum B records the file collision between this slice and `specs/RFC-BUG-11-beacon-multiple-placement-jump.md`, and gives sequencing guidance.
- Addendum C adds measurable "done" targets for the visual goal that is the entire point of the slice, since SPEC-004 §13 only covers states, not whether the beacon reads as a tall skyward column.

### 1.1 Reading Note (redundancy collapse)

For an implementing agent, `specs/SPEC-004-phased-core-pwa-upgrade-implementation-spec.md` is the operative document. The RFC and SPEC-003 restate the same scope gates (no providers, no backend, no native, no tokens, no BUG-11 by default) multiple times. An agent should read those two documents once for rationale and not re-litigate the gates while implementing. If a gate seems to conflict, SPEC-004 + this addendum win for implementation behavior; the RFC/SPEC-003 win for governance scope.

## 2. Addendum A: Phase 0.5 — Pitch-Model Device Spike

### 2.1 Why this exists

The headline UX of the first slice — base visible only when looking down, upper column when looking up — rests entirely on `lib/geospatial/beacon-frame.ts`'s `cameraElevationDegrees` transform (SPEC-004 §8.3):

```ts
cameraElevationDegrees = clamp(PITCH_NEUTRAL_BETA_DEGREES - pitchDegrees, -60, 60);
```

`pitchDegrees` is `DeviceOrientationEvent.beta`, surfaced at `lib/sensors/use-orientation.ts:58`. The `beta` reference frame is not stable across Android Chrome and iOS Safari: it is device-orientation-lock dependent, and Android Chrome has a long history of beta sign inconsistencies versus the W3C frame. SPEC-004 itself flags this twice (§8.3 footnote and Open Question §15) but leaves it to post-implementation discovery.

Preliminary analysis against the W3C frame (held vertical ≈ beta 90, tilt top-down to look at ground moves beta toward 0, tilt top-back to look at sky moves beta toward 180) suggests the §8.3 formula may be inverted relative to its own base/upper thresholds (`BASE_ELEVATION_MAX_DEGREES = -12`, `UPPER_COLUMN_ELEVATION_MIN_DEGREES = 18`). That suspicion is exactly what the spike must confirm or refute empirically. Do not trust this analysis either; measure it.

### 2.2 Spike procedure (do this before Phase 1 anchor-model work is consumed by Phase 2)

On a primary target device (Android Chrome, portrait, installed PWA mode preferred; record iOS Safari as a secondary if available):

1. Open the current app, grant location + motion + camera, reach the live overlay.
2. Log `event.beta` (and `event.gamma` for context) on every `deviceorientation` event to console or a temporary on-screen readout. Do not change any product behavior yet.
3. Hold the phone vertical, aiming at the horizon. Record `beta`. (Expected ≈ 90.)
4. From vertical, tilt the top of the phone down to aim the camera roughly 30° below the horizon (toward the ground). Record `beta`.
5. From vertical, tilt the top of the phone back to aim roughly 30° above the horizon (toward the sky). Record `beta`.
6. Record the screen-orientation lock state and whether it changed the values.

### 2.3 Pass / fail rubric

- Determine empirically whether `beta` increases or decreases when aiming up versus down.
- Derive the transform and constants so that: aiming at the ground → `base` segment (or `middle` with base treatment per the §8.3 table), aiming at horizon → `middle`, aiming at sky → `upper` segment.
- If the measured frame means the §8.3 `90 - beta` form is inverted, correct the transform (e.g. toward `beta - 90`-style) and update the §8.3 constants and the matching tests. Per the SPEC-004 §8.3 footnote, a sign/neutral correction inside the pure helper and its tests does not require an RFC amendment.
- Spike passes when, on the primary device, the three recorded poses map to the three intended segments with no manual sign fiddling left as an open question.

> **Spike result (2026-06-24/25) + model supersession:** The spike confirmed the
> W3C frame: horizon beta ≈ 84, aim-up ≈ 143, aim-down ≈ 36, so `elevation =
> beta - 90` (the `90 - beta` draft was indeed inverted — it produced "base when
> looking up"). However, during subsequent on-device iteration the **discrete
> segment model itself was abandoned** in favor of a continuous world-space-column
> framing model keyed directly off beta: the base rests at ~30 beta (the
> look-down pose) and the column is visible (full strength, no fade) up to ~155
> beta, fading out by ~165. The `base`/`middle`/`upper`/`outside` segments and
> the `base-visible`/`base-soft`/`base-hidden` CSS classes no longer exist.
> SPEC-004 §8.3 has been updated to the operative continuous contract; the
> Addendum C acceptance targets referencing the old classes (§4.1/4.2) are
> therefore untestable as written and superseded by "the column stays fully
> visible from ~30 to ~155 beta and pans smoothly."

### 2.4 Stop / escalate

- Stop and escalate (return for guidance) if the spike cannot be run on any physical Android device, or if `beta` is null/unsupported on the target device. In that case the slice should fall back to the heading-only branch (SPEC-004 §8.3 "Pitch is null or unusable → middle / hidden") as the default, and the pitch-aware states become best-effort.
- Do not ship the base/upper segment behavior gated on the unverified §8.3 formula. Either the spike validates it, or the helper defaults to the conservative heading-only fallback.

## 3. Addendum B: BUG-11 File Collision

### 3.1 The collision

SPEC-004 rewrites `components/beacons/BeaconOverlay.tsx` (Phase 2) and the bearing-to-screen mapping. `specs/RFC-BUG-11-beacon-multiple-placement-jump.md` is a render-bearing-lock fix for saved beacons that also lives in the same bearing-to-screen path: it reconstructs each saved beacon's placement origin and, while the user stays inside a local-origin lock radius, returns the stored `placementHeading` instead of the live GPS-to-beacon bearing. The two changes touch the same code path and the same file.

The three specs say "do not include BUG-11" roughly six times but never acknowledge this shared surface. An agent doing both (now or later) will produce a merge conflict or, worse, silently regress one behavior.

### 3.2 Sequencing

- Default: implement SPEC-004 only, as the selected slice. BUG-11 stays out unless post-upgrade QA shows jump/drift still materially harms the demo (this is the RFC's stated trigger).
- If BUG-11 is later approved, treat it as a follow-up layered on top of the SPEC-004 overlay, not as an independent rewrite.

### 3.3 Integration boundary (if/when both exist)

Introduce a single pure boundary, for example `lib/geospatial/saved-beacon-bearing.ts` exporting `resolveSavedBeaconBearing(beacon, location)`:

- BUG-11's origin-lock logic lives here.
- `BeaconOverlay` calls `resolveSavedBeaconBearing()` to get the bearing, then passes that bearing into the SPEC-004 frame/pitch resolution.
- This keeps jitter-lock (a bearing-source concern) separate from frame mapping (a rendering concern), so neither rewrite has to know about the other.

This boundary is optional for the first slice (no BUG-11). It is mandatory the moment BUG-11 is added, so that the two concerns do not tangle inside `BeaconOverlay`.

## 4. Addendum C: Measurable Visual Done-Targets

SPEC-004 §13 acceptance criteria verify states (base hidden when unknown, off-screen indicator present, no new dependencies). They do not verify the actual objective of REQ-021 / REQ-054: beacons must read as tall skyward columns rather than small always-visible markers. The following measurable targets close that gap. They complement, not replace, the existing state-based criteria.

Capture a "before" screenshot on the current main branch and an "after" screenshot of the implemented slice on the same device for each check.

### 4.1 Hard numeric floors (camera overlay, portrait, one beacon on-screen)

- Column vertical reach: the luminous column occupies at least **40% of the viewport height** measured from its rendered base anchor upward. (Current `BeaconPillar` is anchored at `bottomPercent: 24`; the new column must visibly extend well above center.)
- Base treatment distinction: when `baseTreatment` is `visible`, a distinct base ring/disk is present; when it is `soft` or `hidden`, that element is absent or faded. Verify by DOM class diff (`base-visible` vs `base-soft` vs `base-hidden`) plus a visible screenshot difference.
- Upper-column emphasis: the `upper` segment renders with a visibly distinct treatment from `middle` (e.g. brighter cap, greater reach, or a distinct class). Confirmed by a visible screenshot difference, not only by class name.
- Off-screen indicator: appears within **64px** of the left or right screen edge and carries the vertical hint when a vertical hint is set.

### 4.2 Readability with three beacons (REQ-021, NFR on overlay usability)

- With three beacons on-screen at once, no beacon label overlaps another beacon's label, and none of the following are obscured: reticle, bottom action controls, preview controls, drawer trigger, sensor status bar, permission chips.
- A three-beacon screenshot is included in the PR/implementation notes as evidence.

### 4.3 Fallback honesty

- When pitch is unavailable, the heading-only branch still produces a column that meets the 40% reach floor (i.e. the conservative fallback does not collapse the beacon back to a small marker).

### 4.4 When the target device is unavailable

- If no physical device can be used for the 4.1/4.2 screenshot evidence, document that gap explicitly, record the closest achievable values on desktop simulation, and flag the visual targets as "unverified pending device QA" rather than marking the slice complete.

## 5. Validation

No new validation commands beyond SPEC-004 §12. This addendum adds:

- A completed Phase 0.5 spike record (the six measured `beta` values + chosen transform) referenced in the implementation notes.
- "Before" and "after" screenshots demonstrating the 4.1/4.2 targets, or an explicit unverified-pending-device-QA note.
- If BUG-11 is added in the same workstream, evidence of the `resolveSavedBeaconBearing` boundary in `BeaconOverlay`.

```powershell
git diff -- specs/SPEC-004-addendum-1-pitch-spike-bug11-collision-visual-targets.md
git status --short
```

Expected result: documentation-only changes; no product code, dependencies, tokens, or configuration.

## 6. Scope Addition: Gated Debug Panel

Status: Added during implementation of SPEC-004 + this addendum.

This slice adds a local-only diagnostic overlay that is outside SPEC-004's stated deliverables (which are optional anchor fields and pure render helpers). It is recorded here as a documented scope addition so the spec set stays honest, and because it directly serves the Addendum A pitch spike and all future device QA.

### 6.1 What was added

- `lib/debug/use-debug-mode.ts` — reads the `?debug=1` URL flag (off by default, re-evaluated on popstate).
- `components/hud/DebugPanel.tsx` — local-only readout of camera/orientation status, heading, `beta` (pitch), stability, accuracy label, confidence, GPS lat/lon/accuracy, and per-beacon resolved segment. Nothing is transmitted (NFR-001).
- `app/globals.css` — `.debug-panel` and child classes.
- Wired into `components/SkyBeaconApp.tsx`, gated by `useDebugMode()`.

### 6.2 Why it is in scope

- It replaces the throwaway temporary readout the Addendum A spike would otherwise need, and remains reusable for every future sensor/frame device question.
- It is strictly off by default, so it does not affect the normal experience, the demo view, or the Addendum C visual "done" screenshots (which must be taken with the panel off).
- It adds no dependency, no provider, no backend, no native code, and no persisted state, so it does not trigger any SPEC-004 amendment condition.

### 6.3 When to use it

- Addendum A pitch spike: on (that is its purpose).
- "Something is off with heading/position/beacon segment": flip on, read, flip off.
- Daily testing / demo prep / Addendum C screenshots: off (see the real experience).
