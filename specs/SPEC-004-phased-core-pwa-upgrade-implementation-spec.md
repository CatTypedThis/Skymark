# Implementation Spec: Phased Core PWA Upgrade

Spec Type: Implementation
Status: Draft
Date: 2026-06-20
Source RFC: `specs/RFC-map-anchored-beacon-system.md`
Source Technical Plan: `specs/SPEC-003-map-backed-beacon-anchoring-technical-plan.md`
Source Requirements: `PRD.md`, `SRS.md`, `technical-specification.md`
Related RFCs: `specs/RFC-BUG-11-beacon-multiple-placement-jump.md`
Implementation Approval: Required
Repo Root: `C:\Skymark`

## 1. Purpose

This implementation spec defines the first selected planning slice for the post-MVP beacon anchoring direction: the Phased Core PWA Upgrade.

The goal is to make the current Next.js PWA feel closer to the intended sky-reaching beacon product while staying honest about browser-only anchoring limits. This spec covers local PWA work only: visual scale and verticality, camera-frame-aware pitch behavior, conservative base visibility, improved off-screen guidance, compact confidence/provenance UI, and minimal backward-compatible anchor model groundwork.

This spec does not approve product-code implementation by itself. It is the deterministic implementation artifact requested by `specs/RFC-map-anchored-beacon-system.md` and `specs/SPEC-003-map-backed-beacon-anchoring-technical-plan.md`.

## 2. Selected Route

Selected route: Phased Core PWA Upgrade.

Persistence posture: local-first browser `localStorage`.

Provider/system posture: no external provider, no backend, no native/mobile route, no ARCore SDK, no map tiles, no paid API, no environment variables, and no tokens.

User-facing behavior:

- Placement remains camera-first.
- The user is guided to aim at the intended beacon base or ground target.
- The PWA saves an approximate browser-derived base anchor using the existing GPS, heading, and default 100-meter placement model.
- Weak GPS, heading, or orientation confidence produces warning/status treatment but does not block saving when required location and heading data exist.
- The PWA must not claim exact ground-plane, terrain, depth, line-of-sight, obstruction, VPS, or ARCore accuracy.

## 3. Source Map

- `PRD.md` - Product direction for ground/base-oriented approximate PWA placement, save-with-warning confidence behavior, tall skyward columns, and no required visible map interaction.
- `SRS.md` - Requirement-level source for REQ-012, REQ-020 through REQ-026, REQ-054, DATA-001, DATA-003, NFR-001, NFR-004, and NFR-005.
- `technical-specification.md` - Current MVP architecture, storage model, geospatial model, and browser-local constraints.
- `specs/RFC-map-anchored-beacon-system.md` - Architecture RFC selecting the first PWA implementation slice and forbidding providers/native/backend work from this artifact.
- `specs/SPEC-003-map-backed-beacon-anchoring-technical-plan.md` - Conditional technical plan, especially Section 6A.
- `specs/RFC-BUG-11-beacon-multiple-placement-jump.md` - Tactical stabilization context only; not included in this first slice by default.
- `components/SkyBeaconApp.tsx` - Owns placement preview, draft creation, sensor confidence, beacon CRUD, and user messaging.
- `components/beacons/BeaconOverlay.tsx` - Owns directional rendering, preview rendering, and off-screen indicator selection.
- `components/beacons/BeaconPillar.tsx` - Owns beacon column, base ring, label, confidence style, and selection hit target.
- `components/beacons/OffscreenIndicator.tsx` - Owns horizontal off-screen beacon cues.
- `components/beacons/BeaconDrawer.tsx` - Owns selected beacon management and should surface compact anchor source/confidence.
- `components/hud/BottomActionBar.tsx` - Owns placement-mode summary and preview/confirm controls.
- `components/hud/SensorStatusBar.tsx` - Owns compact sensor status, not full per-beacon provenance.
- `lib/beacons/beacon-types.ts` - Current beacon record and draft shape.
- `lib/beacons/validation.ts` - Current beacon validation, slot, name, confidence, and coordinate guards.
- `lib/beacons/beacon-service.ts` - Current localStorage normalization, creation, replacement, and update boundary.
- `lib/geospatial/overlay-position.ts` - Current horizontal field-of-view mapping.
- `lib/sensors/use-orientation.ts` - Current heading and raw pitch source.
- `lib/sensors/confidence.ts` - Current sensor confidence derivation and labels.
- `app/globals.css` - Current visual treatment for beacon pillars, base rings, off-screen indicators, drawer rows, and HUD panels.
- `tests/unit/beacons.test.ts` - Existing beacon schema, localStorage, and confidence coverage.
- `tests/unit/geospatial.test.ts` - Existing geospatial and overlay-position coverage.
- `tests/e2e/sky-beacon.smoke.spec.ts` - Existing smoke coverage for camera fallback, drawer persistence, and permission controls.

