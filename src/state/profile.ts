import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { SportId } from './models';

// Player profile: per-sport levels (from games played and streaks), a milestone tree per sport, and achievements.
// Mock data for now — replace with the player's real history from the API.

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface SportProgress {
  sport: SportId;
  level: number;
  /** Progress toward the next level, 0–1. */
  toNext: number;
  games: number;
  /** One headline number per sport, only things we can count from games (hours, places, people). */
  highlight: { value: string; label: string };
}

export type SkillState = 'mastered' | 'learning' | 'locked';

export interface Skill {
  id: string;
  name: string;
  icon: IconName;
  state: SkillState;
  /** For skills being learned, 0–1. */
  progress?: number;
  /** How you earn it, shown when tapped. */
  how: string;
}

export interface SkillTier {
  title: string;
  skills: Skill[];
}

export type AchievementTier = 'gold' | 'silver' | 'bronze';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  tier: AchievementTier;
  earned: boolean;
  /** Earned date label, or progress toward it. */
  earnedLabel?: string;
  progress?: [number, number];
}

export function levelName(level: number) {
  if (level >= 9) return 'Elite';
  if (level >= 7) return 'Advanced';
  if (level >= 5) return 'Skilled';
  if (level >= 3) return 'Regular';
  return 'Rookie';
}

export const memberSince = 'Mar 2025';
export const homeTown = 'Bentonville, AR';

// Everything below is countable from games you RSVP'd to that already ended: how many, how long, where,
// with whom, club vs open, who hosted, start time and the week it happened. No scores, goals, wins or miles.
export const sportProgress: SportProgress[] = [
  { sport: 'soccer', level: 6, toNext: 0.62, games: 48, highlight: { value: '61 h', label: 'Played' } },
  { sport: 'pickleball', level: 3, toNext: 0.35, games: 17, highlight: { value: '19 h', label: 'Played' } },
  { sport: 'trails', level: 2, toNext: 0.8, games: 9, highlight: { value: '16 h', label: 'Out' } },
];

export const totals = [
  { value: '74', label: 'Games' },
  { value: '96 h', label: 'Played' },
  { value: '6', label: 'Places' },
];

const skill = (id: string, name: string, icon: IconName, state: SkillState, how: string, progress?: number): Skill => ({ id, name, icon, state, how, progress });

