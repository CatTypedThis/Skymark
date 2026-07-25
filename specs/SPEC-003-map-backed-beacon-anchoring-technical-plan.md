# Technical Plan: Camera-First Geospatial Beacon Anchoring Implementation Guidance

Spec Type: Technical Implementation Guidance
Status: Draft
Date: 2026-06-19
Source RFC: `specs/RFC-map-anchored-beacon-system.md`
Source Requirements: `PRD.md`, `SRS.md`, `technical-specification.md`
Related RFCs: `specs/RFC-BUG-11-beacon-multiple-placement-jump.md`
Related Implementation Specs: `specs/SPEC-004-phased-core-pwa-upgrade-implementation-spec.md`
Implementation Approval: Required
Repo Root: `C:\Skymark`

## 1. Purpose

This specification converts the high-level concept in `specs/RFC-map-anchored-beacon-system.md` into conditional technical guidance for future AI implementation agents.

The RFC owns the product concept, candidate route framing, approval gates, and route-selection evidence. This spec owns the implementation-shaped details that should guide agents after a route is selected.

This spec does not approve product-code changes by itself. The selected first implementation artifact is `specs/SPEC-004-phased-core-pwa-upgrade-implementation-spec.md`; creating or updating that artifact should produce planning documentation, not app code.

## 2. Preconditions

Before implementing from this spec:

- The agent must read `PRD.md`, `SRS.md`, `technical-specification.md`, `specs/RFC-map-anchored-beacon-system.md`, and this file.
- A route-selection RFC or explicit user instruction must choose an anchoring route:
  - dual-track PWA demo plus ARCore Geospatial accuracy prototype,
  - native/mobile ARCore Geospatial accuracy prototype,
  - PWA demo enhancements only,
  - camera-only UX with hidden map/geospatial resolution,
  - backend or service-side map/geospatial cross-reference,
  - separate visible map UI,
  - hybrid hidden resolution plus separate visible map UI,
  - tactical BUG-11 stabilization only,
  - close-range visual refinement research only,
  - deferral.
- The same route-selection step must choose a persistence posture:
  - local-first browser storage for the initial post-MVP route,
  - backend/server-side persistence,
  - hybrid local cache plus server persistence,
  - persistence research only,
  - deferral.
- Provider, token, pricing, attribution, licensing, hosting, budget, and privacy questions must be resolved before adding provider dependencies, backend calls, databases, hosted services, or external accounts.
- Native/mobile framework, supported-device, Google Cloud/API, ARCore SDK, and demo-location questions must be resolved before adding native/Unity/mobile project files or ARCore dependencies.
- Product code must remain unchanged until implementation approval is explicit.

### Route Selection Prompt

If the user asks an implementation agent to build from this spec without naming a route, the agent must stop and ask for route selection before editing product code.

The prompt must ask for:

- Anchoring route: dual-track PWA demo plus ARCore Geospatial accuracy prototype, native/mobile ARCore Geospatial accuracy prototype, PWA demo enhancements only, camera-only UX with hidden map/geospatial resolution, backend/service-side cross-reference, separate visible map UI, hybrid hidden resolution plus separate visible map UI, tactical BUG-11 stabilization only, close-range visual refinement research only, or deferral.
- Persistence posture: local-first browser storage, backend/server-side persistence, hybrid local cache plus server persistence, persistence research only, or deferral.
- Provider/system posture: ARCore Geospatial prototype, Geoapify metadata provider, provider research only, managed hidden resolver provider, backend/self-hosted geospatial service, device/platform geospatial API, visual-positioning research, staged hybrid, separate visible-map provider, or deferral.
- User setup posture: no account or purchase, free-tier/account acceptable, paid subscription acceptable with a budget cap, self-host/static hosting acceptable, or needs more research.
- Native/mobile posture: keep PWA only, create native Android prototype, create Unity/AR Foundation prototype, research iOS route, or defer native work.

### Source RFC AI Recommendation

The source RFC recommends Route E: Dual-Track PWA Demo Plus ARCore Accuracy Prototype. For implementation agents, that means:

- The primary placement flow must remain camera-only from the user's perspective.
- Google ARCore Geospatial is the first recommended accuracy proof for real camera-based placement.
- The existing Next/PWA app should remain the short-term working demo/product shell unless a later accepted RFC approves a platform migration.
- Geoapify is the first recommended map/location metadata provider for address, place, route, nearby-context, and enrichment data. It is not the primary accuracy provider.
- Do not add a production map provider, backend persistence provider, paid API, account-bound service, or provider token from this spec alone.
- Do not add native/Unity/mobile project files, ARCore SDK dependencies, Google Cloud/API configuration, or ARCore-specific runtime behavior from this spec alone.
- Keep local-first persistence as the default until a route-selection RFC or explicit user instruction approves backend/server-side persistence.
- Treat the shared anchor data model, confidence vocabulary, and demo/accuracy distinction as the safest first implementation prerequisites because they support PWA approximation, ARCore anchors, metadata enrichment, optional map UI, hybrid, and later visual refinement.
- Preserve the product concept that each beacon has a durable ground/base anchor and a tall skyward column; future obstruction-aware routes may hide or clip the base while leaving the upper column useful.
- The selected first implementation slice is the Phased Core PWA Upgrade. It should include six phased local-PWA workstreams: visual scale/verticality, pitch behavior, conservative base visibility, off-screen guidance, confidence/provenance UI, and minimal backward-compatible anchor model groundwork. Placement should be ground/base-oriented: guide the user to aim at the intended beacon base or ground target, then preview the column from an approximate browser-derived base anchor. It must not add providers, backend routes, native files, tokens, paid APIs, depth claims, or VPS claims.
- If the next approved step is a separate visible-map prototype, recommend MapLibre GL JS plus MapTiler Cloud as the first managed candidate and MapLibre GL JS plus Protomaps/PMTiles as the cheap/open-source-leaning alternative.
- If the next approved step is backend/server-side persistence, recommend Supabase Postgres/PostGIS as the first backend candidate to validate.
- Do not use public OpenStreetMap Foundation tiles, public Nominatim, or public Overpass services as production app dependencies.