## 4. Current Behavior Diagnosis

Current behavior is useful but undersells the intended product concept:

- `BeaconOverlay` maps bearing to horizontal screen position but treats pitch only as a simple `bottomPercent` adjustment.
- `BeaconPillar` always renders one full vertical column plus a base ring when horizontally visible.
- Straight-ahead viewing can imply that the beacon base is visible even when the app has no obstruction or ground-plane evidence.
- Saved records have a single `confidence` field tied mostly to sensor quality; they do not distinguish approximate camera anchors from future map-backed, ARCore, or visually refined anchors.
- The drawer shows raw lowercase confidence and local storage status, but not a clear selected-beacon source label.
- Off-screen indicators only communicate left/right, not that the useful beacon segment may be above or below the current camera frame.

The first PWA upgrade should improve the rendering and status contract without redesigning persistence or claiming more precision than the browser can prove.

## 5. Goals

- Make saved and preview beacons read as tall sky-reaching columns, not small always-visible markers.
- Preserve the product concept of a durable approximate base anchor plus a skyward column.
- Guide placement as a ground/base-oriented action while clearly labeling the resulting PWA anchor as approximate.
- Use pitch/orientation where available so the rendered segment depends on the estimated camera frame.
- Hide, fade, clip, or imply the base when base visibility is unknown or browser-approximated.
- Improve off-screen cues for beacons outside the current horizontal or vertical camera frame.
- Separate sensor confidence from anchor source/confidence in data and UI.
- Keep legacy localStorage records readable.
- Keep changes local to the existing PWA.

## 6. Non-Goals

- Do not implement BUG-11 stabilization in this first slice by default.
- Do not add Geoapify, MapTiler, Mapbox, Google Maps Platform, Supabase, Firebase, public OSM services, or any other provider.
- Do not add backend routes, server persistence, accounts, cloud sync, shared beacons, environment variables, tokens, paid APIs, or live map calls.
- Do not add native Android, iOS, Unity, ARCore, ARKit, WebXR, VPS, depth, or visual-recognition dependencies.
- Do not persist raw camera images or image-derived descriptors.
- Do not introduce a full nested anchor object, mandatory altitude, mandatory vertical extent, mandatory base-visibility persistence, complete provenance history, backend-owned IDs, or irreversible localStorage migration.
- Do not require traditional map interaction for placement.
- Do not show precise distance, exact line-of-sight, or validated obstruction claims.

## 7. Requirements

### 7.1 Functional Requirements

- Start preview with copy and visual state that frames the action as aiming at the beacon base or ground target.
- Save a beacon only when required location and heading data exist.
- Save weak-confidence placements with warning/status treatment instead of blocking them.
- Render visible beacons as segmented vertical markers with separate base and column treatments.
- Render the base only when the estimated camera frame includes it and the route allows a conservative approximate base display.
- Render upper skyward column treatment when the user looks upward while aimed at or rotating toward the beacon bearing.
- Hide the beacon itself and show off-screen guidance when no segment is estimated to be in frame.
- Show compact source/confidence labels only in selected-beacon, drawer, or brief warning surfaces.

