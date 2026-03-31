// API service layer.
// Currently returns mock data — replace with real API calls when backend is ready.
import { sports } from '../constants/theme';
import type { Team, Event, Match } from '../types';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MEMBERS = [
  {
    id: 'm1',
    name: 'Alex Rivera',
    joinedAt: new Date('2025-01-15'),
    stats: { goals: 12, assists: 5, gamesPlayed: 18, gamesPresent: 16, eloRating: 1240, badges: [] },
    trustScore: 88,
  },
  {
    id: 'm2',
    name: 'Jordan Lee',
    joinedAt: new Date('2025-02-01'),
    stats: { goals: 7, assists: 9, gamesPlayed: 14, gamesPresent: 14, eloRating: 1180, badges: [] },
    trustScore: 95,
  },
  {
    id: 'm3',
    name: 'Sam Torres',
    joinedAt: new Date('2025-01-20'),
    stats: { goals: 3, assists: 2, gamesPlayed: 10, gamesPresent: 8, eloRating: 1100, badges: [] },
    trustScore: 72,
  },
  {
    id: 'm4',
    name: 'Casey Wong',
    joinedAt: new Date('2025-03-01'),
    stats: { goals: 1, assists: 1, gamesPlayed: 4, gamesPresent: 4, eloRating: 1050, badges: [] },
    trustScore: 80,
  },
];

const MOCK_TEAMS: Team[] = [
  {
    id: 't1',
    name: 'Bentonville Strikers',
    slug: 'bentonville-strikers',
    sport: sports[0], // soccer
    description: 'Casual Friday night soccer — all skill levels welcome. We play at Lawrence Plaza and always grab drinks after.',
    location: {
      lat: 36.3729,
      lng: -94.2088,
      address: '100 NW 1st St, Bentonville, AR 72712',
      venueName: 'Lawrence Plaza Field',
    },
    level: 'casual',
    schedule: 'Fridays 8pm',
    memberCount: 14,
    maxMembers: 22,
    trialPrice: 700,
    monthlyPrice: 2900,
    managerId: 'm1',
    members: MOCK_MEMBERS,
  },
  {
    id: 't2',
    name: 'Crystal Bridges Picklers',
    slug: 'crystal-bridges-picklers',
    sport: sports[1], // pickleball
    description: 'Weekend pickleball for enthusiasts. Mixed levels — beginners get paired with experienced players.',
    location: {
      lat: 36.3818,
      lng: -94.1990,
      address: '600 Museum Way, Bentonville, AR 72712',
      venueName: 'Crystal Bridges Courts',
    },
    level: 'intermediate',
    schedule: 'Saturdays 9am',
    memberCount: 8,
    maxMembers: 12,
    trialPrice: 700,
    monthlyPrice: 2400,
    managerId: 'm2',
    members: MOCK_MEMBERS.slice(0, 3),
    isNew: true,
  },
  {
    id: 't3',
    name: 'Walmart Campus Ballers',
    slug: 'walmart-campus-ballers',
    sport: sports[2], // basketball
    description: '3-on-3 and 5-on-5 pickup basketball. Competitive but friendly. Lunch runs on Tuesdays.',
    location: {
      lat: 36.3648,
      lng: -94.2143,
      address: '702 SW 8th St, Bentonville, AR 72712',
      venueName: 'Campus Recreation Center',
    },
    level: 'intermediate',
    schedule: 'Tue & Thu 12pm',
    memberCount: 18,
    maxMembers: 20,
    trialPrice: 700,
    monthlyPrice: 3200,
    managerId: 'm3',
    members: MOCK_MEMBERS,
  },
  {
    id: 't4',
    name: 'Slaughter Pen Tennis Club',
    slug: 'slaughter-pen-tennis',
    sport: sports[3], // tennis
    description: 'Singles and doubles for intermediate players. USTA ratings 3.0–4.0.',
    location: {
      lat: 36.3542,
      lng: -94.2015,
      address: '100 Slaughter Pen Dr, Bentonville, AR 72712',
      venueName: 'Slaughter Pen Park Courts',
    },
    level: 'competitive',
    schedule: 'Wednesdays 6pm',
    memberCount: 10,
    maxMembers: 16,
    trialPrice: 700,
    monthlyPrice: 2600,
    managerId: 'm4',
    members: MOCK_MEMBERS.slice(1, 4),
  },
  {
    id: 't5',
    name: 'Razorback Trail Runners',
    slug: 'razorback-trail-runners',
    sport: sports[4], // running
    description: 'Weekly trail runs on the Razorback Greenway. Distances 3–8 miles, all paces welcome.',
    location: {
      lat: 36.3780,
      lng: -94.2200,
      address: 'Razorback Greenway Trailhead, Bentonville, AR',
      venueName: 'Razorback Greenway',
    },
    level: 'casual',
    schedule: 'Sundays 7am',
    memberCount: 22,
    maxMembers: 40,
    trialPrice: 700,
    monthlyPrice: 1800,
    managerId: 'm1',
    members: MOCK_MEMBERS,
  },
];

const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    teamId: 't1',
    title: 'Friday Night Soccer',
    description: 'Regular weekly game at Lawrence Plaza. Bring cleats and water.',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
    venueName: 'Lawrence Plaza Field',
    venueAddress: '100 NW 1st St, Bentonville, AR 72712',
    confirmed: MOCK_MEMBERS.slice(0, 3),
    declined: [],
    pending: [MOCK_MEMBERS[3]],
    maxPlayers: 22,
    isToday: false,
  },
  {
    id: 'e2',
    teamId: 't2',
    title: 'Saturday Pickleball',
    description: 'Mixed doubles round robin. All levels.',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000),
    venueName: 'Crystal Bridges Courts',
    venueAddress: '600 Museum Way, Bentonville, AR 72712',
    confirmed: MOCK_MEMBERS.slice(0, 2),
    declined: [],
    pending: [MOCK_MEMBERS[2]],
    maxPlayers: 12,
    isToday: false,
  },
];

// ─── API functions ─────────────────────────────────────────────────────────────

// Returns teams near a given coordinate (mock: returns all teams with slight delay)
export async function getMockTeams(lat: number, lng: number): Promise<Team[]> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return MOCK_TEAMS;
}

export async function getTeam(id: string): Promise<Team | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_TEAMS.find((t) => t.id === id);
}

export async function getEvent(id: string): Promise<Event | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_EVENTS.find((e) => e.id === id);
}

export async function getTeamEvents(teamId: string): Promise<Event[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_EVENTS.filter((e) => e.teamId === teamId);
}

export async function getMyTeams(): Promise<Team[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_TEAMS.slice(0, 3);
}

export async function getMyEvents(): Promise<Event[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_EVENTS;
}
