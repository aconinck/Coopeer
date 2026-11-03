import type { MediaAspect } from '../constants/theme';
import type { Member, SportId } from '../state/models';

// Mock Explore feed for Bentonville. Authors are the same people as in mockData
// (ids m0–m15), clubs/games/places reference the store ids.

export type ClipName = 'penalty' | 'goal' | 'passing' | 'match';
export type PhotoName = 'soccer' | 'ride' | 'goal' | 'match' | 'passing' | 'penalty' | 'night';

interface PostBase {
  id: string;
  author: Member;
  clubId: string;
  sport: SportId;
  minutesAgo: number;
  likes: number;
  comments: number;
}

export interface ClipPost extends PostBase {
  kind: 'clip';
  clip: ClipName;
  caption: string;
  tag: string;
  /** Frame size in the feed; the clip always fills it. */
  aspect: MediaAspect;
  gameId?: string;
}

export interface ResultPost extends PostBase {
  kind: 'result';
  /** A game in the store; when omitted the card links to the club instead. */
  gameId?: string;
  placeId: string;
  home: string;
  away: string;
  score: [number, number];
  status: 'final' | 'live';
  mvp?: Member;
}

export interface HighlightPost extends PostBase {
  kind: 'highlight';
  stat: string;
  statLabel: string;
  title: string;
  caption: string;
  gameId?: string;
}

export interface PhotoPost extends PostBase {
  kind: 'photo';
  /** 1 photo uses `aspect`; 2 sit side by side; 3+ become a big one plus a stacked pair. */
  photos: PhotoName[];
  aspect?: MediaAspect;
  caption: string;
}

export type FeedPost = ClipPost | ResultPost | HighlightPost | PhotoPost;

const avatars: Record<number, string> = {
  0: 'https://i.pravatar.cc/150?img=3',
  1: 'https://i.pravatar.cc/150?img=5',
  2: 'https://i.pravatar.cc/150?img=8',
  3: 'https://i.pravatar.cc/150?img=11',
  4: 'https://i.pravatar.cc/150?img=16',
  5: 'https://i.pravatar.cc/150?img=21',
  6: 'https://i.pravatar.cc/150?img=25',
  7: 'https://i.pravatar.cc/150?img=29',
  8: 'https://i.pravatar.cc/150?img=33',
  9: 'https://i.pravatar.cc/150?img=38',
  10: 'https://i.pravatar.cc/150?img=42',
  11: 'https://i.pravatar.cc/150?img=47',
  12: 'https://i.pravatar.cc/150?img=52',
};

const people: Record<number, string> = {
  0: 'Alex Rivera', 1: 'Jordan Lee', 2: 'Sam Torres', 3: 'Casey Wong',
  4: 'Taylor Brooks', 5: 'Morgan Diaz', 6: 'Riley Chen', 7: 'Jamie Patel',
  8: 'Drew Carter', 9: 'Avery Kim', 10: 'Quinn Foster', 11: 'Parker Hughes', 12: 'Reese Morgan',
};

const m = (id: number): Member => ({ id: `m${id}`, name: people[id], photoUri: avatars[id] });