### 7.2 Non-Functional Requirements

- The camera overlay must remain readable with three saved beacons.
- Visual changes must not block the reticle, bottom action controls, preview controls, drawer, or permission chips.
- Helper logic for anchor presentation and pitch/frame resolution must be pure and unit-tested.
- CI tests must not depend on live device sensors, third-party network calls, hardware, paid services, or credentials.
- The implementation must continue to build as the existing Next.js PWA.

### 7.3 Compatibility Requirements

- Existing records without new anchor fields must load as approximate camera-created anchors.
- Existing fields `latitude`, `longitude`, `confidence`, `placementHeading`, and `placementDistanceMeters` remain the durable MVP coordinate model.
- The maximum of three active beacons remains unchanged.
- Stored record validation ignores malformed optional anchor fields without dropping otherwise valid legacy beacon records.
- Beacon CRUD, rename, recolor, delete, undo, clear-all, replacement, onboarding, and permission retry flows remain in scope for regression testing.

## 8. Proposed Data And Rendering Contract

### 8.1 Minimal Anchor Fields

Add only optional, backward-compatible local fields if implementation needs persisted source/confidence display:

```ts
export type AnchorSource =
  | "camera"
  | "metadata-enriched"
  | "map-cross-referenced"
  | "map-created"
  | "map-confirmed"
  | "map-adjusted"
  | "arcore-geospatial"
  | "visual-refined";

export type BaseVisibility = "visible" | "obstructed" | "unknown" | "approximated";

export interface BeaconRecord {
  anchorSource?: AnchorSource;
  anchorConfidence?: BeaconConfidence;
}

export interface BeaconDraft {
  anchorSource?: AnchorSource;
  anchorConfidence?: BeaconConfidence;
}
```

Do not persist `baseVisibility` in the first slice unless implementation discovers a strong local reason. Prefer deriving `baseVisibility` in the render helper as `approximated` or `unknown` because the browser route has no validated obstruction evidence.

Default rules:

| Stored state | Normalized source | Normalized anchor confidence | Render base visibility |
| --- | --- | --- | --- |
| Legacy record with no anchor fields | `camera` | existing `confidence` or `unknown` | `approximated` when helper estimates base frame, otherwise `unknown` |
| New PWA camera placement | `camera` | draft `confidence` | `approximated` |
| Malformed source | `camera` | existing `confidence` or `unknown` | `unknown` |
| Malformed anchor confidence | source-specific default | existing `confidence` or `unknown` | helper-derived |

### 8.2 User-Facing Labels

Use a small source-label helper, for example `lib/beacons/anchor-presentation.ts`.

| Anchor source | UI source label |
| --- | --- |
| `camera` | `Approximate` |
| `metadata-enriched` | `Map-backed` |
| `map-cross-referenced` | `Map-backed` |
| `map-created` | `Map-confirmed` |
| `map-confirmed` | `Map-confirmed` |
| `map-adjusted` | `Map-confirmed` |
| `arcore-geospatial` | `AR-anchored` |
| `visual-refined` | `Visually refined` |

Confidence labels:

| Data value | UI confidence label |
| --- | --- |
| `high` | `High` |
| `medium` | `Medium` |
| `low` | `Low` |
| `unknown` | `Unknown` |

The existing `confidenceLabel()` can keep its sensor/HUD wording if useful, but selected beacon and drawer source/confidence display should use the plain source plus confidence vocabulary above.

### 8.3 Frame Resolution Helper

Add a pure helper such as `lib/geospatial/beacon-frame.ts`.

> **Superseded model note (2026-06-25):** The original §8.3 design described a
> *discrete segment selector* (`base` / `middle` / `upper` / `outside`) keyed
> off `cameraElevationDegrees = 90 - beta`. That model was abandoned during
> implementation in favor of a **continuous world-space-column framing model**
> driven directly by `DeviceOrientationEvent.beta`. The discrete `segment` /
> `baseTreatment` fields and the `base`/`middle`/`upper`/`outside` CSS classes
> no longer exist. The contract below is the operative one; the old segment
> table is retained only as history. See Addendum 1 for the device-spike
> rationale and the pitch-sign verification.

