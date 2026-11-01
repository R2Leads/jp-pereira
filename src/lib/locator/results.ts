import { LocatorError } from "./domain";

export const SEARCH_RADII_KM = [30, 50, 100] as const;
export type SearchRadius = (typeof SEARCH_RADII_KM)[number];
export const SEARCH_PAGE_SIZE = 5;

export function parseSearchRadius(value: unknown): SearchRadius {
  if (value === undefined) return 30;
  if (SEARCH_RADII_KM.includes(value as SearchRadius) && typeof value === "number") {
    return value as SearchRadius;
  }
  throw new LocatorError("Raio inválido. Use 30, 50 ou 100 km.", 400, "INVALID_RADIUS");
}

export function parseSearchOffset(value: unknown): number {
  if (value === undefined) return 0;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return value;
  throw new LocatorError("Deslocamento de resultados inválido.", 400, "INVALID_OFFSET");
}

export function widerSearchRadii(radiusKm: SearchRadius): SearchRadius[] {
  return SEARCH_RADII_KM.filter((radius) => radius > radiusKm);
}

export function searchNearbyPage<T extends { id: number; distanceKm: number }>(
  candidates: readonly T[],
  radiusKm: SearchRadius,
  offset: number
) {
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new LocatorError("Deslocamento de resultados inválido.", 400, "INVALID_OFFSET");
  }

  const nearby = candidates
    .filter((point) => Number.isFinite(point.distanceKm) && point.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm || a.id - b.id);
  const points = nearby.slice(offset, offset + SEARCH_PAGE_SIZE);

  return {
    points,
    total: nearby.length,
    hasMore: offset + points.length < nearby.length,
  };
}
