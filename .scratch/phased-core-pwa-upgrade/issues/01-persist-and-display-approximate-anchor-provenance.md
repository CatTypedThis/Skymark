# 01 — Persist and display approximate anchor provenance

**What to build:** Make every locally saved beacon carry a backward-compatible description of where its anchor came from and how confident that anchor is. Existing beacons must continue to load as approximate camera-created anchors, while the drawer gives users a compact source/confidence status without adding persistent provenance text to every camera-overlay marker.

**Blocked by:** None — can start immediately.

**Status:** done

- [ ] Existing beacon records without anchor fields still load, remain manageable, and resolve to a camera source with anchor confidence derived from their existing confidence.
- [ ] New local camera beacons persist an approximate camera source and anchor confidence without changing the durable latitude, longitude, heading, or 100-meter placement model.
- [ ] Valid optional source and anchor-confidence values survive storage normalization.
- [ ] Malformed optional anchor fields are repaired or ignored without dropping an otherwise valid beacon record.
- [ ] Selected-beacon and drawer status uses compact user-facing language such as `Approximate / Low`.
- [ ] Source/confidence status is not added as persistent text to every beacon in the camera overlay.
- [ ] Unit and browser tests cover legacy records, valid new fields, malformed optional fields, and compact drawer status.
- [ ] No destructive or mandatory local-storage migration is introduced.

## Resolution

- Commit: b3c4bcf
- Resolved: 2026-07-24
