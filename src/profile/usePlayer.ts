import { useEffect, useMemo, useState } from 'react';
import { hasBackend } from '../lib/supabase';
import * as api from '../state/api';
import { ME, gameStatus, type SportId } from '../state/models';
import { computeStats, type PlayedGame, type PlayerStats } from '../state/profile';
import { useSession } from '../state/session';
import { useStore } from '../state/store';

export interface PlayerView {
  isMe: boolean;
  name: string;
  /** Favorite sports picked at sign-up (own profile only in demo mode). */
  favorites: SportId[];
  /** "Mar 2025" when known. */
  since?: string;
  stats: PlayerStats;
  clubIds: string[];
  loading: boolean;
}

const month = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

/**
 * One player's profile numbers, computed the same way for you and for everyone else.
 * With Supabase it reads the player's ended "going" games; in demo mode it derives them from the store.
 */
export function usePlayer(id: string): PlayerView {
  const store = useStore();
  const session = useSession();
  const me = session.user;
  const isMe = id === ME.id || (!!me && id === me.id);
  const realId = isMe ? me?.id : id;
  const [remote, setRemote] = useState<api.PlayerData | null>(null);
  const [loading, setLoading] = useState(hasBackend);

  // Your own numbers move whenever your games do; someone else's load once.
  const refreshKey = isMe ? store.games : null;
  useEffect(() => {
    if (!hasBackend || !realId) return;
    let cancelled = false;
    api
      .fetchPlayer(realId)
      .then((data) => !cancelled && setRemote(data))
      .catch((error) => console.warn('Could not load player', error))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [realId, refreshKey]);

  return useMemo<PlayerView>(() => {
    if (hasBackend) {
      const data = remote;
      return {
        isMe,
        name: data?.name ?? (isMe ? (me?.name ?? 'Player') : 'Player'),
        favorites: data?.sports ?? [],
        since: data?.createdAt ? month(data.createdAt) : undefined,
        stats: computeStats(data?.played ?? [], data?.clubIds.length ?? 0, store.now),
        clubIds: data?.clubIds ?? [],
        loading,
      };
    }
    const key = isMe ? ME.id : id;
    const played: PlayedGame[] = store.games
      .filter((g) => gameStatus(g, store.now) === 'ended' && !g.isCanceled && g.going.some((m) => m.id === key))
      .map((g) => ({ sport: g.sport, placeId: g.placeId, start: g.start, end: g.end }));
    const clubIds = isMe ? store.myClubs.map((c) => c.id) : store.clubs.filter((c) => c.members.some((m) => m.id === key)).map((c) => c.id);
    const known = store.clubs.flatMap((c) => c.members).concat(store.games.flatMap((g) => g.going)).find((m) => m.id === key);
    return {
      isMe,
      name: isMe ? (me?.name ?? 'You') : (known?.name ?? 'Player'),
      favorites: isMe ? (me?.sports ?? []) : [],
      stats: computeStats(played, clubIds.length, store.now),
      clubIds,
      loading: false,
    };
  }, [remote, loading, isMe, id, me, store.games, store.clubs, store.myClubs, store.now]);
}
