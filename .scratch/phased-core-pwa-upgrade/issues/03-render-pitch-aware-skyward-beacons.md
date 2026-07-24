# 03 — Render pitch-aware skyward beacons

**What to build:** Make preview and saved beacons read as tall skyward columns whose useful visible portion responds to the estimated camera frame. Looking toward the base, through the middle, or upward should produce an appropriate visual segment, while uncertain base contact remains visually conservative.

**Blocked by:** 01 — Persist and display approximate anchor provenance.

**Status:** done

- [ ] A pure, deterministic frame resolver combines horizontal visibility, pitch availability, and base visibility into the beacon presentation required by the overlay.
- [ ] Frame-resolution tests cover base, middle, upper, horizontally outside, and pitch-unavailable conditions.
- [ ] Preview and saved beacons use the same frame-resolution behavior rather than separate pitch rules.
- [ ] Camera-created approximate anchors show only a softened or implied base when the estimated frame includes it.
- [ ] Unknown or obstructed base visibility is never rendered as definite ground contact.
- [ ] When pitch is missing or unusable, a stable heading-only presentation remains visible instead of breaking placement or saved-beacon rendering.
- [ ] Beacon visuals have distinguishable column, core/cap, and base treatments and feel materially taller than the current marker.
- [ ] Selected, unselected, preview, and weak-confidence states remain distinguishable.
- [ ] Beacon hit targets and accessible labels remain usable.
- [ ] The taller presentation does not cover the reticle, sensor status, preview controls, drawer controls, or bottom placement dock.

## Resolution

- Commit: 98627ef
- Resolved: 2026-07-24