**Continuous vertical-framing model (operative contract):**

The beacon is a tall world-space column (`COLUMN_VH_PERCENT = 300` viewport-%).
The **BASE rests at `BASE_BETA` (~30)** — the "look down at the ground in front
of you" pose, near the bottom of the screen with the shaft rising upward.
Panning up (increasing beta toward `TOP_BETA` ~160) slides the column downward
through the frame: the base exits the bottom, the shaft fills the view, and the
cap rises toward center. **Full strength is maintained from `BASE_BETA` to
`FADE_START_BETA` (~155)** — there is no early fade; only past 155 does the
column dim, fully out by `FADE_END_BETA` (~165). Panning below `BASE_BETA`
keeps the base in view.

```ts
export type PitchQuality = "measured" | "heading-only" | "unusable";
export type VerticalHint = "raise" | "lower" | "center" | null;

export interface BeaconFrameInput {
  horizontalVisible: boolean;
  pitchDegrees: number | null;  // raw DeviceOrientationEvent.beta
  baseVisibility: BaseVisibility;
}

export interface BeaconFrameResult {
  inView: boolean;            // any part of the column overlaps [0,100]
  bottomPercent: number;      // live continuous offset of column bottom edge
  baseStrength: number;       // continuous 0..1, drives --base-strength CSS var
  baseVisibility: BaseVisibility;
  pitchQuality: PitchQuality;
  verticalHint: VerticalHint;
}
```

Constants:

```ts
export const COLUMN_VH_PERCENT = 300;        // 3x viewport column
export const BASE_BETA = 30;                 // base rests here (look-down pose)
export const TOP_BETA = 160;                 // cap reaches screen center here
export const FADE_START_BETA = 155;          // no fade before this
export const FADE_END_BETA = 165;            // fully out here
export const BASE_BOTTOM_PERCENT = 88;       // base near bottom of screen at BASE_BETA
export const TOP_BOTTOM_PERCENT = 50 - COLUMN_VH_PERCENT;  // -250, cap at center at TOP_BETA
export const BOTTOM_PERCENT_PER_BETA =
  (BASE_BOTTOM_PERCENT - TOP_BOTTOM_PERCENT) / (TOP_BETA - BASE_BETA);  // ~2.6
export const HEADING_ONLY_BOTTOM_PERCENT = BASE_BOTTOM_PERCENT;
```

Resolution:

```ts
// Verified pitch sign (Addendum A spike): elevation = beta - 90.
export function normalizeCameraElevation(beta: number): number { return beta - 90; }
export function betaToBottomPercent(beta: number): number {
  return BASE_BOTTOM_PERCENT - (beta - BASE_BETA) * BOTTOM_PERCENT_PER_BETA;
}
export function resolveBaseStrength(beta: number): number {
  if (beta <= FADE_START_BETA) return 1;          // full until 155
  if (beta >= FADE_END_BETA) return 0;            // out by 165
  return 1 - smoothstep(FADE_START_BETA, FADE_END_BETA, beta);
}
```

**`inView`** is true whenever the column `[bottomPercent, bottomPercent + COLUMN_VH_PERCENT]` overlaps the `[0, 100]` screen window — i.e. the column's top is below the screen top AND the column's bottom is above the screen bottom. Because the column is 3x viewport and rises from the base, the base sliding above the screen top does **not** eject the beacon; the shaft remains visible.

**`verticalHint`**: `"raise"` when `beta >= FADE_END_BETA` (panned past the top), `"lower"` when `beta < BASE_BETA` (below the base), else `null`.

**Heading-only fallback** (`pitchDegrees === null`): rest at the base pose (`bottomPercent = BASE_BOTTOM_PERCENT`, `baseStrength = 1`). No false vertical precision.

