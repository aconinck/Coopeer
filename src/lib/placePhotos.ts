import { Asset } from 'expo-asset';
import type { Place } from '../state/models';

// Park photos saved in the app (assets/images/places) so they always load, offline too. Keyed by place name so
// they apply to demo places and to places loaded from Supabase.
const saved: Record<string, { source: number; credit: string }> = {
  'Crystal Bridges Trails': { source: require('../../assets/images/places/crystal-bridges-trails.jpg'), credit: 'Photo: Michael Barera · CC BY-SA 4.0' },
  'Coler Mountain Bike Preserve': { source: require('../../assets/images/places/coler-mtb.jpg'), credit: 'Jared Sluyter · CC0 1.0' },
  'Town Branch Park': { source: require('../../assets/images/places/town-branch-park.jpg'), credit: 'Brandonrush · CC0 1.0' },
  'Park Springs Park': { source: require('../../assets/images/places/park-springs-park.jpg'), credit: 'Brandonrush · CC0 1.0' },
};

export function savedPhotosFor(name: string): Place['photos'] {
  const hit = saved[name];
  return hit ? [{ uri: Asset.fromModule(hit.source).uri, credit: hit.credit }] : undefined;
}

export function withSavedPhotos<T extends Pick<Place, 'name' | 'photos'>>(place: T): T {
  return { ...place, photos: savedPhotosFor(place.name) ?? place.photos };
}
