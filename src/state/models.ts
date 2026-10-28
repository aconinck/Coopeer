import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

// Domain:
// - Place: where people play. Every map pin is a Place.
// - Club:  a recurring group ("every Friday 8 PM"). Join once, get all its games.
// - Game:  one occurrence at a Place and time. Hosted by a Club, or open (pickup).

export type SportId = 'soccer' | 'pickleball' | 'trails';
type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const sports: Record<SportId, { label: string; icon: IconName; color: string; placeNoun: string }> = {
  soccer: { label: 'Soccer', icon: 'soccer', color: colors.soccer, placeNoun: 'field' },
  pickleball: { label: 'Pickleball', icon: 'table-tennis', color: colors.pickleball, placeNoun: 'courts' },
  trails: { label: 'Trails', icon: 'hiking', color: colors.trails, placeNoun: 'trail' },
};

export const sportIds: SportId[] = ['soccer', 'pickleball', 'trails'];

export interface Member {
  id: string;
  name: string;
}

export const ME: Member = { id: 'me', name: 'You' };

/** What the place physically is. Drives the quiet marker on the map (never an activity). */
export type PlaceKind = 'park' | 'field' | 'courts' | 'trail' | 'center';

export const placeKinds: Record<PlaceKind, { label: string; icon: IconName }> = {
  park: { label: 'Park', icon: 'tree' },
  field: { label: 'Field', icon: 'soccer-field' },
  courts: { label: 'Courts', icon: 'tennis' },
  trail: { label: 'Trail', icon: 'hiking' },
  center: { label: 'Community center', icon: 'home-city-outline' },
};

export interface Place {
  id: string;
  kind: PlaceKind;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  /** Sports that can be played here. */
  sports: SportId[];
  /** Photos of the place. Only use images we are licensed to show, and credit them. */
  photos?: { uri: string; credit?: string }[];
}

export type SkillLevel = 'Casual' | 'All levels' | 'Competitive';

export interface ClubLink {
  title: string;
  url: string;
}

export interface Club {
  id: string;
  name: string;
  sport: SportId;
  homePlaceId: string;
  cadence: string;
  about: string;
  links: ClubLink[];
  members: Member[];
  memberCount: number;
  monthlyPrice: number;
  level: SkillLevel;
  code: string;
  isNew?: boolean;
  /** Coopeer has confirmed this club is real and well run. */
  verified?: boolean;
  /** Local image URI picked by the creator; falls back to the sport logo. */
  photoUri?: string;
  ownerId?: string;
  /** Members who can create games and manage the club. */
  adminIds?: string[];
  /** Last 4 digits of the payout account, shown to admins. */
  payoutLast4?: string;
}

export type Repeat = 'never' | 'weekly' | 'weekdays';

export interface NewClub {
  name: string;
  about: string;
  links: ClubLink[];
  sport: SportId;
  homePlaceId: string;
  monthlyPrice: number;
  photoUri?: string;
  payoutLast4?: string;
}

export interface NewGame {
  /** null = open game, anyone can join. */
  clubId: string | null;
  sport: SportId;
  title: string;
  details: string;
  start: Date;
  end: Date;
  placeId: string;
  repeat: Repeat;
  /** null = all members. */
  inviteeIds: string[] | null;
}

/** Coopeer's fee added on top of the club price. */
export const COOPEER_FEE = 0.03;
export const memberPrice = (monthlyPrice: number) => Math.round(monthlyPrice * (1 + COOPEER_FEE) * 100) / 100;

export type RSVP = 'going' | 'declined' | 'none';
export type GameStatus = 'live' | 'soon' | 'today' | 'later' | 'ended';

export interface Game {
  id: string;
  sport: SportId;
  placeId: string;
  clubId: string | null;
  title: string;
  details: string;
  start: Date;
  end: Date;
  capacity: number;
  going: Member[];
  declined: Member[];
  noResponse: Member[];
  dropInPrice: number;
  level: SkillLevel;
  myRSVP: RSVP;
  isCanceled?: boolean;
  isNew?: boolean;
}

export interface Payment {
  id: string;
  clubName: string;
  amount: number;
  method: string;
}

/** What the player wants to do first; decides where sign-up lands them. */
export type Goal = 'play' | 'join' | 'host';

export interface User {
  id: string;
  phone: string;
  name: string;
  birthYear?: number;
  /** Favorite sports, picked at sign-up. Filters the map and feed first. */
  sports?: SportId[];
  goal?: Goal;
}

/** Everything sign-up collects after the phone is verified. */
export type NewProfile = Pick<User, 'name' | 'birthYear' | 'sports' | 'goal'>;

export function gameStatus(game: Game, now = new Date()): GameStatus {
  if (game.end < now) return 'ended';
  if (game.start <= now) return 'live';
  if (game.start.getTime() - now.getTime() < 2 * 3600 * 1000) return 'soon';
  if (game.start.toDateString() === now.toDateString()) return 'today';
  return 'later';
}

export const isToday = (status: GameStatus) => status === 'live' || status === 'soon' || status === 'today';
export const spotsLeft = (game: Game) => Math.max(game.capacity - game.going.length, 0);

export function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('');
}

export function formatCode(code: string) {
  return code.replace(/(\d{2})(?=\d)/g, '$1 ');
}

export const inviteUrl = (club: Club) => `coopeer://join/${club.code}`;
