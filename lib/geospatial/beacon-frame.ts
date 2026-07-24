import type { BaseVisibility } from "@/lib/beacons/beacon-types";

/**
 * Continuous vertical-framing model (supersedes the discrete segment selector
 * from SPEC-004 §8.3). The beacon is treated as a fixed world-space column
 * anchored at ground level, and the camera is a window that translates
 * vertically over it as device pitch (elevation) changes. Panning up slides
 * the column downward through the frame; panning down slides it upward.
 */

export type PitchQuality = "measured" | "heading-only" | "unusable";
export type VerticalHint = "raise" | "lower" | "center" | null;

export interface BeaconFrameInput {
  horizontalVisible: boolean;
  /** Raw DeviceOrientationEvent.beta, or null when unavailable. */
  pitchDegrees: number | null;
  baseVisibility: BaseVisibility;
}

export interface BeaconFrameResult {
  /**
   * Whether any part of the column intersects the vertical camera window.
   * When false, the caller should render the off-screen indicator instead.
   */
  inView: boolean;
  /**
   * Live continuous vertical offset of the column's bottom edge, as a
   * percentage of the overlay height. Negative values slide the column
   * below the screen (panning up); values >100 slide it above (panning down).
   * The pillar element is taller than the viewport (see COLUMN_VH_PERCENT),
   * so even at negative offsets the upper portion can remain visible.
   */
  bottomPercent: number;
  /**
   * Continuous 0..1 strength of the base glow. 1.0 when the base is centered
   * in the camera window, smoothly fading to 0 as the camera pans past the
   * base region. Drives the base glow/ring opacity via the --base-strength
   * CSS var so the fade is seamless (no boolean snap).
   */
  baseStrength: number;
  baseVisibility: BaseVisibility;
  pitchQuality: PitchQuality;
  verticalHint: VerticalHint;
}

// --- Constants ------------------------------------------------------------

export const DEFAULT_HORIZONTAL_FOV_DEGREES = 60;

/**
 * `DeviceOrientationEvent.beta` value when the phone is held vertical and the
 * camera aims at the horizon. Verified by the Addendum A device spike.
 */
export const PITCH_NEUTRAL_BETA_DEGREES = 90;

/**
 * The beta value at which the beacon BASE rests — i.e. the "look down at the
 * ground in front of you" pose. Per user spec: the base should sit near the
 * bottom of comfortable viewing (~30 beta, which is past the look-down reading
 * of ~36). This is NOT the horizon; the horizon (~84 beta) is partway up the
 * column.
 */
export const BASE_BETA = 30;

/**
 * The beta value at the top of the visible range: panning up to here puts the
 * column cap near the center of the screen. Beyond this the beacon fades out.
 */
export const TOP_BETA = 160;

/**
 * The beacon stays at FULL strength from BASE_BETA up to FADE_START_BETA, then
 * dims gradually to fully out by FADE_END_BETA. Per user spec: no fade until
 * ~155 beta.
 */
export const FADE_START_BETA = 155;
export const FADE_END_BETA = 165;

export const MAX_CAMERA_ELEVATION_DEGREES = 60;

/**
 * Total world-space column height as a percentage of the overlay height.
 * 3x viewport: a genuinely tall pillar you pan across.
 */
export const COLUMN_VH_PERCENT = 300;

/**
 * Bottom offset (percent of overlay height) at the base pose (BASE_BETA).
 * Near the bottom edge so the base sits low and the shaft fills upward.
 */
export const BASE_BOTTOM_PERCENT = 88;

/**
 * Bottom offset at the top pose (TOP_BETA), where the column cap reaches
 * screen center. Derived: cap = bottomPercent + COLUMN_VH_PERCENT = 50.
 */
export const TOP_BOTTOM_PERCENT = 50 - COLUMN_VH_PERCENT; // -250

/**
 * How many bottomPercent units the column slides per degree of beta change,
 * mapping the full BASE_BETA→TOP_BETA range across the column travel.
 */
export const BOTTOM_PERCENT_PER_BETA =
  (BASE_BOTTOM_PERCENT - TOP_BOTTOM_PERCENT) / (TOP_BETA - BASE_BETA); // ~2.6

/** Heading-only fallback: rest at the base pose (column visible, shaft up). */
export const HEADING_ONLY_BOTTOM_PERCENT = BASE_BOTTOM_PERCENT;

/**
 * The base glow is at full strength (1.0) for all beta in
 * [BASE_BETA, FADE_START_BETA], then fades smoothly to 0 across
 * [FADE_START_BETA, FADE_END_BETA]. Below BASE_BETA the base is fully visible
 * too (you're looking at/past it).
 */
export const BASE_STRENGTH_FULL_MIN_BETA = BASE_BETA;
export const BASE_STRENGTH_FULL_MAX_BETA = FADE_START_BETA;
export const BASE_STRENGTH_FADE_MAX_BETA = FADE_END_BETA;

// --- Pitch sign (verified) ------------------------------------------------