### External System Decision Checklist

Before editing product code for any provider, backend, database, hosted service, account-bound API, or self-hosted/static tile system, the implementation agent must record:

- The selected provider/system and the strongest rejected alternative.
- Official documentation and pricing/limit sources checked on the current date.
- What the user must set up, purchase, subscribe to, host, secure, monitor, or maintain.
- Required attribution, licensing, data-retention, and privacy disclosures.
- Token or secret handling, including whether the key can be exposed client-side.
- Budget cap, free-tier exhaustion behavior, and the stop condition for unexpected billing.
- For ARCore: supported-device requirements, VPS availability for demo locations, API quotas, native/Unity tooling, and manual outdoor QA plan.
- Offline, slow-network, quota-exceeded, provider-error, and provider-unavailable behavior.
- Test strategy that avoids third-party network calls in CI.

If any of those items is unknown, the agent must stop and ask for provider/system approval or create a provider RFC before adding dependencies or network calls.

### Curated Provider/System Baseline

| System Posture | Current Recommendation | User Setup | Agent Notes |
| --- | --- | --- | --- |
| Google ARCore Geospatial | First recommended accuracy prototype | Google Cloud/API setup, ARCore-capable device, native Android/Unity/iOS route decision, demo-location VPS checks | Must prove camera placement and recovery; not a PWA drop-in; document tracking state, VPS availability, anchor type, confidence, fallback, and manual QA |
| Geoapify metadata provider | First recommended metadata/context provider | Geoapify account, API key, free-tier/credit limits, privacy disclosure if coordinates leave device | Use for address/place/route/elevation/nearby context; keep behind adapter; do not treat as placement truth |
| PWA demo enhancements | Recommended parallel short-term product surface | None unless Geoapify or another provider is approved | Improve confidence/provenance/demo clarity while clearly labeling approximate placement |
| Hidden geospatial resolver | Support route for PWA/backend enrichment, not the first accuracy proof | Depends on selected provider/API/backend/self-hosted data | May enrich or sanity-check camera drafts without visible map interaction; cannot claim ARCore-level accuracy |
| No external system; local-first anchor model | Useful for schema/types/normalization and PWA demo work | None | Safe for local model work after implementation approval; cannot be presented as accurate geospatial placement |
| MapLibre plus MapTiler Cloud | First managed visible-map prototype candidate only if separate map UI is approved | MapTiler account, API key, attribution UI, plan verification | Use a provider adapter; mock maps/search; do not commit keys; show loading/error/quota states |
| MapLibre plus Protomaps/PMTiles | First cheap/open-source-leaning static map candidate only if separate map UI is approved | Static hosting/CDN or small regional PMTiles artifact, update plan, attribution review | Good for avoiding subscriptions; weak for search/geocoding/cross-reference; avoid bundling large files in the app |
| Public OSMF tiles, public Nominatim, public Overpass | Research only, not production | Policy compliance and attribution | Do not wire into production flows; use only for manual evidence or temporary research notes |
| Mapbox or Google Maps Platform | Commercial alternatives when richer data/search/places are required | Account, billing, API key restrictions, terms review | Require separate provider RFC and cost cap before SDK/API integration |
| Supabase Postgres/PostGIS | First backend persistence/geospatial storage candidate if backend persistence is approved | Supabase project, schema, RLS/privacy rules, env vars, possible paid plan | Requires persistence approval, migrations, API/server boundary, privacy disclosure, sync/conflict rules |
| Firebase/Firestore | Secondary backend sync alternative | Firebase project, security rules, billing posture | Consider only if realtime sync outweighs relational geospatial modeling needs |

## 3. Architecture Invariants

- Camera-first experience remains primary.
- The primary placement flow must not require traditional map interaction.
- ARCore Geospatial is the first recommended accuracy proof unless a later RFC proves a better spatial reference system.
- The PWA remains the short-term demo/product shell and must label approximate placement honestly.
- The PWA should be improved as a convincing concept demo, not left as a minimal placeholder while native/ARCore work proceeds.
- Geoapify and similar map/location providers enrich anchors with metadata/context; they do not replace ARCore/VPS for placement accuracy.
- Visible map UI is optional and separate unless a route-selection RFC chooses it as its own feature.
- Backend/service-side cross-reference or equivalent resolver processing may improve PWA metadata/confidence, but ARCore/native evidence is required before claiming true accurate camera placement.
- Close-range visual refinement is research-only until privacy, performance, and fallback behavior are approved.
- Camera, cross-reference, optional map UI, persistence, and overlay rendering must share one anchor model when implemented.
- The shared model must preserve the distinction between durable base anchor, skyward beacon column, and base visibility/obstruction state where supported.
- Local-first browser storage is the default easier route until a route-selection RFC or explicit user instruction approves backend/server-side persistence.
- Backend/server-side persistence, accounts, cloud sync, or shared beacons are valid future decision paths, but they require explicit approval before implementation.
- Legacy MVP records must remain readable.
- Suggested corrections must not silently move a user's saved beacon unless a future product rule explicitly approves auto-application.
- Provider/network calls must not happen inside React render paths.
- The UI must distinguish sensor confidence from anchor confidence.

## 4. Phase 0: PRD/SRS And Technical-Spec Reconciliation

Expected documents:

- `PRD.md` - Product requirement source.
- `SRS.md` - Acceptance criteria source.
- `technical-specification.md` - MVP technical baseline that may need a post-MVP supplement.
- `specs/RFC-map-anchored-beacon-system.md` - Concept and route-framing RFC.
- `specs/RFC-BUG-11-beacon-multiple-placement-jump.md` - Tactical fixed-distance stabilization proposal.

Tasks:

- [ ] Confirm `PRD.md` and `SRS.md` distinguish backend/service-side map cross-reference from optional visible map UI.
- [ ] Confirm `PRD.md` and `SRS.md` state that accurate placement should happen through the camera without requiring traditional map interaction in the primary flow.
- [ ] Confirm `PRD.md` and `SRS.md` reflect the dual-track recommendation: preserve the PWA demo while validating Google ARCore Geospatial as the first accuracy prototype.
- [ ] Confirm `PRD.md` and `SRS.md` include anchor provenance, confidence, and optional close-range visual refinement.
- [ ] Confirm the selected persistence posture: local-first browser storage, backend/server-side persistence, hybrid local cache plus server persistence, persistence research only, or deferral.
- [ ] Confirm the selected provider/system posture: ARCore Geospatial prototype, Geoapify metadata provider, no external system, provider research only, managed map provider, static/self-hosted map tiles, backend persistence provider, commercial provider, or deferral.
- [ ] Confirm the selected native/mobile posture: keep PWA only, native Android prototype, Unity/AR Foundation prototype, native iOS research, or defer native work.
- [ ] Confirm the selected PWA demo posture: no PWA changes, BUG-11 stabilization, anchor provenance/confidence UI, Geoapify metadata enrichment, demo script polish, or other approved scope.
- [ ] If writing the first implementation spec, treat the selected slice as the Phased Core PWA Upgrade: visual scale/verticality, pitch behavior, conservative base hiding, off-screen guidance, confidence/provenance UI, and backward-compatible anchor model groundwork. Do not re-ask route selection unless the user changes scope.
- [ ] Confirm the selected hidden resolver posture if still relevant: managed provider APIs, backend/self-hosted geospatial service, device/platform geospatial API, visual-positioning research, staged hybrid, or deferral.
- [ ] If a provider/system is selected, update the route-selection RFC with current official pricing, limits, attribution/licensing, token handling, and user setup obligations before editing code.
- [ ] Record the AI agent's recommended provider/system option and the strongest rejected alternative.
- [ ] Decide whether `technical-specification.md` should be updated in place or supplemented by a post-MVP technical spec.
- [ ] Name the selected implementation route.
- [ ] Stop if the requested implementation path conflicts with PRD/SRS or if no route has been approved.

## 5. Phase 1: Shared Anchor Data Model

Expected files or modules:

- `lib/beacons/beacon-types.ts` - Extend `BeaconRecord` and `BeaconDraft`.
- `lib/beacons/validation.ts` - Validate anchor source, confidence, and coordinates.
- `lib/beacons/beacon-service.ts` - Normalize persisted records and preserve legacy records.
- `tests/unit/beacons.test.ts` - Add schema and migration regression coverage.

Candidate tasks:

- [ ] Add an `AnchorSource` type, likely including `camera`, `arcore-geospatial`, `map-cross-referenced`, `map`, `map-adjusted`, and `visual-refined`.
- [ ] Add an `AnchorConfidence` type or reuse `BeaconConfidence` only if product semantics match.
- [ ] For the first Phased Core PWA Upgrade, add only minimal optional provenance/confidence fields needed by the local demo and render helper.
- [ ] Defer full provenance history, nested anchor objects, mandatory altitude, and irreversible schema migration until a later route requires them.
- [ ] Leave room for optional altitude, vertical extent, and base-visibility metadata without requiring those fields for MVP records.
- [ ] Add a schema version or normalization strategy if optional fields become complex.
- [ ] Treat legacy records without provenance as approximate `camera` anchors.
- [ ] Reject or repair malformed provenance without dropping otherwise valid beacon coordinates.
- [ ] Keep the existing 3-beacon limit unless a separate product decision changes it.

Stop conditions:

- Stop if schema changes require irreversible migration.
- Stop if provenance requires backend accounts, cloud sync, or user identity that has not been approved by the selected persistence posture.
- Stop if the selected anchor model assumes provider metadata, remote IDs, accounts, or server-owned records that have not been approved by the provider/system posture.

## 6. Phase 2: Anchor Resolution And Overlay Contract

Expected files or modules:

- `components/beacons/BeaconOverlay.tsx` - Render from resolved anchor data.
- `lib/geospatial/bearing.ts` - Existing bearing helper.
- `lib/geospatial/overlay-position.ts` - Existing camera overlay mapping.
- New `lib/geospatial/anchor-resolution.ts` or `lib/anchors/anchor-resolution.ts` - Pure helper for resolving anchor coordinate, source, and confidence for rendering.
- `tests/unit/geospatial.test.ts` or new `tests/unit/anchor-resolution.test.ts` - Pure helper tests.

Candidate tasks:

- [ ] Define a pure `resolveRenderableAnchor(beacon, context)` helper that returns coordinate, source, confidence, and fallback reason.
- [ ] Preserve rendering semantics for a beacon base plus vertical skyward column, including a future base-visibility result if the selected route supports obstruction evidence.
- [ ] Keep `mapBearingToOverlayX()` responsible only for bearing-to-screen mapping.
- [ ] Keep missing or invalid provenance from crashing overlay rendering.
- [ ] Preserve preview-beacon behavior unless a selected implementation RFC explicitly changes it.
- [ ] Add unit tests for camera-created, ARCore geospatial, map-cross-referenced, map-created, map-adjusted, visually refined, and malformed anchors.

Stop conditions:

- Stop if rendering requires provider/network calls inside React render.
- Stop if confidence UI would imply exact line-of-sight, precise distance, or obstruction accuracy without supporting data.
- Stop if the implementation reduces beacons to flat pins or draws obstructed bases as definitely visible without supporting evidence.

## 6A. Selected First Slice: Phased Core PWA Upgrade

Use this phase for the first approved implementation spec unless the user supersedes the selection. The goal is to make the current PWA a convincing concept demo that approaches the final product feeling within browser limits while staying honest about approximate anchoring.

