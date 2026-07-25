# 04 — Add frame-aware off-screen guidance

**What to build:** Help users recover a beacon that is outside the useful camera frame by preserving the existing left/right direction cue and adding a concise vertical cue when they should raise or lower the phone.

**Blocked by:** 03 — Render pitch-aware skyward beacons.

**Status:** done

- [x] A beacon with no useful segment in the estimated frame is represented by off-screen guidance instead of an in-frame beacon column.
- [x] Existing left and right directional guidance remains available for beacons outside the horizontal field of view.
- [x] Off-screen guidance can communicate raise, lower, or center intent when vertical direction is useful.
- [x] Vertical guidance is driven by the tested frame result from Ticket 03 rather than duplicated component-specific pitch calculations.
- [x] Camera-overlay wording stays short and does not add long instructional text or persistent provenance labels.
- [x] Indicator placement remains readable with multiple saved beacons and does not cover primary controls.
- [x] Accessible labels communicate both horizontal and vertical direction when both are present.
- [x] Unit, component, or stable browser coverage verifies horizontal and vertical indicator selection.

## Resolution

- Commit: 64da59a
- Resolved: 2026-07-24
