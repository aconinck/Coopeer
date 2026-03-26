import type { SportId } from '../constants/theme';

// Core domain types for the Coopeer app

export interface Sport {
  id: SportId;
  label: string;
  emoji: string;
  color: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  sport: Sport;
  description: string;
  location: TeamLocation;
  level: 'casual' | 'intermediate' | 'competitive';
  schedule: string; // e.g. "Fridays 8pm"
  memberCount: number;
  maxMembers: number;
  trialPrice: number; // in USD cents
  monthlyPrice: number; // in USD cents
  coverImage?: string;
  managerId: string;
  members: Member[];
  isNew?: boolean;
}

export interface TeamLocation {
  lat: number;
  lng: number;
  address: string;
  venueName: string;
}

export interface Member {
  id: string;
  name: string;
  avatar?: string;
  joinedAt: Date;
  stats: PlayerStats;
  trustScore: number; // 0–100
}

export interface PlayerStats {
  goals: number;
  assists: number;
  gamesPlayed: number;
  gamesPresent: number;
  eloRating: number;
  badges: Badge[];
}

export interface Event {
  id: string;
  teamId: string;
  title: string;
  description: string;
  date: Date;
  endDate: Date;
  venueName: string;
  venueAddress: string;
  confirmed: Member[];
  declined: Member[];
  pending: Member[];
  maxPlayers: number;
  isToday: boolean;
}

export interface Match {
  id: string;
  eventId: string;
  teamA: Team;
  teamB?: Team; // optional — might be internal scrimmage
  scoreA: number;
  scoreB: number;
  goals: Goal[];
  status: 'live' | 'finished' | 'survey_pending' | 'confirmed';
  mvpVotes: Record<string, string>; // voterId → playerId
  surveyResponses: SurveyResponse[];
  startedAt: Date;
  endedAt?: Date;
}

export interface Goal {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  minute: number;
  confirmedBy: string[]; // manager + witnesses
  pending: boolean;
}

export type BadgeType =
  | 'hat_trick'
  | 'clean_sheet'
  | 'giant_killer'
  | 'iron_man'
  | 'first_blood';

export interface Badge {
  id: string;
  type: BadgeType;
  earnedAt: Date;
  matchId?: string;
}

export interface SurveyResponse {
  id: string;
  responderId: string;
  scoreCorrect: boolean | null;
  topScorerCorrect: boolean | null;
  issueReport?: string;
  submittedAt: Date;
}

export interface Season {
  id: string;
  number: number;
  startDate: Date;
  endDate: Date;
  sport: Sport;
}

export interface RankingEntry {
  rank: number;
  member: Member;
  eloRating: number;
  trend: 'up' | 'down' | 'stable';
  isCurrentUser: boolean;
}

// Auth types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferredSports: SportId[];
  isManager: boolean;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Checkout types
export type CheckoutMode = 'trial' | 'subscription';

export interface CheckoutData {
  team: Team;
  mode: CheckoutMode;
}