If a future device reports beta inverted relative to the verified W3C frame (beta increases toward the ground), flip the sign in `normalizeCameraElevation` and update the frame tests. That does not require an RFC amendment unless product behavior, the dependency set, or approved scope changes.

### 8.4 Renderable Beacon Helper

Add a pure helper such as `lib/beacons/renderable-anchor.ts` if it keeps React components simple.

Responsibilities:

- Normalize legacy beacon source/confidence.
- Map source and confidence to compact labels.
- Derive the first-slice render base visibility as `approximated` for PWA camera anchors unless data explicitly says otherwise.
- Return the props `BeaconOverlay` needs to render `BeaconPillar` or `OffscreenIndicator`.
- Never perform provider/network calls.

## 9. Detailed Implementation Plan

### Phase 0: Preflight And Scope Check

- [ ] From repo root `C:\Skymark`, read `PRD.md`, `SRS.md`, `technical-specification.md`, `specs/RFC-map-anchored-beacon-system.md`, `specs/SPEC-003-map-backed-beacon-anchoring-technical-plan.md`, and this file.
- [ ] Confirm implementation approval is explicit in the active task before editing product code.
- [ ] Run `git status --short` and preserve unrelated user changes.
- [ ] Confirm the route is still the Phased Core PWA Upgrade.
- [ ] Confirm no provider, backend, native/mobile, ARCore, WebXR, visual recognition, or BUG-11 stabilization work is being added in this slice.

### Phase 1: Anchor Model Groundwork

Expected files:

- `lib/beacons/beacon-types.ts`
- `lib/beacons/validation.ts`
- `lib/beacons/beacon-service.ts`
- New optional `lib/beacons/anchor-presentation.ts`
- `tests/unit/beacons.test.ts`

Tasks:

- [ ] Add optional `AnchorSource` and `anchorSource` fields to `BeaconRecord` and `BeaconDraft`.
- [ ] Add optional `anchorConfidence` using `BeaconConfidence`; do not create a separate confidence enum unless product semantics diverge.
- [ ] Add `BaseVisibility` type for render helper and future compatibility.
- [ ] Add validation guards for `AnchorSource` and optional `anchorConfidence`.
- [ ] Update localStorage normalization so legacy records default to source `camera` and anchor confidence equal to existing `confidence`.
- [ ] Update `draftRecord()` so new local PWA records save `anchorSource: "camera"` and `anchorConfidence: draft.confidence`.
- [ ] Keep malformed optional anchor fields from invalidating otherwise valid records.
- [ ] Add helper tests for legacy defaults, valid new fields, malformed optional fields, and no schema migration requirement.

### Phase 2: Rendering Contract And Pitch Helper

Expected files:

- New `lib/geospatial/beacon-frame.ts`
- `lib/geospatial/overlay-position.ts`
- `components/beacons/BeaconOverlay.tsx`
- `tests/unit/geospatial.test.ts` or new `tests/unit/beacon-frame.test.ts`

Tasks:

- [ ] Implement `resolveBeaconFrame()` as a pure helper using the contract in Section 8.3.
- [ ] Keep `mapBearingToOverlayX()` responsible only for horizontal bearing-to-screen mapping.
- [ ] Update `BeaconOverlay` to combine horizontal overlay state with `resolveBeaconFrame()`.
- [ ] Render no `BeaconPillar` when the helper returns `outside`; render `OffscreenIndicator` instead.
- [ ] Preserve preview rendering, but pass the same frame logic so preview can show base/middle/upper states.
- [ ] Add tests for horizontal off-screen, heading-only fallback, approximate base segment, unknown base visibility, upper column segment, and middle segment.

### Phase 3: Visual Scale And Verticality

Expected files:

- `components/beacons/BeaconPillar.tsx`
- `app/globals.css`
- Optional `components/beacons/BeaconOverlay.tsx`

Tasks:

- [ ] Extend `BeaconPillar` props to accept `segment`, `baseTreatment`, `sourceLabel`, and compact confidence data as needed.
- [ ] Split the visual treatment into recognizable column, cap/core, and base/ring elements.
- [ ] Make the column feel taller and more skyward without blocking the bottom dock or top sensor bar.
- [ ] Apply segment-specific classes, for example upper-only, middle, base-visible, base-soft, and base-hidden.
- [ ] For `baseTreatment: "soft"`, render a faded or implied base/ring; do not draw it as definite ground contact.
- [ ] For `baseTreatment: "hidden"`, hide the base/ring while preserving the useful column segment when appropriate.
- [ ] Keep selected and preview states visibly distinct.
- [ ] Preserve pointer hit targets and accessible labels.

### Phase 4: Ground/Base-Oriented Placement UX

Expected files:

- `components/SkyBeaconApp.tsx`
- `components/hud/BottomActionBar.tsx`
- `components/beacons/BeaconOverlay.tsx`
- `app/globals.css`
- `tests/e2e/sky-beacon.smoke.spec.ts`

Tasks:

- [ ] Update preview entry messaging so the user is guided to aim at the intended beacon base or ground target.
- [ ] Keep the saved coordinate calculation as `destinationPoint(current GPS, heading, 100m)`.
- [ ] Keep save-with-warning behavior: weak confidence shows warning/status but does not block confirmation when GPS fix and heading exist.
- [ ] Keep the block condition strict: no save when required location or heading is unavailable or unusable.
- [ ] Ensure draft creation includes `anchorSource: "camera"` and `anchorConfidence: confidence`.
- [ ] Keep wording honest: `Approximate` for PWA placement, no exact ground/depth/line-of-sight claims.
- [ ] Keep preview controls compact and thumb-accessible.

### Phase 5: Off-Screen Guidance And Selected-Beacon Status

Expected files:

- `components/beacons/OffscreenIndicator.tsx`
- `components/beacons/BeaconDrawer.tsx`
- `components/hud/BottomActionBar.tsx`
- Optional `components/hud/ToastViewport.tsx`
- `app/globals.css`
- `tests/e2e/sky-beacon.smoke.spec.ts`

Tasks:

- [ ] Extend off-screen indicator props with optional vertical hint state from `resolveBeaconFrame()`.
- [ ] Preserve the existing left/right cue and add a compact up/down/center cue only when useful.
- [ ] Avoid long instructional text in the camera overlay.
- [ ] Show selected-beacon or drawer status as source plus confidence, for example `Approximate / Low`.
- [ ] Keep per-beacon overlay labels sparse; do not add persistent source/confidence text to every beacon.
- [ ] Ensure drawer rows remain readable on narrow mobile widths.

### Phase 6: Validation And QA

Expected files:

- `tests/unit/beacons.test.ts`
- `tests/unit/geospatial.test.ts` or new `tests/unit/beacon-frame.test.ts`
- `tests/e2e/sky-beacon.smoke.spec.ts`
- `app/globals.css`

Tasks:

- [ ] Add unit tests for optional anchor field normalization and malformed optional field handling.
- [ ] Add unit tests for pitch/frame segment behavior and heading-only fallback.
- [ ] Add e2e coverage for seeded legacy records still rendering and showing approximate selected/drawer status.
- [ ] Add e2e coverage that weak confidence can still save when location and heading exist.
- [ ] Add e2e or component-level coverage for off-screen indicator behavior if stable in Playwright.
- [ ] Run all validation commands in Section 12.
- [ ] Perform manual mobile QA on Android Chrome or installed PWA mode when available.

## 10. Testing Strategy

### Unit Tests

- `validateBeaconRecord()` accepts records with valid optional anchor fields.
- `validateBeaconRecord()` does not reject otherwise valid legacy records without anchor fields.
- localStorage read/normalization defaults legacy records to approximate camera anchors.
- malformed optional anchor fields are repaired or ignored without dropping valid coordinates.
- `resolveBeaconFrame()` returns expected base, middle, upper, outside, heading-only, and unknown-base states.
- `resolveBeaconFrame()` never returns a definite visible base for `unknown` or `obstructed` base visibility.

### E2E Or Component Tests