/**
 * Verified by the Addendum A device spike (Android Chrome, 2026-06-24).
 *
 * `DeviceOrientationEvent.beta` follows the W3C frame: beta ~ 90 at the
 * horizon, beta INCREASES (toward 180) when the top of the phone tilts back
 * to aim at the sky, and beta DECREASES (toward 0) when aiming at the ground.
 *
 * Measured on the primary Android Chrome target:
 *   horizon beta ~ 84, aim-up beta ~ 143, aim-down beta ~ 36.
 *
 * normalizeCameraElevation is retained for the verified sign convention but
 * the continuous framing model now keys directly off beta (see BASE_BETA /
 * TOP_BETA) since the base pose is at ~30 beta, not the horizon.
 */
export function normalizeCameraElevation(pitchDegrees: number): number {
  return pitchDegrees - PITCH_NEUTRAL_BETA_DEGREES;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Smoothstep interpolation in [0,1]: 0 at edge0, 1 at edge1, with smooth
 * easing at both ends. Used to fade the column/base continuously rather than
 * snapping a boolean on/off.
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Bottom offset for a given beta, mapping the BASE_BETA→TOP_BETA range across
 * the column travel. Clamped so beta outside the modeled range does not push
 * the column absurdly far.
 */
export function betaToBottomPercent(beta: number): number {
  return BASE_BOTTOM_PERCENT - (beta - BASE_BETA) * BOTTOM_PERCENT_PER_BETA;
}

/**
 * Continuous base/column strength (0..1) for a given beta. Full (1.0) from
 * BASE_BETA up to FADE_START_BETA (no early fade), then smoothly fades to 0
 * by FADE_END_BETA. Below BASE_BETA the base is fully visible (looking at it).
 * Drives the --base-strength CSS var.
 */
export function resolveBaseStrength(beta: number): number {
  if (beta <= BASE_STRENGTH_FULL_MAX_BETA) {
    return 1;
  }
  if (beta >= BASE_STRENGTH_FADE_MAX_BETA) {
    return 0;
  }
  return 1 - smoothstep(BASE_STRENGTH_FULL_MAX_BETA, BASE_STRENGTH_FADE_MAX_BETA, beta);
}

// --- Frame resolution -----------------------------------------------------

/**
 * Resolve the beacon's vertical framing from horizontal visibility, raw
 * device pitch (beta), and base visibility. Pure; never performs IO.
 *
 * The beacon is a tall world-space column. The BASE rests at BASE_BETA (~30,
 * the look-down pose) near the bottom of the screen with the shaft rising
 * upward. Panning up (increasing beta toward TOP_BETA ~160) slides the column
 * downward through the frame: the base exits the bottom, the shaft fills the
 * view, and the cap rises toward center. Full strength is maintained from
 * BASE_BETA to FADE_START_BETA (~155); only then does it dim, fully out by
 * FADE_END_BETA (~165). Panning below BASE_BETA keeps the base in view.
 */
export function resolveBeaconFrame(input: BeaconFrameInput): BeaconFrameResult {
  const { horizontalVisible, pitchDegrees, baseVisibility } = input;

  // Horizontal bearing outside the FOV: nothing of the beacon is in frame.
  if (!horizontalVisible) {
    return {
      inView: false,
      bottomPercent: HEADING_ONLY_BOTTOM_PERCENT,
      baseStrength: 0,
      baseVisibility,
      pitchQuality: pitchDegrees === null ? "unusable" : "measured",
      verticalHint: "center",
    };
  }

  // Pitch unavailable: conservative heading-only resting pose at the base.
  if (pitchDegrees === null) {
    return {
      inView: true,
      bottomPercent: HEADING_ONLY_BOTTOM_PERCENT,
      baseStrength: resolveBaseStrength(BASE_BETA),
      baseVisibility,
      pitchQuality: "heading-only",
      verticalHint: null,
    };
  }

  const pitchQuality: PitchQuality = "measured";
  const beta = clamp(pitchDegrees, 0, 180);
  const bottomPercent = betaToBottomPercent(beta);

  // The column occupies [bottomPercent, bottomPercent + COLUMN_VH_PERCENT] of
  // the overlay, extending UPWARD from its base. It is in view whenever any
  // part of that tall column overlaps the [0, 100] screen window.
  const columnTop = bottomPercent + COLUMN_VH_PERCENT;
  const columnBottom = bottomPercent;
  const inView = columnTop > 0 && columnBottom < 100;

  // Continuous strength — full until ~155 beta, then fades out by ~165.
  const baseStrength = resolveBaseStrength(beta);

  let verticalHint: VerticalHint;
  if (beta >= FADE_END_BETA) {
    // Panned past the top of the visible range — guide the user to look up.
    verticalHint = "raise";
  } else if (beta < BASE_BETA) {
    // Below the base pose — guide the user to look down toward the base.
    verticalHint = "lower";
  } else {
    verticalHint = null;
  }

  return {
    inView,
    bottomPercent,
    baseStrength,
    baseVisibility,
    pitchQuality,
    verticalHint,
  };
}