export const posts: FeedPost[] = [
  {
    kind: 'result', id: 'f1', author: m(0), clubId: 'c1', sport: 'soccer', minutesAgo: 6, likes: 41, comments: 9,
    gameId: 'g1', placeId: 'p1', home: 'Strikers Orange', away: 'Strikers White', score: [2, 1], status: 'live', mvp: m(1),
  },
  {
    kind: 'clip', id: 'f2', author: m(1), clubId: 'c1', sport: 'soccer', minutesAgo: 24, likes: 128, comments: 17,
    clip: 'goal', aspect: 'portrait', tag: "GOAL · 12'", caption: 'Bottom corner. Keeper had no chance.', gameId: 'g1',
  },
  {
    kind: 'highlight', id: 'f3', author: m(5), clubId: 'c4', sport: 'pickleball', minutesAgo: 75, likes: 64, comments: 6,
    stat: '11–0', statLabel: 'shutout game', title: 'Pickled!', caption: 'Morgan & Riley didn\'t drop a single point in game two of the ladder.',
  },
  {
    kind: 'clip', id: 'f4', author: m(3), clubId: 'c2', sport: 'soccer', minutesAgo: 140, likes: 92, comments: 11,
    clip: 'penalty', aspect: 'square', tag: 'PENALTY', caption: 'Ice cold from the spot to win it in extra time.',
  },
  {
    kind: 'result', id: 'f5', author: m(7), clubId: 'c3', sport: 'pickleball', minutesAgo: 210, likes: 37, comments: 4,
    placeId: 'p3', home: 'Jamie / Drew', away: 'Avery / Quinn', score: [11, 8], status: 'final', mvp: m(8),
  },
  {
    kind: 'clip', id: 'f6', author: m(10), clubId: 'c5', sport: 'soccer', minutesAgo: 320, likes: 55, comments: 3,
    clip: 'passing', aspect: 'landscape', tag: 'TEAM PLAY', caption: 'Twelve passes before the shot. Midweek 7v7 is leveling up.',
  },
  {
    kind: 'highlight', id: 'f7', author: m(1), clubId: 'c1', sport: 'soccer', minutesAgo: 600, likes: 210, comments: 28,
    stat: '3', statLabel: 'goals this week', title: 'Hat-trick night', caption: 'Jordan scored three in Friday Night Soccer — and still stayed for a round after.', gameId: 'g9',
  },
  {
    kind: 'photo', id: 'f8', author: m(11), clubId: 'c7', sport: 'soccer', minutesAgo: 900, likes: 73, comments: 5,
    photos: ['night', 'match', 'goal'], caption: 'Futsal Thursday was electric. See you next week.',
  },
  {
    kind: 'result', id: 'f9', author: m(4), clubId: 'c2', sport: 'soccer', minutesAgo: 1440, likes: 48, comments: 7,
    placeId: 'p2', home: 'Sunday Blue', away: 'Sunday Red', score: [0, 0], status: 'final', mvp: m(12),
  },
  {
    kind: 'photo', id: 'f13', author: m(2), clubId: 'c5', sport: 'soccer', minutesAgo: 1200, likes: 88, comments: 6,
    photos: ['soccer'], aspect: 'landscape', caption: 'Golden hour at Phillips Park. Best pitch in Bentonville.',
  },
  {
    kind: 'photo', id: 'f14', author: m(3), clubId: 'c2', sport: 'soccer', minutesAgo: 2100, likes: 42, comments: 3,
    photos: ['passing', 'penalty'], caption: 'Pre-game and the moment that won it. Sunday League round 5.',
  },
  {
    kind: 'clip', id: 'f10', author: m(12), clubId: 'c7', sport: 'soccer', minutesAgo: 1900, likes: 66, comments: 8,
    clip: 'match', aspect: 'tall', tag: 'NIGHT GAME', caption: 'Indoor 5v5 under the Community Center lights.', gameId: 'g8',
  },
  {
    kind: 'highlight', id: 'f11', author: m(6), clubId: 'c6', sport: 'pickleball', minutesAgo: 2600, likes: 29, comments: 2,
    stat: '6–0', statLabel: 'games in a row', title: 'Riley Chen on a streak', caption: 'Six straight wins on court 3 at lunch open play. The paddle is hot.',
  },
  {
    kind: 'photo', id: 'f12', author: m(9), clubId: 'c1', sport: 'soccer', minutesAgo: 3400, likes: 51, comments: 4,
    photos: ['ride'], aspect: 'portrait', caption: 'Biked to Friday Night Soccer. Worth every mile.',
  },
];

export function timeAgo(minutes: number) {
  if (minutes < 60) return `${Math.max(minutes, 1)}m`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / (60 * 24))}d`;
}
