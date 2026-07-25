import type { VerticalHint } from "./beacon-frame";

/**
 * Off-screen guidance selection (Ticket 04).
 *
 * The indicator has two independent axes, each driven by a tested result from
 * Ticket 03 rather than recomputed here:
 *   - Horizontal cue (which edge to pin to / which way to turn) comes from the
 *     overlay bearing resolver — but only when the beacon is actually outside
 *     the horizontal FOV. A beacon that is in the FOV horizontally needs no
 *     turn, so it centers even if it is vertically out of frame.
 *   - Vertical cue (raise/lower) comes straight from resolveBeaconFrame's
 *     verticalHint.
 *
 * Decoupling the two axes fixes the force-coercion of a horizontally-centered
 * but vertically-out beacon to an arbitrary "left"/"right" chevron.
 */

export type HorizontalDirection = "left" | "right" | "center";

export interface OffscreenGuidance {
  /**
   * Which screen edge the indicator pins to. "center" means the beacon is in
   * the horizontal FOV (no turn needed); only a vertical cue is relevant.
   */
  edge: "left" | "right" | "center";
  /**
   * raise/lower from the frame resolver, or null when the vertical hint is not
   * actionable ("center" means "recenter horizontally", not a vertical move).
   */
  verticalCue: "raise" | "lower" | null;
}

/**
 * Resolve the indicator's edge and actionable vertical cue from the horizontal
 * bearing direction, whether the beacon is horizontally visible, and the frame
 * resolver's verticalHint. Pure; never performs IO.
 */
export function resolveOffscreenGuidance(
  horizontalDirection: HorizontalDirection,
  horizontalVisible: boolean,
  verticalHint: VerticalHint,
): OffscreenGuidance {
  const edge: OffscreenGuidance["edge"] = horizontalVisible
    ? "center"
    : horizontalDirection === "left"
      ? "left"
      : "right";

  const verticalCue: OffscreenGuidance["verticalCue"] =
    verticalHint === "raise" || verticalHint === "lower" ? verticalHint : null;

  return { edge, verticalCue };
}

/**
 * Vertical spacing step (in viewport-height percent) between stacked
 * off-screen indicators that share the same edge, so multiple beacons on one
 * side do not overlap (Ticket 04: "remains readable with multiple saved
 * beacons and does not cover primary controls"). Tuned to clear the indicator
 * height while staying inside the side band.
 */
export const OFFSCREEN_STAGGER_STEP_VH = 9;

/**
 * Spread `count` indicators sharing one edge symmetrically about the base line
 * (46vh), returning the offset (in viewport-height percent) for the indicator
 * at position `index` (0-based). A lone indicator sits at the base line; a
 * stack fans out above and below it. Pure.
 *
 * `index` and `count` are clamped defensively so a caller that miscounts
 * cannot push an indicator off-screen.
 */
export function resolveStaggerOffset(index: number, count: number): number {
  const n = Math.max(1, Math.floor(count));
  const i = Math.max(0, Math.min(Math.floor(index), n - 1));
  if (n === 1) return 0;
  // Center the stack around the base line: offsets are ..., -1, 0, 1, ... for
  // odd counts; -0.5, 0.5, ... for even counts (kept on half-steps so a pair
  // straddles the line without colliding).
  const mid = (n - 1) / 2;
  return (i - mid) * OFFSCREEN_STAGGER_STEP_VH;
}
