# 02 — Guide and save base-oriented placements

**What to build:** Give users a complete camera-first placement flow that asks them to aim at the intended beacon base or ground target, clearly describes the result as approximate, and permits warning-level placements when usable GPS and heading readings exist.

**Blocked by:** 01 — Persist and display approximate anchor provenance.

**Status:** ready-for-agent

- [ ] Entering preview gives short, clear guidance to aim at the intended base or ground target.
- [ ] The placement interface describes the browser-created anchor as approximate and makes no exact ground-plane, depth, terrain, obstruction, or line-of-sight claim.
- [ ] Confirmation remains available when GPS and heading are usable even if sensor or anchor confidence is low or unknown.
- [ ] Weak-confidence confirmation shows warning/status treatment without turning that warning into a blocking error.
- [ ] Confirmation is blocked when required location or heading data is missing or unusable, with clear recovery guidance.
- [ ] Saved coordinates continue to use the current GPS position, normalized heading, and default 100-meter destination model.
- [ ] Newly saved and replacement anchors use the camera source and current placement confidence established by Ticket 01.
- [ ] Preview and confirmation controls remain compact, accessible, and thumb-friendly.
- [ ] Browser tests cover successful weak-confidence saving and rejection when required readings are unavailable.
