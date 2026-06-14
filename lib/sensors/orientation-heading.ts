import { normalizeHeading } from "@/lib/geospatial/angles";

export interface CompassOrientationReading {
  alpha?: number | null;
  beta?: number | null;
  gamma?: number | null;
  absolute?: boolean;
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
}

export interface OrientationHeading {
  heading: number | null;
  accuracyLabel?: string;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function tiltCompensatedHeading(alpha: number, beta: number, gamma: number): number | null {
  const x = toRadians(beta);
  const y = toRadians(gamma);
  const z = toRadians(alpha);

  const cosY = Math.cos(y);
  const cosZ = Math.cos(z);
  const sinX = Math.sin(x);
  const sinY = Math.sin(y);
  const sinZ = Math.sin(z);

  const vectorX = -cosZ * sinY - sinZ * sinX * cosY;
  const vectorY = -sinZ * sinY + cosZ * sinX * cosY;

  if (Math.abs(vectorX) < Number.EPSILON && Math.abs(vectorY) < Number.EPSILON) {
    return null;
  }

  return normalizeHeading(toDegrees(Math.atan2(vectorX, vectorY)));
}

export function readHeadingFromOrientation(reading: CompassOrientationReading): OrientationHeading {
  if (finiteNumber(reading.webkitCompassHeading)) {
    return {
      heading: normalizeHeading(reading.webkitCompassHeading),
      accuracyLabel: finiteNumber(reading.webkitCompassAccuracy)
        ? `${Math.round(reading.webkitCompassAccuracy)} deg`
        : "iOS compass",
    };
  }

  if (!finiteNumber(reading.alpha)) {
    return { heading: null };
  }

  const compensated =
    finiteNumber(reading.beta) && finiteNumber(reading.gamma)
      ? tiltCompensatedHeading(reading.alpha, reading.beta, reading.gamma)
      : null;

  return {
    heading: compensated ?? normalizeHeading(360 - reading.alpha),
    accuracyLabel: reading.absolute ? "absolute" : "relative",
  };
}