Handoff instruction for future agents: when asked to generate the first implementation spec, do not ask whether the first slice should be visual-only, technical-only, or split into separate specs. The selected handoff shape is one phased implementation spec covering the six local-PWA workstreams below. Ask follow-up questions only for unresolved implementation details inside those workstreams.

Next-artifact instruction: the next implementation-spec artifact is `specs/SPEC-004-phased-core-pwa-upgrade-implementation-spec.md`. The agent generating or updating it should create or update planning documentation and should not edit product code, tests, package dependencies, app configuration, provider configuration, backend routes, native/mobile files, or runtime behavior.

Expected files or modules:

- `components/beacons/BeaconPillar.tsx` - Increase visual scale, verticality, base/column distinction, confidence treatment, and obstruction-friendly clipping/fading behavior.
- `components/beacons/BeaconOverlay.tsx` - Improve camera-frame-aware pitch and off-screen rendering behavior while preserving bearing-based placement.
- `components/beacons/OffscreenIndicator.tsx` - Improve long-distance directional guidance for tall skyward beacons.
- `components/hud/SensorStatusBar.tsx` - Clarify approximate placement, sensor confidence, and anchor confidence.
- `components/beacons/BeaconDrawer.tsx` - Surface selected-beacon confidence/provenance if included in the slice.
- `lib/beacons/beacon-types.ts` and `lib/beacons/validation.ts` - Add only minimal backward-compatible provenance/confidence fields needed by the slice.
- `app/globals.css` - Support the visual upgrade without changing unrelated app layout.
- Relevant unit/component/e2e tests - Cover rendering, legacy record compatibility, and confidence/provenance behavior.

Candidate tasks:

- [ ] Make saved and preview beacons read as tall sky-reaching columns rather than small always-visible markers.
- [ ] Make placement ground/base-oriented by asking the user to aim at the intended beacon base or ground target before preview/confirmation.
- [ ] Treat the browser-derived placement as an approximate base anchor, not as a proven ground-plane, terrain, depth, or line-of-sight measurement.
- [ ] Preserve a visible distinction between beacon base, pulse/ring, and skyward column.
- [ ] Use pitch/orientation when available so visible beacon segments depend on the camera's estimated frame: heading controls horizontal visibility and pitch controls whether the base, middle column, upper column, or no segment is visible.
- [ ] Show the beacon base only when the camera is estimated to be aimed at the base and conservative obstruction rules allow it; do not show the base by default when looking straight ahead.
- [ ] Show the upper column when the user looks upward while aimed at or rotating toward the beacon's bearing.
- [ ] Hide the beacon itself and show only the off-screen indicator when the camera is tilted or rotated so no beacon segment is estimated to be in frame.
- [ ] Add conservative base hiding, clipping, fading, or implied-base behavior when base visibility is unknown or approximated.
- [ ] Avoid drawing an obstructed base as clearly visible unless a selected route has supporting evidence.
- [ ] Use the selected base-visibility vocabulary: UI states `Visible`, `Obstructed`, `Unknown`, and `Approximated`, backed by data values `visible`, `obstructed`, `unknown`, and `approximated`.
- [ ] Treat `Unknown` as missing evidence and `Approximated` as a conservative browser-limited estimate without validated obstruction evidence.
- [ ] Improve off-screen guidance so users can understand that a beacon extends upward outside the current camera framing.
- [ ] Use save-with-warning behavior for weak PWA confidence: show clear warning/status treatment and save confidence metadata, but do not block approximate placement when required location and heading data exist.
- [ ] Add or refine confidence/provenance labels that distinguish approximate PWA placement from future map-backed, ARCore, or visually refined states.
- [ ] Use the selected vocabulary: source labels `Approximate`, `Map-backed`, `Map-confirmed`, `AR-anchored`, and `Visually refined`; confidence levels `High`, `Medium`, `Low`, and `Unknown`.
- [ ] Keep confidence/status UI compact: show full labels for the selected beacon, brief warnings/status affordances, or drawer/selected-beacon controls, but do not add persistent labels to every beacon in the camera overlay.
- [ ] Keep the existing local-first storage posture and preserve legacy records.
- [ ] Keep the implementation free of provider SDKs, backend calls, map tiles, ARCore SDKs, native files, paid APIs, environment variables, and tokens.

Required implementation-spec phases:

1. Rendering contract: define how the PWA represents ground/base-oriented approximate placement, beacon base, skyward column, approximate anchor confidence, and fallback states.
2. Visual scale and verticality: make beacons taller, more readable, and closer to the intended final product.
3. Camera-frame-aware pitch behavior: use available orientation/pitch signals so the visible segment depends on whether the estimated camera frame intersects the base, middle column, or upper column. Define a stable heading-only fallback for unavailable, noisy, or unsupported pitch data.
4. Conservative base visibility: define and use the selected `Visible`, `Obstructed`, `Unknown`, and `Approximated` vocabulary; hide, fade, clip, or imply the base when visibility is unknown or approximated; do not claim validated obstruction awareness.
5. Off-screen guidance: improve guidance when a beacon is outside the current camera frame, especially when the useful target is the upper column.
6. Confidence/provenance and anchor model groundwork: add only minimal backward-compatible local fields, a pure render helper if useful, and UI language needed to distinguish approximate PWA anchors from future stronger anchors. Implement the selected save-with-warning behavior for weak PWA confidence and block saving only when required location or heading data is unavailable or unusable.

Deferred true-to-concept anchor work:

- Later PWA stages should move toward richer anchor semantics when map-backed, ARCore-derived, visual-refined, altitude-aware, or obstruction-aware routes require them.
- Do not add a full nested anchor object, mandatory altitude/vertical extent/base-visibility fields, complete provenance history, backend-owned record IDs, or irreversible localStorage migration in the first Phased Core PWA Upgrade.

BUG-11 rule:

