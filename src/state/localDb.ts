/**
 * Persistent local database backed by AsyncStorage.
 *
 * Used as the data layer when Supabase is not configured (demo / offline mode).
 * Stores every collection under namespaced keys and handles Date serialisation.
 * On first run it seeds from mockData so the map is never empty; after that
 * every mutation written back by the store survives an app restart.
 *
 * Future migration path: replace load() / save() calls with Supabase api.*
 * equivalents — the data shapes are identical.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Club, Game, Payment, PaymentMethod, Place } from './models';
import * as mock from './mockData';
import { withSavedPhotos } from '../lib/placePhotos';

// Bump the version prefix when the schema changes (old data is ignored → re-seeds).
const V = 'coopeer.db.v1';

const KEY = {
  places: `${V}.places`,
  clubs: `${V}.clubs`,
  games: `${V}.games`,
  memberships: `${V}.memberships`,
  payments: `${V}.payments`,
  paymentMethods: `${V}.paymentMethods`,
} as const;

export interface DbSnapshot {
  places: Place[];
  clubs: Club[];
  games: Game[];
  memberships: string[];
  payments: Payment[];
  paymentMethods: PaymentMethod[];
}

// Games are serialised with ISO date strings; revive them on read.
type RawGame = Omit<Game, 'start' | 'end'> & { start: string; end: string };

function reviveGames(raw: RawGame[]): Game[] {
  return raw.map((g) => ({ ...g, start: new Date(g.start), end: new Date(g.end) }));
}

function safeparse<T>(raw: string | null | undefined, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Load all collections from AsyncStorage. Returns null if not yet seeded. */
export async function load(): Promise<DbSnapshot | null> {
  try {
    const pairs = await AsyncStorage.multiGet(Object.values(KEY));
    const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));

    // If the three core collections are absent, the db has never been seeded.
    if (!map[KEY.places] || !map[KEY.clubs] || !map[KEY.games]) return null;

    return {
      places: safeparse<Place[]>(map[KEY.places], []),
      clubs: safeparse<Club[]>(map[KEY.clubs], []),
      games: reviveGames(safeparse<RawGame[]>(map[KEY.games], [])),
      memberships: safeparse<string[]>(map[KEY.memberships], []),
      payments: safeparse<Payment[]>(map[KEY.payments], []),
      paymentMethods: safeparse<PaymentMethod[]>(map[KEY.paymentMethods], []),
    };
  } catch {
    return null;
  }
}

/** Persist the full snapshot to AsyncStorage. */
export async function save(snapshot: DbSnapshot): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [KEY.places, JSON.stringify(snapshot.places)],
      [KEY.clubs, JSON.stringify(snapshot.clubs)],
      [KEY.games, JSON.stringify(snapshot.games)],
      [KEY.memberships, JSON.stringify(snapshot.memberships)],
      [KEY.payments, JSON.stringify(snapshot.payments)],
      [KEY.paymentMethods, JSON.stringify(snapshot.paymentMethods)],
    ]);
  } catch (e) {
    console.warn('[localDb] save failed', e);
  }
}

/** Seed from mock data and persist. Called once on first run. */
export async function seed(): Promise<DbSnapshot> {
  const snap: DbSnapshot = {
    places: mock.places.map(withSavedPhotos),
    clubs: mock.clubs,
    games: mock.makeGames(new Date()),
    memberships: ['c1', 'c4'],
    payments: mock.payments,
    paymentMethods: mock.paymentMethods,
  };
  await save(snap);
  return snap;
}

/**
 * Reset to mock data (useful during development).
 * Call from a debug menu or the console: `import { reset } from 'src/state/localDb'`.
 */
export async function reset(): Promise<DbSnapshot> {
  await AsyncStorage.multiRemove(Object.values(KEY));
  return seed();
}
