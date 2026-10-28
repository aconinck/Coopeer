import { useEffect, useState } from 'react';
import type { PlaceKind, SportId } from '../state/models';

// Place search by name or address, powered by Photon (https://photon.komoot.io), which is built for
// search-as-you-type on OpenStreetMap data. Results are biased toward Bentonville.
// Do NOT swap in Nominatim for this: its usage policy forbids autocomplete.
const ENDPOINT = 'https://photon.komoot.io/api/';
const BIAS = { latitude: 36.3625, longitude: -94.2105 };
const MIN_CHARS = 2;
/** Ignore anything farther than this from Bentonville (km). */
const MAX_DISTANCE_KM = 80;
/** OpenStreetMap values that are not real, usable places yet. */
const UNBUILT = new Set(['proposed', 'construction', 'abandoned', 'razed', 'disused']);
const TRAIL_WAYS = new Set(['path', 'footway', 'track', 'bridleway', 'cycleway']);

function kmFrom(lat: number, lon: number) {
  const dLat = (lat - BIAS.latitude) * 111.32;
  const dLon = (lon - BIAS.longitude) * 111.32 * Math.cos((BIAS.latitude * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}
const DEBOUNCE_MS = 300;

export interface GeoResult {
  /** Stable id from OpenStreetMap, e.g. "osm-W254749309". */
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  kind: PlaceKind;
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_type?: string;
    osm_id?: number;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    countrycode?: string;
  };
}

/** What kind of place an OpenStreetMap tag describes. Falls back to the sport being played. */
export function kindFromOsm(key: string | undefined, value: string | undefined, sport: SportId | null): PlaceKind {
  if (key === 'route' || (key === 'highway' && TRAIL_WAYS.has(value ?? '')) || (key === 'natural' && value === 'peak')) return 'trail';
  if (key === 'leisure') {
    if (value === 'park' || value === 'garden' || value === 'nature_reserve' || value === 'common') return 'park';
    if (value === 'pitch') return sport === 'soccer' ? 'field' : 'courts';
    if (value === 'sports_centre' || value === 'stadium' || value === 'fitness_centre') return 'center';
  }
  if (key === 'amenity' && value === 'community_centre') return 'center';
  if (sport === 'trails') return 'trail';
  if (sport === 'soccer') return 'field';
  return 'courts';
}

export async function searchPlaces(query: string, sport: SportId | null, signal: AbortSignal): Promise<GeoResult[]> {
  const url = `${ENDPOINT}?q=${encodeURIComponent(query)}&limit=8&lang=en&lat=${BIAS.latitude}&lon=${BIAS.longitude}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Search failed (${response.status})`);
  const data = (await response.json()) as { features?: PhotonFeature[] };
  const seen = new Set<string>();
  const results: GeoResult[] = [];
  for (const feature of data.features ?? []) {
    const p = feature.properties;
    const coords = feature.geometry?.coordinates;
    if (!p?.name || !coords || !p.osm_type || p.osm_id === undefined) continue;
    if (p.countrycode && p.countrycode !== 'US') continue;
    if (UNBUILT.has(p.osm_value ?? '')) continue;
    if (kmFrom(coords[1], coords[0]) > MAX_DISTANCE_KM) continue;
    const street = [p.housenumber, p.street].filter(Boolean).join(' ');
    const address = [street, p.city, p.state].filter(Boolean).join(', ');
    const dedupe = `${p.name}|${address}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    results.push({
      id: `osm-${p.osm_type}${p.osm_id}`,
      name: p.name,
      address: address || 'Bentonville, AR',
      latitude: coords[1],
      longitude: coords[0],
      kind: kindFromOsm(p.osm_key, p.osm_value, sport),
    });
  }
  return results.sort((a, b) => kmFrom(a.latitude, a.longitude) - kmFrom(b.latitude, b.longitude));
}

/** Debounced search-as-you-type. Stale requests are aborted so slow answers never overwrite fresh ones. */
export function usePlaceSearch(query: string, sport: SportId | null) {
  const [state, setState] = useState<{ results: GeoResult[]; loading: boolean; error: boolean }>({ results: [], loading: false, error: false });
  const text = query.trim();

  useEffect(() => {
    if (text.length < MIN_CHARS) {
      setState({ results: [], loading: false, error: false });
      return;
    }
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: false }));
    const timer = setTimeout(() => {
      searchPlaces(text, sport, controller.signal)
        .then((results) => setState({ results, loading: false, error: false }))
        .catch((e) => {
          if (controller.signal.aborted || e?.name === 'AbortError') return;
          setState({ results: [], loading: false, error: true });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, sport]);

  return state;
}