- Seed a legacy beacon in localStorage, open the drawer, and verify it remains manageable.
- Seed a new PWA anchor with `anchorSource: "camera"` and `anchorConfidence: "low"`, then verify selected/drawer status uses `Approximate` and `Low`.
- Mock location and orientation, start preview, and verify save remains possible with low confidence when required readings exist.
- Verify off-screen indicator appears when a seeded beacon is outside horizontal FOV.
- Verify the app remains usable when pitch is unavailable.

### Manual QA

1. Open the app on Android Chrome in portrait mode.
2. Grant camera, GPS, and compass permissions.
3. Start preview and confirm copy/status asks the user to aim at the intended base or ground target.
4. Confirm that the preview reads as a tall skyward beacon.
5. Tilt toward the estimated base and confirm the base is shown only softly or when the helper allows it.
6. Tilt upward while aimed toward a beacon bearing and confirm the upper column remains useful.
7. Turn away from a beacon and confirm off-screen guidance is clear.
8. Place three beacons and confirm the overlay remains readable.
9. Reopen the app and confirm saved beacons persist with approximate source/confidence.
10. Test weak GPS or unstable heading and confirm warning-with-save behavior.

## 11. Rollout, Migration, And Backout

Rollout:

- Implement as normal PWA product code after explicit approval.
- Keep all work in existing app, component, lib, and test folders.
- Keep local-first persistence.
- Keep provider/native/backend work out of this slice.

Migration:

- No destructive migration is allowed.
- New fields must be optional.
- Legacy records must remain valid.
- If optional fields are absent, render as approximate camera anchors.

Backout:

- Visual changes should be isolated to `BeaconPillar`, `BeaconOverlay`, `OffscreenIndicator`, and CSS classes.
- Data model additions should be optional so disabling the new UI does not corrupt saved records.
- If pitch behavior proves unreliable, fall back to heading-only segment rendering while keeping source/confidence groundwork.

## 12. Validation Commands

Run from repo root `C:\Skymark` after implementation:

```powershell
npm run lint
npm run test
npm run test:e2e
npm run build
```

Documentation-only validation for this spec:

```powershell
git diff -- specs/RFC-map-anchored-beacon-system.md specs/SPEC-003-map-backed-beacon-anchoring-technical-plan.md specs/SPEC-004-phased-core-pwa-upgrade-implementation-spec.md
git status --short
```

## 13. Acceptance Criteria

- [ ] The implementation keeps the primary experience camera-first.
- [ ] The placement flow guides the user to aim at the intended beacon base or ground target.
- [ ] The saved PWA anchor remains labeled as approximate.
- [ ] Weak confidence produces warning/status treatment but does not block saving when required GPS and heading exist.
- [ ] Saved and preview beacons read as tall skyward columns.
- [ ] Pitch-aware rendering distinguishes base, middle, upper, and outside-frame states when pitch is available.
- [ ] Heading-only fallback remains stable when pitch is unavailable or unusable.
- [ ] The base is hidden, faded, clipped, or implied when visibility is unknown or approximated.
- [ ] The app never draws an obstructed or unknown base as definitely visible.
- [ ] Off-screen indicators remain available for beacons outside the current frame.
- [ ] The drawer or selected-beacon UI shows compact source/confidence language.
- [ ] Legacy localStorage records remain readable and manageable.
- [ ] No provider SDK, backend route, environment variable, token, native/mobile file, ARCore SDK, map tile dependency, WebXR dependency, or visual-recognition feature is added.
- [ ] `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run build` pass, or any failure is documented with a specific blocker.

## 14. Agent Execution Contract

### Preconditions

- Work from repo root `C:\Skymark`.
- Read this spec plus all files in Section 3 before editing.
- Implementation approval must be explicit in the active task.
- Preserve unrelated user changes.

### Approved Scope

- Implement only the Phased Core PWA Upgrade described in this spec.
- Keep changes inside the existing PWA app, component, lib, CSS, and test files named above unless implementation discovers a small local helper file is needed.
- Keep all new helpers pure where possible.

