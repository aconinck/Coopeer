import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ME, gameStatus, type Club, type Game, type NewClub, type NewGame, type Payment, type Place, type RSVP } from './models';
import { time, weekday } from '../lib/format';
import { pitchById, pitchTitle, placeForPitch as nearestPlace, type Pitch } from '../map/pitches';
import * as mock from './mockData';
import * as api from './api';
import { hasBackend } from '../lib/supabase';
import { useSession } from './session';

// Data layer. With Supabase configured (src/lib/supabase.ts) it loads everything for the signed-in
// user, applies every change optimistically, writes it to the database and refreshes on realtime
// events. Without keys it runs on the in-memory demo data. Screens only use useStore().

interface Store {
  now: Date;
  places: Place[];
  clubs: Club[];
  games: Game[];
  payments: Payment[];
  place: (id: string) => Place | undefined;
  club: (id: string) => Club | undefined;
  game: (id: string) => Game | undefined;
  upcomingGamesAt: (placeId: string) => Game[];
  clubsAt: (placeId: string) => Club[];
  gamesFor: (clubId: string) => Game[];
  nextGameFor: (clubId: string) => Game | undefined;
  isMember: (clubId: string) => boolean;
  isAdmin: (clubId: string) => boolean;
  myClubs: Club[];
  mySchedule: Game[];
  join: (clubId: string) => void;
  leave: (clubId: string) => void;
  setRSVP: (gameId: string, rsvp: RSVP) => void;
  findClub: (code: string) => Promise<Club | undefined>;
  cancelPayment: (paymentId: string) => void;
  /** Creates a club owned by the current user (member + admin) with a fresh 8-digit code. */
  createClub: (input: NewClub) => Club;
  /** Creates a club or open game (plus repeats). Returns the first occurrence. */
  createGame: (input: NewGame) => Game;
  /** The place a map field/court belongs to; creates (and stores) one if none is nearby. */
  placeForPitch: (pitchId: string) => Place | undefined;
  /** Saves a searched place (or adds a sport to a known one) and returns it. */
  addPlace: (place: Place) => Place;
}

/** Existing place near the pitch, or the place that would be created for it (not stored). */
export function pitchPlace(pitch: Pitch, places: Place[]): Place {
  return (
    nearestPlace(pitch, places) ?? {
      id: `pitch-${pitch.id}`,
      kind: pitch.sport === 'soccer' ? 'field' : 'courts',
      name: pitch.park ? `${pitch.park} ${pitch.sport === 'soccer' ? 'Field' : 'Courts'}` : pitchTitle(pitch),
      address: pitch.park ?? 'Bentonville, AR',
      latitude: pitch.latitude,
      longitude: pitch.longitude,
      sports: [pitch.sport],
    }
  );
}

const DAY = 24 * 3600 * 1000;

