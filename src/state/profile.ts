import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { sportIds, type SportId } from './models';

// Player profile numbers. Everything here is DERIVED from what the app already records:
// the games a player said "I'm in" for that have ended, and the clubs they belong to.
// Nothing is typed in by hand, so it stays current every time someone plays.
// ("Played" = RSVP'd going to a game that ended and was not canceled; there is no check-in yet.)

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** One game a player took part in. */
export interface PlayedGame {
  sport: SportId;
  placeId: string;
  start: Date;
  end: Date;
}

export interface PlayerStats {
  games: number;
  hours: number;
  places: number;
  clubs: number;
  /** Consecutive weeks (ending this week or last) with at least one game. */
  streakWeeks: number;
  bestStreakWeeks: number;
  bySport: Record<SportId, { games: number; hours: number }>;
}

const HOUR = 3600 * 1000;
const WEEK = 7 * 24 * HOUR;
// Weeks start on Monday: the epoch was a Thursday, so shift by 3 days.
const weekIndex = (d: Date) => Math.floor((d.getTime() + 3 * 24 * HOUR) / WEEK);

export function computeStats(played: PlayedGame[], clubs: number, now = new Date()): PlayerStats {
  const bySport = Object.fromEntries(sportIds.map((id) => [id, { games: 0, hours: 0 }])) as PlayerStats['bySport'];
  const placeIds = new Set<string>();
  const weeks = new Set<number>();
  let ms = 0;
  for (const g of played) {
    const length = Math.max(g.end.getTime() - g.start.getTime(), 0);
    ms += length;
    bySport[g.sport].games += 1;
    bySport[g.sport].hours += length / HOUR;
    placeIds.add(g.placeId);
    weeks.add(weekIndex(g.start));
  }

  const thisWeek = weekIndex(now);
  let streak = 0;
  for (let w = weeks.has(thisWeek) ? thisWeek : thisWeek - 1; weeks.has(w); w--) streak++;
  let best = 0;
  let run = 0;
  for (const w of [...weeks].sort((a, b) => a - b)) {
    run = weeks.has(w - 1) ? run + 1 : 1;
    best = Math.max(best, run);
  }

  for (const id of sportIds) bySport[id].hours = Math.round(bySport[id].hours * 10) / 10;
  return { games: played.length, hours: Math.round((ms / HOUR) * 10) / 10, places: placeIds.size, clubs, streakWeeks: streak, bestStreakWeeks: best, bySport };
}

/** "96", "12.5" (one decimal only when it matters). */
export const formatHours = (hours: number) => (Number.isInteger(hours) ? `${hours}` : hours.toFixed(1));

// Achievements: plain thresholds over PlayerStats. -----------------------------

export type AchievementTier = 'gold' | 'silver' | 'bronze';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  tier: AchievementTier;
  earned: boolean;
  /** Progress toward it (current, target). */
  progress: [number, number];
}

const sportsPlayed = (s: PlayerStats) => sportIds.filter((id) => s.bySport[id].games > 0).length;

const rules: { id: string; title: string; description: string; icon: IconName; tier: AchievementTier; value: (s: PlayerStats) => number; target: number }[] = [
  { id: 'first', title: 'First game', description: 'Play your first game on Coopeer.', icon: 'flag-checkered', tier: 'bronze', value: (s) => s.games, target: 1 },
  { id: 'ten', title: '10 games', description: 'Play 10 games.', icon: 'numeric-10-circle-outline', tier: 'bronze', value: (s) => s.games, target: 10 },
  { id: 'fifty', title: 'Fifty', description: 'Play 50 games.', icon: 'star-circle', tier: 'silver', value: (s) => s.games, target: 50 },
  { id: 'hundred', title: 'Centurion', description: 'Play 100 games.', icon: 'trophy', tier: 'gold', value: (s) => s.games, target: 100 },
  { id: 'streak', title: 'On fire', description: 'Play 4 weeks in a row.', icon: 'fire', tier: 'silver', value: (s) => s.bestStreakWeeks, target: 4 },
  { id: 'places', title: 'Explorer', description: 'Play at 5 different places.', icon: 'map-marker-radius', tier: 'silver', value: (s) => s.places, target: 5 },
  { id: 'clubs', title: 'Club regular', description: 'Join 3 clubs.', icon: 'account-group', tier: 'bronze', value: (s) => s.clubs, target: 3 },
  { id: 'sports', title: 'Triple threat', description: 'Play all three sports.', icon: 'medal', tier: 'gold', value: sportsPlayed, target: sportIds.length },
];

export function achievementsFor(stats: PlayerStats): Achievement[] {
  return rules.map((r) => {
    const value = Math.min(r.value(stats), r.target);
    return { id: r.id, title: r.title, description: r.description, icon: r.icon, tier: r.tier, earned: value >= r.target, progress: [value, r.target] };
  });
}
