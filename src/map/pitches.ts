import type { Place } from '../state/models';
import { pitches, type Pitch } from './mapData';

export type { Pitch };

export const pitchById = (id: string) => pitches.find((p) => p.id === id);

export function pitchTitle(pitch: Pitch) {
  return pitch.sport === 'soccer' ? 'Soccer field' : 'Pickleball court';
}

export function pitchSubtitle(pitch: Pitch) {
  return pitch.park ?? 'Bentonville, AR';
}

function meters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const r = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

/** The Coopeer place this field/court belongs to, if one is close enough (same park). */
export function placeForPitch(pitch: Pitch, places: Place[], maxMeters = 250): Place | undefined {
  let best: Place | undefined;
  let bestDistance = maxMeters;
  for (const place of places) {
    const d = meters(pitch, place);
    if (d < bestDistance) {
      best = place;
      bestDistance = d;
    }
  }
  return best;
}