export const skillTrees: Record<SportId, SkillTier[]> = {
  soccer: [
    {
      title: 'Getting started',
      skills: [
        skill('s-first', 'First game', 'soccer', 'mastered', 'Play your first soccer game.'),
        skill('s-ten', '10 games', 'numeric-10-circle-outline', 'mastered', 'Play 10 soccer games.'),
        skill('s-streak', 'Regular', 'calendar-check', 'mastered', 'Play 4 weeks in a row.'),
      ],
    },
    {
      title: 'Committed',
      skills: [
        skill('s-club', 'Club player', 'account-group', 'mastered', 'Play 10 club games.'),
        skill('s-fields', 'Field hopper', 'map-marker-multiple', 'learning', 'Play at 3 different fields (2 of 3).', 0.67),
        skill('s-hours', 'Iron legs', 'timer-outline', 'learning', 'Play 100 hours (61 of 100).', 0.61),
      ],
    },
    {
      title: 'Leader',
      skills: [
        skill('s-host', 'Host', 'flag-plus', 'locked', 'Host 5 games that fill up.'),
        skill('s-adv', 'Step up', 'chevron-triple-up', 'locked', 'Play 10 advanced-level games.'),
      ],
    },
  ],
  pickleball: [
    {
      title: 'Getting started',
      skills: [
        skill('p-first', 'First game', 'table-tennis', 'mastered', 'Play your first pickleball game.'),
        skill('p-ten', '10 games', 'numeric-10-circle-outline', 'mastered', 'Play 10 pickleball games.'),
        skill('p-streak', 'Regular', 'calendar-check', 'learning', 'Play 4 weeks in a row (2 of 4).', 0.5),
      ],
    },
    {
      title: 'Social',
      skills: [
        skill('p-people', 'Mixer', 'account-multiple', 'learning', 'Play with 20 different people (4 of 20).', 0.2),
        skill('p-courts', 'Court hopper', 'map-marker-multiple', 'locked', 'Play at 3 different courts.'),
      ],
    },
    {
      title: 'Organizer',
      skills: [
        skill('p-host', 'Host', 'flag-plus', 'locked', 'Host 5 games that fill up.'),
        skill('p-club', 'Founder', 'crown', 'locked', 'Create a pickleball club.'),
      ],
    },
  ],
  trails: [
    {
      title: 'Getting started',
      skills: [
        skill('t-first', 'First outing', 'hiking', 'mastered', 'Join your first group hike.'),
        skill('t-dawn', 'Early bird', 'weather-sunset-up', 'mastered', 'Join a hike that starts before 8 AM.'),
        skill('t-map', 'Pathfinder', 'map-marker-path', 'learning', 'Hike 5 different trails (3 of 5).', 0.6),
      ],
    },
    {
      title: 'Endurance',
      skills: [
        skill('t-10', '10 outings', 'numeric-10-circle-outline', 'learning', 'Join 10 group hikes (9 of 10).', 0.9),
        skill('t-hours', '25 hours', 'timer-outline', 'locked', 'Spend 25 hours on the trail.'),
      ],
    },
    {
      title: 'Guide',
      skills: [
        skill('t-lead', 'Trail leader', 'compass-outline', 'locked', 'Host 3 group hikes.'),
        skill('t-club', 'Founder', 'crown', 'locked', 'Create a trails club.'),
      ],
    },
  ],
};

export const achievements: Achievement[] = [
  { id: 'a1', title: 'First game', description: 'Played your first game on Coopeer.', icon: 'flag-checkered', tier: 'bronze', earned: true, earnedLabel: 'Mar 2025' },
  { id: 'a2', title: 'Social', description: 'Played with 25 different people.', icon: 'account-multiple', tier: 'gold', earned: true, earnedLabel: 'Sep 2025' },
  { id: 'a3', title: 'On fire', description: 'Played 4 weeks in a row.', icon: 'fire', tier: 'silver', earned: true, earnedLabel: 'Jun 2025' },
  { id: 'a4', title: 'Fifty', description: 'Played 50 games.', icon: 'star-circle', tier: 'gold', earned: true, earnedLabel: 'Oct 2025' },
  { id: 'a5', title: 'Club regular', description: 'Joined 3 clubs.', icon: 'account-group', tier: 'bronze', earned: true, earnedLabel: 'Apr 2025' },
  { id: 'a6', title: 'Early bird', description: 'Played a game that started before 8 AM.', icon: 'weather-sunset-up', tier: 'bronze', earned: true, earnedLabel: 'Aug 2025' },
  { id: 'a7', title: 'Triple threat', description: 'Played all three sports.', icon: 'medal', tier: 'silver', earned: true, earnedLabel: 'Aug 2025' },
  { id: 'a8', title: 'Centurion', description: 'Play 100 games.', icon: 'trophy', tier: 'gold', earned: false, progress: [74, 100] },
  { id: 'a9', title: 'Recruiter', description: 'Invite 5 friends who join a club.', icon: 'account-multiple-plus', tier: 'silver', earned: false, progress: [2, 5] },
  { id: 'a10', title: 'Explorer', description: 'Play at 10 different places.', icon: 'map-marker-radius', tier: 'silver', earned: false, progress: [6, 10] },
  { id: 'a11', title: 'Host', description: 'Host 5 games that fill up.', icon: 'flag-plus', tier: 'gold', earned: false, progress: [1, 5] },
  { id: 'a12', title: 'Founder', description: 'Create a club with 10 members.', icon: 'crown', tier: 'gold', earned: false, progress: [0, 10] },
];
