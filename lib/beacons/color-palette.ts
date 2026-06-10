import type { BeaconColorId } from "./beacon-types";

export const BEACON_COLORS = [
  {
    id: "cyan",
    name: "Cyan",
    hex: "#6EF3DC",
    soft: "rgba(110, 243, 220, 0.24)",
  },
  {
    id: "amber",
    name: "Amber",
    hex: "#F0BD61",
    soft: "rgba(240, 189, 97, 0.24)",
  },
  {
    id: "moss",
    name: "Moss",
    hex: "#8EBF7A",
    soft: "rgba(142, 191, 122, 0.24)",
  },
  {
    id: "violet",
    name: "Violet",
    hex: "#A98CFF",
    soft: "rgba(169, 140, 255, 0.24)",
  },
  {
    id: "rose",
    name: "Rose",
    hex: "#E47C7C",
    soft: "rgba(228, 124, 124, 0.24)",
  },
] as const satisfies ReadonlyArray<{
  id: BeaconColorId;
  name: string;
  hex: string;
  soft: string;
}>;

export function isBeaconColorId(value: unknown): value is BeaconColorId {
  return typeof value === "string" && BEACON_COLORS.some((color) => color.id === value);
}

export function getBeaconColor(colorId: BeaconColorId) {
  return BEACON_COLORS.find((color) => color.id === colorId) ?? BEACON_COLORS[0];
}