/** Unique enough for client-made ids (also used as the database primary key). */
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function occurrences(start: Date, repeat: NewGame['repeat']): number[] {
  if (repeat === 'weekly') return [0, 7, 14, 21].map((d) => d * DAY);
  if (repeat === 'weekdays') {
    const offsets: number[] = [];
    for (let d = 0; d < 14; d++) {
      const day = new Date(start.getTime() + d * DAY).getDay();
      if (day !== 0 && day !== 6) offsets.push(d * DAY);
    }
    return offsets;
  }
  return [0];
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => new Date());
  const session = useSession();
  const uid = hasBackend ? (session.user?.id ?? null) : null;
  const [places, setPlaces] = useState<Place[]>(hasBackend ? [] : mock.places);
  const [clubs, setClubs] = useState<Club[]>(hasBackend ? [] : mock.clubs);
  const [games, setGames] = useState<Game[]>(() => (hasBackend ? [] : mock.makeGames(new Date())));
  const [memberships, setMemberships] = useState<Set<string>>(() => new Set(hasBackend ? [] : ['c1', 'c4']));
  const [payments, setPayments] = useState(mock.payments);
  // Writes run one after another so a new place lands before the game that uses it.
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const refresh = useCallback(async () => {
    if (!uid) return null;
    try {
      const data = await api.fetchAll(uid);
      setPlaces(data.places);
      setClubs(data.clubs);
      setGames(data.games);
      setMemberships(data.memberships);
      return data;
    } catch (error) {
      console.warn('Could not load data', error);
      return null;
    }
  }, [uid]);

  // Load on sign-in, then stay live: any change by anyone triggers a refresh.
  useEffect(() => {
    if (!uid) return;
    refresh();
    return api.subscribe(refresh);
  }, [uid, refresh]);

  /** Fire a write; the UI already shows the change. On failure, reload the truth from the server. */
  const sync = useCallback(
    (write: (id: string) => Promise<void>) => {
      if (!uid) return;
      queue.current = queue.current.then(() =>
        write(uid).catch((error) => {
          console.warn('Could not save', error);
          refresh();
        }),
      );
    },
    [uid, refresh],
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const join = useCallback(
    (clubId: string) => {
      if (memberships.has(clubId)) return;
      setMemberships(new Set(memberships).add(clubId));
      sync((id) => api.joinClub(id, clubId));
      setClubs((list) =>
        list.map((c) => (c.id === clubId ? { ...c, memberCount: c.memberCount + 1, members: [ME, ...c.members] } : c)),
      );
    },
    [memberships, sync],
  );

  const leave = useCallback(
    (clubId: string) => {
      if (!memberships.has(clubId)) return;
      const next = new Set(memberships);
      next.delete(clubId);
      setMemberships(next);
      sync((id) => api.leaveClub(id, clubId));
      setClubs((list) =>
        list.map((c) =>
          c.id === clubId ? { ...c, memberCount: c.memberCount - 1, members: c.members.filter((m) => m.id !== ME.id) } : c,
        ),
      );
    },
    [memberships, sync],
  );

  const setRSVP = useCallback((gameId: string, rsvp: RSVP) => {
    sync((id) => api.setRSVP(id, gameId, rsvp));
    setGames((list) =>
      list.map((g) => {
        if (g.id !== gameId) return g;
        const without = (members: typeof g.going) => members.filter((m) => m.id !== ME.id);
        return {
          ...g,
          myRSVP: rsvp,
          going: rsvp === 'going' ? [ME, ...without(g.going)] : without(g.going),
          declined: rsvp === 'declined' ? [ME, ...without(g.declined)] : without(g.declined),
          noResponse: without(g.noResponse),
        };
      }),
    );
  }, [sync]);

  const createClub = useCallback(
    (input: NewClub): Club => {
      const taken = new Set(clubs.map((c) => c.code));
      let code = '';
      do code = String(10_000_000 + Math.floor(Math.random() * 90_000_000));
      while (taken.has(code));
      const club: Club = {
        id: newId('c'),
        name: input.name.trim(),
        sport: input.sport,
        homePlaceId: input.homePlaceId,
        cadence: 'No regular time yet',
        about: input.about.trim(),
        links: input.links,
        members: [ME],
        memberCount: 1,
        monthlyPrice: input.monthlyPrice,
        level: 'All levels',
        code,
        isNew: true,
        photoUri: input.photoUri,
        ownerId: ME.id,
        adminIds: [ME.id],
        payoutLast4: input.payoutLast4,
      };
      setClubs((list) => [club, ...list]);
      setMemberships((current) => new Set(current).add(club.id));
      sync((id) => api.createClub(id, club));
      return club;
    },
    [clubs, sync],
  );

  const createGame = useCallback(
    (input: NewGame): Game => {
      const club = input.clubId ? clubs.find((c) => c.id === input.clubId) : undefined;
      const sport = club?.sport ?? input.sport;
      const roster = club?.members ?? [];
      const invited = (input.inviteeIds === null ? roster : roster.filter((m) => input.inviteeIds?.includes(m.id))).filter((m) => m.id !== ME.id);
      const stamp = newId('g');
      const created: Game[] = occurrences(input.start, input.repeat).map((offset, index) => ({
        id: `${stamp}-${index}`,
        sport,
        placeId: input.placeId,
        clubId: input.clubId,
        title: input.title.trim(),
        details: input.details.trim(),
        start: new Date(input.start.getTime() + offset),
        end: new Date(input.end.getTime() + offset),
        capacity: sport === 'soccer' ? 14 : sport === 'trails' ? 12 : 8,
        going: [ME],
        declined: [],
        noResponse: invited,
        dropInPrice: 7,
        level: club?.level ?? 'All levels',
        myRSVP: 'going',
        isNew: true,
      }));
      setGames((list) => [...list, ...created]);
      // Create the game first, then the club cadence (it depends on nothing else).
      sync((id) => api.createGames(id, created, invited.map((m) => m.id)));
      if (club && input.repeat !== 'never') {
        const cadence = input.repeat === 'weekly' ? `Every ${weekday(input.start)} · ${time(input.start)}` : `Weekdays · ${time(input.start)}`;
        setClubs((list) => list.map((c) => (c.id === club.id ? { ...c, cadence } : c)));
        sync(() => api.setClubCadence(club.id, cadence));
      }
      return created[0];
    },
    [clubs, sync],
  );

  const placeForPitch = useCallback(
    (pitchId: string): Place | undefined => {
      const pitch = pitchById(pitchId);
      if (!pitch) return undefined;
      const place = pitchPlace(pitch, places);
      if (!places.some((p) => p.id === place.id)) {
        setPlaces((list) => (list.some((p) => p.id === place.id) ? list : [...list, place]));
        sync((id) => api.savePlace(id, place, true));
      }
      return place;
    },
    [places, sync],
  );

  const addPlace = useCallback(
    (place: Place): Place => {
      const existing = places.find((p) => p.id === place.id);
      const merged = existing ? { ...existing, sports: Array.from(new Set([...existing.sports, ...place.sports])) } : place;
      setPlaces((list) => (list.some((p) => p.id === place.id) ? list.map((p) => (p.id === place.id ? merged : p)) : [...list, merged]));
      sync((id) => api.savePlace(id, merged, !existing));
      return merged;
    },
    [places, sync],
  );

  const value = useMemo<Store>(() => {
    const active = (g: Game) => gameStatus(g, now) !== 'ended';
    const byStart = (a: Game, b: Game) => a.start.getTime() - b.start.getTime();
    const gamesFor = (clubId: string) => games.filter((g) => g.clubId === clubId && active(g)).sort(byStart);

    return {
      now,
      places,
      clubs,
      games,
      payments,
      place: (id) => places.find((p) => p.id === id),
      club: (id) => clubs.find((c) => c.id === id),
      game: (id) => games.find((g) => g.id === id),
      upcomingGamesAt: (placeId) => games.filter((g) => g.placeId === placeId && active(g) && !g.isCanceled).sort(byStart),
      clubsAt: (placeId) => clubs.filter((c) => c.homePlaceId === placeId),
      gamesFor,
      nextGameFor: (clubId) => gamesFor(clubId).find((g) => !g.isCanceled),
      isMember: (clubId) => memberships.has(clubId),
      isAdmin: (clubId) => clubs.find((c) => c.id === clubId)?.adminIds?.includes(ME.id) ?? false,
      myClubs: clubs.filter((c) => memberships.has(c.id)),
      mySchedule: games
        .filter((g) => active(g) && (g.myRSVP === 'going' || (g.clubId !== null && memberships.has(g.clubId))))
        .sort(byStart),
      join,
      leave,
      setRSVP,
      findClub: async (code) => {
        if (uid) return (await refresh())?.clubs.find((c) => c.code === code) ?? clubs.find((c) => c.code === code);
        await new Promise((resolve) => setTimeout(resolve, 600));
        return clubs.find((c) => c.code === code);
      },
      cancelPayment: (paymentId) => setPayments((list) => list.filter((p) => p.id !== paymentId)),
      createClub,
      createGame,
      placeForPitch,
      addPlace,
    };
  }, [now, places, clubs, games, payments, memberships, join, leave, setRSVP, createClub, createGame, placeForPitch, addPlace, uid, refresh]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
