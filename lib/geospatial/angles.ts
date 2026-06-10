export function normalizeHeading(degrees: number): number {
  if (!Number.isFinite(degrees)) {
    return 0;
  }

  return ((degrees % 360) + 360) % 360;
}

export function angularDifference(fromDegrees: number, toDegrees: number): number {
  const from = normalizeHeading(fromDegrees);
  const to = normalizeHeading(toDegrees);
  return ((to - from + 540) % 360) - 180;
}

export function compassPoint(heading: number): string {
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(normalizeHeading(heading) / 45) % points.length;
  return points[index];
}