- Do not include tactical BUG-11 stabilization in the first Phased Core PWA Upgrade implementation spec by default.
- Treat BUG-11 as a separate tactical follow-up only if QA after the upgrade shows jump/drift still materially harms the PWA demo.
- Do not let BUG-11 stabilization redirect the implementation back toward polishing fixed-distance placement as the long-term anchoring model.

Future PWA improvement ladder:

1. Local visual and interaction fidelity: beacon scale, verticality, pitch response, off-screen guidance, conservative base visibility, outdoor readability, and confidence messaging.
2. Local anchor model groundwork: backward-compatible provenance, anchor confidence, optional altitude/vertical extent/base-visibility fields, and renderable-anchor helpers.
3. Map-backed metadata or hidden cross-reference: Geoapify or another approved provider only after provider, token, quota, attribution, privacy, caching, and fallback rules are approved.
4. Optional visible map feature: map inspection, manual adjustment, or map-created beacons as a separate surface, with camera rendering still required.
5. AR/depth-based ground placement and browser-accessible precision research: ARCore/native depth, WebXR, browser geospatial AR, depth, visual positioning, or VPS-like capabilities must be explored as future routes for validating the intended base more accurately. Add them only if current platform/provider evidence proves they are realistic for the selected implementation surface.

Stop conditions:

- Stop if the implementation implies the PWA has final placement precision, validated line-of-sight, validated obstruction awareness, or ARCore/VPS-level accuracy.
- Stop if a future PWA precision improvement requires provider accounts, tokens, paid APIs, backend routes, native/AR SDKs, or live map data that have not been approved.
- Stop if beacon visual changes make the camera overlay unreadable, obscure core controls, or break the 3-beacon readability constraint.

## 7. Phase 3A: PWA Metadata Or Hidden Resolver Route

Use this phase for PWA demo improvements, metadata enrichment, or hidden map/geospatial cross-reference after route/provider selection approves that scope. This phase must not be presented as the first proof of true accurate camera placement; ARCore Geospatial owns that proof unless a later RFC supersedes it.

Provider/system guidance:

- PWA hidden resolution may use a provider API, a backend route, locally bundled/static geospatial data, device/platform geospatial APIs, visual-positioning evidence, or a self-hosted/open-source stack only after provider/system approval.
- Geoapify is the first recommended metadata provider if the user approves an account/API key, free-tier or budget cap, privacy disclosure, and provider adapter.
- Public OSMF Nominatim or Overpass endpoints are acceptable for manual research notes but not as production dependencies.
- If the selected route needs server-side geospatial storage or queries, validate Supabase Postgres/PostGIS first unless the provider RFC recommends another backend.
- If the selected route needs commercial geocoding/search, compare MapTiler, Mapbox, and Google Maps Platform against budget, data quality, token handling, and privacy needs before choosing.
- Do not expose a traditional map UI in this phase unless a separate visible-map feature is approved.

Expected files or modules:

- New `lib/anchors/hidden-resolver-types.ts` or `lib/anchors/cross-reference-types.ts` - Request, response, confidence, and correction result types.
- New `lib/anchors/hidden-resolver-service.ts` or `lib/anchors/cross-reference-service.ts` - Client-side orchestration or provider adapter boundary.
- Optional `app/api/anchors/cross-reference/route.ts` - Server route only if backend/service-side calls are approved.
- `components/SkyBeaconApp.tsx` - Trigger cross-reference after draft placement if selected.
- `components/hud/SensorStatusBar.tsx` or `components/hud/ToastViewport.tsx` - Show pending, confirmed, low-confidence, failed, or suggested-correction states if needed.
- `tests/unit/*cross-reference*.test.ts` - Deterministic result handling tests.

Candidate tasks:

- [ ] Define result states: `confirmed`, `low-confidence`, `inconclusive`, `suggested-correction`, `unavailable`, and `error`.
- [ ] Define whether hidden resolution runs before saving, after saving as a background refinement, or only on explicit user action.
- [ ] Define the camera-placement inputs the resolver needs: user coordinate, GPS accuracy, heading, heading confidence, camera aim/ray, target distance estimate if any, timestamp, and permission state.
- [ ] Define timeout and retry behavior.
- [ ] Treat suggested corrections as suggestions unless a future product rule approves auto-application.
- [ ] Record provenance when a cross-reference result is accepted.
- [ ] Record which provider/system supplied the evidence, whether the result is cacheable under the provider terms, and whether user coordinates left the device.
- [ ] Add quota-exceeded, billing-disabled, provider-unavailable, and privacy-denied result states if the approved provider requires them.
- [ ] Add tests proving provider failures fall back to approximate camera anchors.

Stop conditions:

- Stop if provider usage requires tokens, paid APIs, rate limits, or attribution not approved by a provider RFC.
- Stop if coordinates would be sent to a backend or third-party service without privacy review and user-facing disclosure.
- Stop if the provider's terms forbid the intended caching, storage, display, or correction behavior.
- Stop if the selected provider cannot be mocked deterministically enough for CI.
- Stop if the route cannot produce useful confidence/failure states without falling back to a visible map.
- Stop if the implementation or user-facing copy implies AR/VPS-level accuracy without ARCore/native evidence.

## 8. Phase 3B: Native ARCore Geospatial Accuracy Prototype

Use this phase only if route selection approves the ARCore Geospatial accuracy prototype.

Provider/system guidance:

- Google ARCore Geospatial is the first recommended accuracy prototype because it provides geospatial anchors and uses Google's VPS where available.
- ARCore is not a drop-in replacement for the current Next/PWA app; choose native Android, Unity/AR Foundation, native iOS research, or another mobile route before adding project files.
- Geoapify or another map/location provider may enrich saved ARCore anchors with nearby place/address/route context only after provider approval.
- Do not turn this prototype into a full native rewrite until a later platform RFC accepts that migration.

Expected files or modules:

