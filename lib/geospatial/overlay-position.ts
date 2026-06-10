import { angularDifference } from "./angles";

export interface OverlayPosition {
  visible: boolean;
  xPercent: number;
  direction: "left" | "right" | "center";
  differenceDegrees: number;
}

export function mapBearingToOverlayX(
  beaconBearing: number,
  userHeading: number,
  horizontalFovDegrees = 60,
): OverlayPosition {
  const halfFov = horizontalFovDegrees / 2;
  const differenceDegrees = angularDifference(userHeading, beaconBearing);
  const visible = Math.abs(differenceDegrees) <= halfFov;
  const xPercent = visible ? 50 + (differenceDegrees / halfFov) * 50 : differenceDegrees < 0 ? 5 : 95;

  return {
    visible,
    xPercent,
    direction: Math.abs(differenceDegrees) < 2 ? "center" : differenceDegrees < 0 ? "left" : "right",
    differenceDegrees,
  };
}
