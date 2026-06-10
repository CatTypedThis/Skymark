import { normalizeHeading } from "./angles";

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function bearingBetween(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
): number {
  const lat1 = toRadians(fromLatitude);
  const lat2 = toRadians(toLatitude);
  const deltaLon = toRadians(toLongitude - fromLongitude);

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  return normalizeHeading(toDegrees(Math.atan2(y, x)));
}
