export interface LatLng {
  latitude: number;
  longitude: number;
}

export const MILE_METERS = 1609.344;

/** Straight-line distance in meters (fine at city scale). */
export function distanceMeters(a: LatLng, b: LatLng) {
  const dLat = (b.latitude - a.latitude) * 111_320;
  const dLon = (b.longitude - a.longitude) * 111_320 * Math.cos((a.latitude * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}
