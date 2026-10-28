import type { Member, SportId } from '../state/models';

// Mock Explore feed for Bentonville. Authors are the same people as in mockData
// (ids m0–m15), clubs/games/places reference the store ids.

export type ClipName = 'penalty' | 'goal' | 'passing' | 'match';
export type PhotoName = 'soccer' | 'ride';

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
  photo: PhotoName;
  caption: string;
}

export type FeedPost = ClipPost | ResultPost | HighlightPost | PhotoPost;

const m = (id: number, name: string): Member => ({ id: `m${id}`, name });

export const posts: FeedPost[] = [
  {
    kind: 'result', id: 'f1', author: m(0, 'Alex Rivera'), clubId: 'c1', sport: 'soccer', minutesAgo: 6, likes: 41, comments: 9,
    gameId: 'g1', placeId: 'p1', home: 'Strikers Orange', away: 'Strikers White', score: [2, 1], status: 'live', mvp: m(1, 'Jordan Lee'),
  },
  {
    kind: 'clip', id: 'f2', author: m(1, 'Jordan Lee'), clubId: 'c1', sport: 'soccer', minutesAgo: 24, likes: 128, comments: 17,
    clip: 'goal', tag: "GOAL · 12'", caption: 'Bottom corner. Keeper had no chance 🎯', gameId: 'g1',
  },
  {
    kind: 'highlight', id: 'f3', author: m(5, 'Morgan Diaz'), clubId: 'c4', sport: 'pickleball', minutesAgo: 75, likes: 64, comments: 6,
    stat: '11–0', statLabel: 'shutout game', title: 'Pickled!', caption: 'Morgan & Riley didn’t drop a single point in game two of the ladder.',
  },
  {
    kind: 'clip', id: 'f4', author: m(3, 'Casey Wong'), clubId: 'c2', sport: 'soccer', minutesAgo: 140, likes: 92, comments: 11,
    clip: 'penalty', tag: 'PENALTY', caption: 'Ice cold from the spot to win it in extra time.',
  },
  {
    kind: 'result', id: 'f5', author: m(7, 'Jamie Patel'), clubId: 'c3', sport: 'pickleball', minutesAgo: 210, likes: 37, comments: 4,
    placeId: 'p3', home: 'Jamie / Drew', away: 'Avery / Quinn', score: [11, 8], status: 'final', mvp: m(8, 'Drew Carter'),
  },
  {
    kind: 'clip', id: 'f6', author: m(10, 'Quinn Foster'), clubId: 'c5', sport: 'soccer', minutesAgo: 320, likes: 55, comments: 3,
    clip: 'passing', tag: 'TEAM PLAY', caption: 'Twelve passes before the shot. Midweek 7v7 is getting slick.',
  },
  {
    kind: 'highlight', id: 'f7', author: m(1, 'Jordan Lee'), clubId: 'c1', sport: 'soccer', minutesAgo: 600, likes: 210, comments: 28,
    stat: '3', statLabel: 'goals', title: 'Hat-trick', caption: 'Jordan Lee scored three in Friday Night Soccer.', gameId: 'g9',
  },
  {
    kind: 'photo', id: 'f8', author: m(11, 'Parker Hughes'), clubId: 'c7', sport: 'soccer', minutesAgo: 900, likes: 73, comments: 5,
    photo: 'soccer', caption: 'Futsal night was electric. Same time Thursday?',
  },
  {
    kind: 'result', id: 'f9', author: m(4, 'Taylor Brooks'), clubId: 'c2', sport: 'soccer', minutesAgo: 1440, likes: 48, comments: 7,
    placeId: 'p2', home: 'Sunday League Blue', away: 'Sunday League Red', score: [0, 0], status: 'final', mvp: m(12, 'Reese Morgan'),
  },
  {
    kind: 'clip', id: 'f10', author: m(12, 'Reese Morgan'), clubId: 'c7', sport: 'soccer', minutesAgo: 1900, likes: 66, comments: 8,
    clip: 'match', tag: 'NIGHT GAME', caption: 'Under the lights at the Community Center.', gameId: 'g8',
  },
  {
    kind: 'highlight', id: 'f11', author: m(6, 'Riley Chen'), clubId: 'c6', sport: 'pickleball', minutesAgo: 2600, likes: 29, comments: 2,
    stat: 'MVP', statLabel: 'lunch open play', title: 'Riley Chen', caption: 'Voted MVP after 6 straight wins on court 3.',
  },
  {
    kind: 'photo', id: 'f12', author: m(9, 'Avery Kim'), clubId: 'c1', sport: 'soccer', minutesAgo: 3400, likes: 51, comments: 4,
    photo: 'ride', caption: 'Rode to Friday Night Soccer. Worth it.',
  },
];

export function timeAgo(minutes: number) {
  if (minutes < 60) return `${Math.max(minutes, 1)}m`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / (60 * 24))}d`;
}