- Future `native/`, `apps/arcore-prototype/`, `unity/`, or another approved prototype directory - Isolated mobile/AR prototype workspace.
- Future `docs/arcore-geospatial-prototype-plan.md` or implementation RFC - Setup steps, device requirements, demo locations, and manual QA script.
- Future shared anchor type notes or package - Portable anchor vocabulary for PWA and ARCore prototype.
- Optional future `lib/anchors/arcore-anchor-types.ts` - Shared TypeScript representation if the PWA needs to import ARCore-created anchor records for demo/replay.

Candidate tasks:

- [ ] Choose prototype route: native Android, Unity/AR Foundation, native iOS research, or other.
- [ ] Confirm ARCore-capable test device availability.
- [ ] Confirm Google Cloud/API setup requirements and whether billing or quota limits apply.
- [ ] Select one or more outdoor demo locations and check VPS availability before relying on them.
- [ ] Define ARCore anchor result fields: latitude, longitude, altitude, anchor type, tracking state, Earth/geospatial state, VPS availability, confidence, provider, timestamp, and fallback reason.
- [ ] Reconfirm the provisional ARCore fallback rule: require an AR-ready state before saving or labeling a beacon as `AR-anchored`; when AR readiness is unavailable, guide the user to move, scan, wait, or try another location instead of creating a misleading AR anchor.
- [ ] Define exact AR-ready thresholds and decide whether the AR prototype offers a separate `Approximate` fallback, while keeping that fallback clearly distinct from `AR-anchored`.
- [ ] Prototype camera placement of a geospatial anchor.
- [ ] Prototype re-finding or re-rendering a saved anchor in the same demo location.
- [ ] Define behavior when VPS is unavailable, tracking is poor, location permission is denied, or device support is missing.
- [ ] Keep raw camera imagery out of Sky Beacon persistence unless a privacy RFC approves otherwise.
- [ ] Document what the ARCore prototype proves and what the PWA demo still proves separately.

Stop conditions:

- Stop if no supported device or demo location is available.
- Stop if Google Cloud/API setup, quotas, terms, billing, or SDK requirements are unresolved.
- Stop if the implementation cannot distinguish failed/unavailable AR readiness from a valid `AR-anchored` beacon.
- Stop if implementation requires adding native/Unity project files without explicit approval.
- Stop if the prototype cannot clearly store or export anchor metadata compatible with the shared Sky Beacon anchor model.
- Stop if the implementation would store raw camera imagery or image-derived descriptors without privacy approval.

## 9. Phase 3C: Optional Visible Map UI Route

Use this phase only if route selection chooses visible map UI as a separate feature or a hybrid path with optional map inspection.

Provider/system guidance:

- Default managed prototype candidate: MapLibre GL JS plus MapTiler Cloud, if the user accepts a provider account, API key, attribution, usage limits, and plan verification.
- Default cheap/open-source-leaning candidate: MapLibre GL JS plus Protomaps/PMTiles, if the user accepts static tile hosting, update responsibility, attribution/licensing review, and limited built-in search/geocoding.
- Commercial alternatives such as Mapbox or Google Maps Platform require a separate provider RFC when their richer data or platform features are specifically needed.
- Public OSMF tile servers must not be used as the visible map tile source for a distributed app.

Expected files or modules:

- New `components/map/BeaconMapView.tsx` or `components/map/BeaconMapSheet.tsx` - Mobile map surface.
- New `components/map/MapAnchorPicker.tsx` - Coordinate picking and drag adjustment.
- New `lib/map/map-provider.ts` or `lib/anchors/map-provider.ts` - Provider adapter boundary.
- `components/SkyBeaconApp.tsx` - Open/close map flow and commit adjusted anchors.
- `components/beacons/BeaconDrawer.tsx` - Optional "adjust on map" entry point.
- `tests/e2e/sky-beacon.smoke.spec.ts` - Mocked map-flow smoke coverage if stable.

Candidate tasks:

- [ ] Keep visible map UI subordinate to the camera-first flow.
- [ ] Keep visible map UI separate from the required camera placement flow.
- [ ] Add map provider loading, attribution, unavailable, and slow-network states.
- [ ] Allow camera-created draft anchors to be inspected or adjusted on the map if selected.
- [ ] Allow direct map-created anchors only if product confirms that workflow.
- [ ] Save map-created or map-adjusted anchors using the shared `BeaconRecord` model.
- [ ] Implement attribution, provider-unavailable, slow-network, quota-exceeded, and map-load-error states required by the approved provider.
- [ ] Keep provider implementation behind a `lib/map` or `lib/anchors` adapter so MapTiler, Protomaps, Mapbox, or Google can be swapped without rewriting beacon logic.
- [ ] Add tests proving map-adjusted anchors render correctly in the camera overlay.

Stop conditions:

- Stop if map SDK behavior cannot be tested or mocked reliably enough for CI.
- Stop if provider attribution, token handling, or pricing is unresolved.
- Stop if the provider key would be exposed in a way the provider does not permit or the app cannot restrict.
- Stop if map tiles/search require a paid plan or hosting bill that the user has not accepted.

## 10. Phase 3D: Hybrid Route

Use this phase only if route selection chooses more than one anchoring/enrichment surface, such as PWA metadata plus ARCore, PWA metadata plus visible map UI, or ARCore plus Geoapify metadata.

Candidate tasks:

- [ ] Define ownership: ARCore places/proves geospatial anchors, Geoapify enriches with metadata, cross-reference suggests or scores, and visible map lets the user inspect or correct if selected.
- [ ] Define conflict behavior when cross-reference suggests one correction and the user chooses another.
- [ ] Define whether map confirmation overrides cross-reference confidence.
- [ ] Ensure provenance can represent ARCore placement, automated cross-reference, metadata enrichment, and manual adjustment.
- [ ] Define which provider/system owns each piece of evidence when cross-reference and visible map data come from different providers.
- [ ] Define fallback behavior if one provider succeeds and the other is unavailable, rate-limited, or billing-disabled.
- [ ] Add tests for conflicting, repeated, and stale refinements.

