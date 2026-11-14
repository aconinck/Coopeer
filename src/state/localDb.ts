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
import { applyWeekly, type Club, type ClubInvite, type Game, type Payment, type PaymentMethod, type Place } from './models';
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
  seededOn: `${V}.seededOn`,
  weekly: `${V}.weekly`,
  clubInvites: `${V}.clubInvites`,
} as const;

// Bump when the demo games gain new fields (series, invitations): the next load regenerates them once, keeping your answers.
const DEMO_REV = 3;
const seedStamp = () => `${new Date().toDateString()}|${DEMO_REV}`;

export interface DbSnapshot {
  places: Place[];
  clubs: Club[];
  games: Game[];
  memberships: string[];
  payments: Payment[];
  paymentMethods: PaymentMethod[];
  /** Series ids you joined every week. */
  weekly: string[];
  clubInvites: ClubInvite[];
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

/**
 * The demo games are generated relative to the moment they were first seeded, so a day later they are all over
 * and the feed is empty. Once a day, regenerate them around today, keeping your own answers and any game you made.
 */
function refreshDemoGames(stored: Game[]): Game[] {
  const fresh = mock.makeGames(new Date());
  const freshIds = new Set(fresh.map((g) => g.id));
  const old = new Map(stored.map((g) => [g.id, g]));
  const demo = fresh.map((g) => {
    const before = old.get(g.id);
    if (!before || before.myRSVP === 'none') return g;
    return { ...g, myRSVP: before.myRSVP, going: before.going, declined: before.declined, noResponse: before.noResponse, maybe: before.maybe, viaWeekly: before.viaWeekly };
  });
  return [...stored.filter((g) => !freshIds.has(g.id)), ...demo];
}

/** Load all collections from AsyncStorage. Returns null if not yet seeded. */
export async function load(): Promise<DbSnapshot | null> {
  try {
    const pairs = await AsyncStorage.multiGet(Object.values(KEY));
    const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));

    // If the three core collections are absent, the db has never been seeded.
    if (!map[KEY.places] || !map[KEY.clubs] || !map[KEY.games]) return null;

    // An empty snapshot (left behind when the app ran against an empty server) is not data: seed again.
    const placeCount = safeparse<unknown[]>(map[KEY.places], []).length;
    const clubCount = safeparse<unknown[]>(map[KEY.clubs], []).length;
    if (placeCount === 0 || clubCount === 0) return null;

    // Older snapshots have no weekly list or invitations yet: those start from the demo profile, not from nothing.
    const weekly = map[KEY.weekly] ? safeparse<string[]>(map[KEY.weekly], []) : mock.defaultWeekly;
    const clubInvites = map[KEY.clubInvites] ? safeparse<ClubInvite[]>(map[KEY.clubInvites], []) : mock.clubInvites;

    const stored = reviveGames(safeparse<RawGame[]>(map[KEY.games], []));
    const stamp = seedStamp();
    const refreshed = map[KEY.seededOn] === stamp ? stored : refreshDemoGames(stored);
    const games = applyWeekly(refreshed, weekly);
    if (refreshed !== stored) {
      AsyncStorage.multiSet([
        [KEY.games, JSON.stringify(games)],
        [KEY.seededOn, stamp],
        [KEY.weekly, JSON.stringify(weekly)],
        [KEY.clubInvites, JSON.stringify(clubInvites)],
      ]).catch(() => undefined);
    }

    return {
      // Photo files can change location between sessions, so the saved park photos are resolved again on every load.
      places: safeparse<Place[]>(map[KEY.places], []).map(withSavedPhotos),
      clubs: safeparse<Club[]>(map[KEY.clubs], []),
      games,
      memberships: safeparse<string[]>(map[KEY.memberships], []),
      payments: safeparse<Payment[]>(map[KEY.payments], []),
      paymentMethods: safeparse<PaymentMethod[]>(map[KEY.paymentMethods], []),
      weekly,
      clubInvites,
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
      [KEY.weekly, JSON.stringify(snapshot.weekly)],
      [KEY.clubInvites, JSON.stringify(snapshot.clubInvites)],
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
    games: applyWeekly(mock.makeGames(new Date()), mock.defaultWeekly),
    memberships: ['c1', 'c4'],
    payments: mock.payments,
    paymentMethods: mock.paymentMethods,
    weekly: mock.defaultWeekly,
    clubInvites: mock.clubInvites,
  };
  await save(snap);
  await AsyncStorage.setItem(KEY.seededOn, seedStamp()).catch(() => undefined);
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
