import { normalizeHeading } from "./angles";

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function destinationPoint(
  latitude: number,
  longitude: number,
  headingDegrees: number,
  distanceMeters: number,
): { latitude: number; longitude: number } {
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
  const bearing = toRadians(normalizeHeading(headingDegrees));
  const lat1 = toRadians(latitude);
  const lon1 = toRadians(longitude);

  const sinLat1 = Math.sin(lat1);
  const cosLat1 = Math.cos(lat1);
  const sinAngularDistance = Math.sin(angularDistance);
  const cosAngularDistance = Math.cos(angularDistance);

  const lat2 = Math.asin(
    sinLat1 * cosAngularDistance + cosLat1 * sinAngularDistance * Math.cos(bearing),
  );

  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * sinAngularDistance * cosLat1,
      cosAngularDistance - sinLat1 * Math.sin(lat2),
    );

  return {
    latitude: toDegrees(lat2),
    longitude: ((toDegrees(lon2) + 540) % 360) - 180,
  };
}