### Expected Files Or Modules

- `components/SkyBeaconApp.tsx` - Placement copy, draft source/confidence fields, save-with-warning behavior.
- `components/beacons/BeaconOverlay.tsx` - Compose horizontal overlay and pitch/frame resolution.
- `components/beacons/BeaconPillar.tsx` - Segmented beacon visual states.
- `components/beacons/OffscreenIndicator.tsx` - Enhanced off-screen guidance.
- `components/beacons/BeaconDrawer.tsx` - Compact selected/source confidence display.
- `components/hud/BottomActionBar.tsx` - Placement-mode summary wording if needed.
- `lib/beacons/beacon-types.ts` - Optional anchor source/confidence and base visibility types.
- `lib/beacons/validation.ts` - Optional anchor field guards.
- `lib/beacons/beacon-service.ts` - Backward-compatible normalization and draft defaults.
- New `lib/beacons/anchor-presentation.ts` - Source/confidence label mapping if useful.
- New `lib/geospatial/beacon-frame.ts` - Pure pitch/frame helper.
- `app/globals.css` - Visual segment and status classes.
- `tests/unit/beacons.test.ts` - Data model regression coverage.
- `tests/unit/geospatial.test.ts` or `tests/unit/beacon-frame.test.ts` - Frame helper coverage.
- `tests/e2e/sky-beacon.smoke.spec.ts` - Browser-flow regressions.

### Forbidden Changes

- Do not implement BUG-11 stabilization unless the user explicitly adds that scope.
- Do not add provider SDKs, live provider calls, map tiles, backend routes, server persistence, accounts, cloud sync, environment variables, tokens, paid APIs, native/mobile files, ARCore SDKs, WebXR dependencies, or visual-recognition code.
- Do not persist raw camera imagery or descriptors.
- Do not make map interaction required.
- Do not make optional new anchor fields mandatory.
- Do not break legacy localStorage records.
- Do not show exact distance, validated obstruction, validated line-of-sight, exact terrain contact, or AR/VPS-level accuracy claims.

### Stop Conditions

- Stop if implementation requires external services, credentials, provider accounts, paid APIs, native hardware, or production access.
- Stop if the required data model becomes an irreversible migration.
- Stop if pitch behavior cannot be made stable enough for heading-only fallback.
- Stop if visual changes make the camera overlay unreadable with three beacons.
- Stop if implementation needs to choose a provider, backend, native route, visual-recognition route, or visible-map route.

### Amendment Triggers

- A provider, backend, native/mobile, ARCore, WebXR, depth, visual-recognition, or map dependency becomes necessary.
- The implementation needs to change the persistence posture away from local-first browser storage.
- The implementation needs a full nested anchor schema, mandatory altitude, complete provenance history, or irreversible migration.
- Manual device testing invalidates the basic pitch model in a way that cannot be fixed inside the pure helper and tests.
- Product direction changes from approximate PWA demo upgrade to true accurate geospatial anchoring.

### Handoff Notes

- Treat `confidence` as the current sensor/placement quality field and `anchorConfidence` as the current anchor-position confidence field. In the first PWA slice they may share the same value, but the naming should prepare the code for future stronger sources.
- Treat `camera` anchor source as the local PWA's approximate source.
- Keep all UI copy short and status-like.
- Prefer helper functions over embedding geospatial or pitch rules directly in React components.
- Preserve the 3-beacon limit.

## 15. Open Questions

- During Android Chrome manual QA, does `DeviceOrientationEvent.beta` follow the assumed neutral/sign model, or should `normalizeCameraElevation` invert the sign?
- Should the first implementation persist `anchorSource` and `anchorConfidence`, or derive them for legacy records and only persist them on newly created records?
- Should base visibility remain purely derived in render state for the first slice, or should `baseVisibility` be optionally persisted for future seeded tests?
- Is the current compact drawer enough for source/confidence display, or should selected-beacon status also appear in the bottom sheet?