Stop conditions:

- Stop if the hybrid flow cannot be explained with simple user-facing status.
- Stop if it requires hidden automatic coordinate changes.

## 11. Phase 4: Close-Range Visual Refinement Research

Use this phase only after anchor provenance exists and a separate research/privacy RFC approves the target.

Expected files or modules:

- Future `lib/anchors/visual-refinement-types.ts` - Result and confidence types.
- Future `lib/anchors/visual-refinement-service.ts` - Capability boundary.
- `lib/sensors/use-camera-stream.ts` - Existing camera permission constraints.
- `components/beacons/BeaconOverlay.tsx` - Optional display-only alignment refinement.

Candidate tasks:

- [ ] Define what is recognized: scene features, landmarks, user-marked target, fiducial, or other signal.
- [ ] Decide whether recognition can update durable coordinates or only display alignment/confidence.
- [ ] Forbid raw image persistence unless a privacy RFC explicitly approves it.
- [ ] Add fallback behavior for unsupported browsers, poor lighting, motion blur, and ambiguous scenes.

Stop conditions:

- Stop if recognition requires storing raw camera imagery or descriptors without privacy approval.
- Stop if recognition cannot fail safely back to PWA approximate, ARCore geospatial, or approved map/geospatial rendering.

## 12. Phase 5: UI, Confidence, And User Messaging

Expected files or modules:

- `components/hud/SensorStatusBar.tsx` - Sensor and anchor status display.
- `components/hud/ToastViewport.tsx` - Cross-reference and correction notifications if needed.
- `components/beacons/BeaconDrawer.tsx` - Anchor provenance and adjustment actions.
- `components/beacons/BeaconPillar.tsx` - Optional visual treatment for confidence.
- `app/globals.css` - Styling updates only if required by selected UX.

Candidate tasks:

- [ ] Separate sensor confidence from anchor confidence.
- [ ] Distinguish approximate PWA, ARCore geospatial, map-cross-referenced, map-confirmed, map-adjusted, and visually refined states.
- [ ] Map technical anchor sources to plain UI labels: approximate PWA -> `Approximate`; map-backed metadata or cross-reference -> `Map-backed`; user/provider-confirmed map state -> `Map-confirmed`; ARCore/geospatial anchors -> `AR-anchored`; visual refinement -> `Visually refined`.
- [ ] Pair those source labels with separate confidence levels: `High`, `Medium`, `Low`, or `Unknown`.
- [ ] Keep camera-view messaging sparse; avoid persistent confidence/source text on every beacon.
- [ ] Avoid wording that implies the PWA has ARCore/VPS-level placement accuracy.
- [ ] Avoid exact distance or line-of-sight claims unless supporting data is approved.
- [ ] Show provider/cross-reference failure as degraded confidence, not as a broken app.
- [ ] Show ARCore VPS unavailable, tracking limited, unsupported device, and location denied states clearly if ARCore is selected.

## 13. Validation Strategy

Required commands from repo root after implementation:

```powershell
npm run test
npm run lint
npm run build
```

Unit tests:

- Beacon schema normalization for legacy records with no provenance.
- Beacon schema validation for valid and invalid anchor source values.
- Geospatial bearing and overlay mapping for selected anchor sources.
- Pitch/framing helper tests if the implementation extracts a helper: base visible only when estimated camera framing includes the base, upper column visible when pitch/framing intersects the upper segment, and no beacon rendered when neither horizontal nor vertical framing intersects the beacon.
- Anchor confidence derivation from PWA approximation, ARCore geospatial state, cross-reference, optional map confirmation, and sensor metadata.
- Base-visibility or obstruction-state normalization if the selected route adds those fields.

Integration/component tests:

- Camera-created draft can enter the selected PWA confirmation, metadata enrichment, or cross-reference flow.
- ARCore-created anchor records can be represented in the shared anchor model if the ARCore phase is selected.
- Suggested corrections are not silently applied unless a future product rule approves that behavior.
- If visible map UI is selected, map-adjusted beacon returns to camera view and renders from the updated coordinate.
- Drawer shows approximate, ARCore geospatial, map-cross-referenced, map-confirmed, or visually refined status where relevant.
- Provider unavailable state does not break existing camera and drawer flows.
- Provider quota, billing-disabled, invalid-key, attribution-required, and slow-network states are represented when the selected provider exposes those failure modes.

E2E tests:

- Mock or adapter-test selected provider behavior without relying on third-party network calls in CI.
- Seed localStorage with selected post-MVP anchor sources.
- Verify camera overlay renders seeded anchors without crashing.
- Verify representative camera-frame states: looking straight ahead does not show the base by default, looking downward at the estimated base can show the base, looking upward at the beacon bearing shows the upper column, and aiming away shows only the off-screen indicator.
- Verify the first PWA placement flow asks or visually guides the user to aim at the intended beacon base or ground target, and that UI copy/status labels this base anchor as approximate.
- Verify seeded anchors with unknown or approximated base visibility do not render a false definite ground/base contact point.
- Verify the app remains usable when provider mocks return unavailable, quota-exceeded, timeout, or malformed responses.

External system validation:

- Do not run CI against live Geoapify, MapTiler, Mapbox, Google Maps Platform, ARCore, Supabase, Firebase, public OSMF, Nominatim, or Overpass endpoints.
- Use adapter-level mocks or recorded fixtures that do not include private coordinates unless a privacy RFC approves them.
- Add manual verification steps for live provider setup only after the user has approved account, billing/free-tier, token, attribution, and privacy posture.
- Confirm provider keys are restricted according to the provider's official guidance before any deployed test.
- For ARCore, document manual device validation because CI cannot prove outdoor geospatial tracking or VPS coverage.

Manual QA:

