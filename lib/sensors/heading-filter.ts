/**
 * Pure compass-heading filter (BUG-13).
 *
 * The orientation hook previously blended every `deviceorientation` event into
 * one stream regardless of `event.absolute`. On Android Chrome `absolute`
 * flips between true (compass heading from north) and false (heading relative
 * to an arbitrary session zero — no compass meaning), so the smoother was
 * averaging values from two unrelated coordinate systems. No amount of
 * smoothing removes that; it only blurs the jump.
 *
 * This module owns three responsibilities, in order, as pure functions with no
 * React/browser/storage dependencies:
 *
 *   1. Gate: prefer the absolute-orientation source; reject relative readings.
 *   2. Outlier rejection: down-weight a single wild absolute frame instead of
 *      blending it at full weight (the old 0.22 weight moved output ~40 deg on
 *      one 180 deg-off sample).
 *   3. Smoothing: dampen residual magnetometer jitter on the unit circle.
 *
 * The iOS `webkitCompassHeading` path is absolute by construction and is not
 * gated here; callers mark those readings absolute before pushing them.
 */

import { angularDifference, normalizeHeading } from "@/lib/geospatial/angles";
import { smoothHeading } from "./smoothing";

/**
 * A single reading entering the pipeline. `absolute` is true only when the
 * heading is referenced to magnetic north (an absolute `deviceorientation`
 * event, `deviceorientationabsolute`, or `webkitCompassHeading` on iOS).
 * Relative `deviceorientation` readings on Android Chrome pass `absolute:
 * false` and are rejected by the gate.
 */
export interface HeadingSample {
  /** Raw compass heading in degrees, unnormalized. */
  heading: number;
  /** Whether the heading is referenced to north (true) or arbitrary (false). */
  absolute: boolean;
}

/**
 * Tunable policy. Defaults are starting points derived from observed Android
 * Chrome jitter; expose them so device QA can tune without touching call sites.
 */
export const HEADING_SMOOTHING_WEIGHT = 0.12;
export const HEADING_OUTLIER_THRESHOLD_DEGREES = 45;
export const HEADING_OUTLIER_DOWNWEIGHT = 0.05;

/**
 * Filter state carried between samples. `null` means "no accepted reading
 * yet"; the first absolute sample seeds the estimate directly.
 */
export interface HeadingFilterState {
  /** Smoothed, normalized heading estimate in degrees. */
  estimate: number;
  /** True once at least one absolute reading has seeded the estimate. */
  primed: boolean;
  /**
   * Consecutive samples that were rejected by the gate (relative) or had no
   * effect (outlier down-weighted to negligible motion). When this grows, the
   * compass is effectively not producing trustworthy new information and the
   * consumer should flag instability so the UI can prompt recalibration.
   */
  consecutiveHeld: number;
}

/**
 * Result of advancing the filter by one sample.
 */
export interface HeadingFilterAdvance {
  state: HeadingFilterState;
  /** Heading to publish, or null when the gate rejected the sample and the
   * previous estimate should be held with no update. */
  heading: number | null;
  /** True if the sample was an outlier (large delta) that was down-weighted. */
  outlier: boolean;
  /** True if the gate rejected the sample (relative or malformed). */
  rejected: boolean;
}

/**
 * Advance the filter by one sample.
 *
 * Behavior:
 *   - Relative samples (absolute === false) never update the estimate. The
 *     dominant BUG-13 defect was blending these with absolute readings. The
 *     `consecutiveHeld` counter increments so consumers can flag instability.
 *   - The first absolute sample seeds the estimate at full weight.
 *   - An absolute sample whose delta from the estimate exceeds the outlier
 *     threshold is blended at `HEADING_OUTLIER_DOWNWEIGHT` instead of the
 *     normal weight, so a single magnetometer spike cannot yank the output.
 *     `outlier` is reported true and `consecutiveHeld` increments.
 *   - A consistent run of absolute samples converges normally so genuine
 *     rotation is not over-dampened.
 */
export function advanceHeadingFilter(
  state: HeadingFilterState | null,
  sample: HeadingSample,
): HeadingFilterAdvance {
  const base: HeadingFilterState = state ?? { estimate: 0, primed: false, consecutiveHeld: 0 };

  if (!sample.absolute || !Number.isFinite(sample.heading)) {
    // Reject relative / malformed. Hold the estimate; count the hold so a
    // sustained run of untrustworthy readings can be flagged as unstable.
    return {
      state: { ...base, consecutiveHeld: base.primed ? base.consecutiveHeld + 1 : base.consecutiveHeld },
      heading: base.primed ? base.estimate : null,
      outlier: false,
      rejected: true,
    };
  }

  const next = normalizeHeading(sample.heading);

  if (!base.primed) {
    return {
      state: { estimate: next, primed: true, consecutiveHeld: 0 },
      heading: next,
      outlier: false,
      rejected: false,
    };
  }

  const delta = Math.abs(angularDifference(base.estimate, next));
  const isOutlier = delta > HEADING_OUTLIER_THRESHOLD_DEGREES;
  const weight = isOutlier ? HEADING_OUTLIER_DOWNWEIGHT : HEADING_SMOOTHING_WEIGHT;
  const estimate = smoothHeading(base.estimate, next, weight);

  // An outlier still moves the estimate slightly, so it is not a "held" frame
  // in the relative-reading sense; but it is untrustworthy, so increment the
  // held counter to let consumers flag instability. A normal sample resets it.
  const consecutiveHeld = isOutlier ? base.consecutiveHeld + 1 : 0;

  return {
    state: { estimate, primed: true, consecutiveHeld },
    heading: estimate,
    outlier: isOutlier,
    rejected: false,
  };
}

/**
 * Number of consecutive held/outlier samples after which the compass should be
 * considered unstable. Exposed so consumers and tests share one threshold.
 */
export const HEADING_UNSTABLE_AFTER_HELD = 5;
