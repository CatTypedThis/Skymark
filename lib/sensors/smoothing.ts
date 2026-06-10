import { normalizeHeading } from "@/lib/geospatial/angles";

export function smoothHeading(previousHeading: number | null, nextHeading: number, smoothing = 0.22): number {
  if (previousHeading === null || !Number.isFinite(previousHeading)) {
    return normalizeHeading(nextHeading);
  }

  const previousRadians = (normalizeHeading(previousHeading) * Math.PI) / 180;
  const nextRadians = (normalizeHeading(nextHeading) * Math.PI) / 180;

  const previousVector = {
    x: Math.cos(previousRadians),
    y: Math.sin(previousRadians),
  };
  const nextVector = {
    x: Math.cos(nextRadians),
    y: Math.sin(nextRadians),
  };

  const mixed = {
    x: previousVector.x * (1 - smoothing) + nextVector.x * smoothing,
    y: previousVector.y * (1 - smoothing) + nextVector.y * smoothing,
  };

  return normalizeHeading((Math.atan2(mixed.y, mixed.x) * 180) / Math.PI);
}