1. Create a camera draft outdoors.
2. If PWA metadata/cross-reference is selected, run the selected enrichment or confirmation flow.
3. If ARCore is selected, place a geospatial anchor in a VPS-checked demo location.
4. If ARCore is selected, walk away, return, and verify the beacon can be found or re-rendered with documented confidence.
5. If visible map UI is selected, confirm or adjust the beacon on a map.
6. Return to camera view and verify the beacon appears in the expected direction.
7. If visible map UI is selected, create a direct map beacon.
8. Walk or turn toward it and verify overlay behavior.
9. Reopen the app/prototype and verify provenance and confidence persist.
10. Tilt downward while aimed at the estimated beacon base and verify the base can appear only when the camera frame includes it and conservative obstruction rules allow it.
11. Look straight ahead toward the beacon bearing and verify the base is not shown by default unless the estimated frame includes it.
12. Tilt upward while aimed at, or rotate into, the beacon bearing and verify the upper column appears or is emphasized.
13. Tilt or rotate so the beacon is outside the estimated camera frame and verify only the off-screen indicator appears.
14. Test a scenario where terrain, trees, buildings, or other obstructions hide the beacon base, and verify the app does not draw the base as clearly visible unless the selected route has evidence for that.
15. Test provider unavailable, slow, inconclusive, poor-network, unsupported-device, and VPS-unavailable behavior.
16. If visual refinement is prototyped, test nearby and poor-light fallback behavior.
17. If a paid/free-tier provider is selected, test the user-facing behavior for quota exhaustion or disabled billing without incurring avoidable charges.

## 14. Rollout, Migration, And Backout

Rollout:

- Ship any selected post-MVP anchoring route behind explicit product acceptance, not as an automatic continuation of BUG-11.
- Keep legacy camera-created beacon placement available during transition.
- Keep the PWA as the demo/product shell while ARCore is prototyped unless a later platform RFC approves migration.
- Keep ARCore prototype work isolated until the team decides whether it becomes the main app.
- Add provider or backend configuration only after token, attribution, cost, and privacy handling are approved.
- Add native/Unity/ARCore configuration only after supported-device, Google Cloud/API, quota, demo-location, and privacy handling are approved.
- Add budget caps, usage alerts, or documented free-tier exhaustion behavior before using any paid or account-bound provider outside local development.
- Use local-first browser storage as the default initial persistence route only when route selection has not approved backend/server-side persistence.
- Treat backend/server-side persistence, cloud sync, accounts, and shared beacons as future-approved routes, not accidental side effects of map/geospatial anchoring.

Migration:

- Existing local records without anchor provenance should load as approximate `camera` anchors.
- Existing latitude/longitude fields remain the durable coordinate unless an approved product rule accepts a correction.
- New optional fields must not make older records invalid.
- If backend/server-side persistence is selected later, define sync ownership, conflict behavior, account requirements, deletion semantics, and local-cache fallback before moving records.

Backout:

- A feature flag or isolated route/service boundary should allow disabling the selected post-MVP anchoring path while keeping the camera MVP usable.
- The ARCore prototype should be removable or ignorable without breaking the PWA demo.
- Schema additions should be backward compatible so disabling cross-reference or map UI does not corrupt saved beacons.
- If a provider integration fails, keep local beacon CRUD and camera overlay operational.
- If provider terms, quotas, or costs become unacceptable, disable the provider path through the adapter boundary and fall back to local approximate anchors or approved static/offline data.
- If backend/server-side persistence is selected later, backout must preserve local access to existing beacons or define an approved data-export/recovery path.

## 15. Agent Execution Contract

Approved scope:

- Use this spec only after the RFC route is selected or the user explicitly authorizes implementation.
- If the user asks for the next Phased Core PWA Upgrade artifact, produce an implementation spec only unless the user separately asks to implement code.
- Implement only the selected route and its prerequisites.
- Implement only the approved provider/system posture; the source RFC's current recommendation is dual-track PWA demo plus ARCore Geospatial accuracy prototype, with Geoapify as metadata provider after approval.
- Keep unrelated MVP behavior unchanged.

Forbidden changes unless separately approved:

- Do not add provider SDKs, backend calls, paid APIs, environment variables, or tokens.
- Do not add native/Unity/mobile project files, ARCore SDK dependencies, Google Cloud/API configuration, or ARCore-specific runtime behavior unless the ARCore prototype route is explicitly approved.
- Do not introduce backend persistence, accounts, cloud sync, or shared beacons unless the selected persistence posture explicitly approves them.
- Do not use public OpenStreetMap Foundation tiles, public Nominatim, or public Overpass services as production dependencies.
- Do not select Geoapify, MapTiler, Protomaps, Mapbox, Google Maps Platform, ARCore, Supabase, Firebase, or any alternative provider without documenting the user setup, cost posture, attribution/licensing, token/API handling, privacy impact, and fallback behavior.
- Do not make visible map interaction required for accurate beacon placement unless the user explicitly changes the product goal.
- Do not persist raw camera imagery or image-derived descriptors.
- Do not silently auto-apply suggested coordinate corrections.
- Do not replace the PWA with a native app or the camera-first experience with a map-first experience without a separate accepted platform/product RFC.

Amendment triggers:

- New provider constraints materially change scope, cost, privacy, or attribution.
- A selected provider's pricing, quota, license, attribution, key-handling, or terms differ materially from the route-selection RFC.
- ARCore supported-device, VPS availability, SDK, Google Cloud/API, quota, or platform constraints differ materially from the route-selection RFC.
- Schema changes require irreversible migration.
- Persistence requirements change from local-first browser storage to backend/server-side storage, accounts, cloud sync, or shared beacons.
- Tests require unavailable hardware, credentials, paid services, or production access.
- Implementation discovers that the selected route cannot render reliably in the camera overlay.
- Implementation discovers that the selected route cannot preserve the base-anchor plus skyward-column product concept or cannot safely represent unknown obstruction/base-visibility states.
