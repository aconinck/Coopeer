import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ME, gameStatus, type Club, type Game, type Payment, type Place, type RSVP } from './models';
import * as mock from './mockData';

// In-memory data layer. To use a real backend, replace the internals of this
// provider; screens only use the values and actions returned by useStore().

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
  myClubs: Club[];
  mySchedule: Game[];
  join: (clubId: string) => void;
  leave: (clubId: string) => void;
  setRSVP: (gameId: string, rsvp: RSVP) => void;
  findClub: (code: string) => Promise<Club | undefined>;
  cancelPayment: (paymentId: string) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => new Date());
  const [clubs, setClubs] = useState(mock.clubs);
  const [games, setGames] = useState(() => mock.makeGames(new Date()));
  const [memberships, setMemberships] = useState<Set<string>>(() => new Set(['c1', 'c4']));
  const [payments, setPayments] = useState(mock.payments);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const join = useCallback(
    (clubId: string) => {
      if (memberships.has(clubId)) return;
      setMemberships(new Set(memberships).add(clubId));
      setClubs((list) =>
        list.map((c) => (c.id === clubId ? { ...c, memberCount: c.memberCount + 1, members: [ME, ...c.members] } : c)),
      );
    },
    [memberships],
  );

  const leave = useCallback(
    (clubId: string) => {
      if (!memberships.has(clubId)) return;
      const next = new Set(memberships);
      next.delete(clubId);
      setMemberships(next);
      setClubs((list) =>
        list.map((c) =>
          c.id === clubId ? { ...c, memberCount: c.memberCount - 1, members: c.members.filter((m) => m.id !== ME.id) } : c,
        ),
      );
    },
    [memberships],
  );

  const setRSVP = useCallback((gameId: string, rsvp: RSVP) => {
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
  }, []);

  const value = useMemo<Store>(() => {
    const active = (g: Game) => gameStatus(g, now) !== 'ended';
    const byStart = (a: Game, b: Game) => a.start.getTime() - b.start.getTime();
    const gamesFor = (clubId: string) => games.filter((g) => g.clubId === clubId && active(g)).sort(byStart);

    return {
      now,
      places: mock.places,
      clubs,
      games,
      payments,
      place: (id) => mock.places.find((p) => p.id === id),
      club: (id) => clubs.find((c) => c.id === id),
      game: (id) => games.find((g) => g.id === id),
      upcomingGamesAt: (placeId) => games.filter((g) => g.placeId === placeId && active(g) && !g.isCanceled).sort(byStart),
      clubsAt: (placeId) => clubs.filter((c) => c.homePlaceId === placeId),
      gamesFor,
      nextGameFor: (clubId) => gamesFor(clubId).find((g) => !g.isCanceled),
      isMember: (clubId) => memberships.has(clubId),
      myClubs: clubs.filter((c) => memberships.has(c.id)),
      mySchedule: games
        .filter((g) => active(g) && (g.myRSVP === 'going' || (g.clubId !== null && memberships.has(g.clubId))))
        .sort(byStart),
      join,
      leave,
      setRSVP,
      findClub: async (code) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return clubs.find((c) => c.code === code);
      },
      cancelPayment: (paymentId) => setPayments((list) => list.filter((p) => p.id !== paymentId)),
    };
  }, [now, clubs, games, payments, memberships, join, leave, setRSVP]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
