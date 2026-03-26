// Ranking — season ELO leaderboard + badges.
// Design: open for iteration (no Figma reference yet).
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../src/components/shared/Avatar';
import { NavBar } from '../../src/components/shared/NavBar';
import { colors, typography, spacing, radius } from '../../src/constants/theme';
import type { RankingEntry, BadgeType } from '../../src/types';

type RankingTab = 'season' | 'alltime' | 'mystats';

// Mock ranking data
const MOCK_RANKING: RankingEntry[] = [
  {
    rank: 1,
    member: {
      id: 'm1',
      name: 'Alex Rivera',
      joinedAt: new Date(),
      stats: { goals: 12, assists: 5, gamesPlayed: 18, gamesPresent: 16, eloRating: 1480, badges: [] },
      trustScore: 88,
    },
    eloRating: 1480,
    trend: 'up',
    isCurrentUser: false,
  },
  {
    rank: 2,
    member: {
      id: 'm2',
      name: 'Jordan Lee',
      joinedAt: new Date(),
      stats: { goals: 7, assists: 9, gamesPlayed: 14, gamesPresent: 14, eloRating: 1380, badges: [] },
      trustScore: 95,
    },
    eloRating: 1380,
    trend: 'stable',
    isCurrentUser: true,
  },
  {
    rank: 3,
    member: {
      id: 'm3',
      name: 'Sam Torres',
      joinedAt: new Date(),
      stats: { goals: 3, assists: 2, gamesPlayed: 10, gamesPresent: 8, eloRating: 1290, badges: [] },
      trustScore: 72,
    },
    eloRating: 1290,
    trend: 'down',
    isCurrentUser: false,
  },
];

const BADGE_LABELS: Record<BadgeType, { label: string; emoji: string }> = {
  hat_trick: { label: 'Hat Trick', emoji: '🎩' },
  clean_sheet: { label: 'Clean Sheet', emoji: '🧤' },
  giant_killer: { label: 'Giant Killer', emoji: '⚔️' },
  iron_man: { label: 'Iron Man', emoji: '🔩' },
  first_blood: { label: 'First Blood', emoji: '🩸' },
};

function TrendIcon({ trend }: { trend: RankingEntry['trend'] }) {
  if (trend === 'up') return <Ionicons name="trending-up" size={14} color={colors.success} />;
  if (trend === 'down') return <Ionicons name="trending-down" size={14} color={colors.error} />;
  return <Ionicons name="remove" size={14} color={colors.gray500} />;
}

export default function RankingScreen() {
  const [activeTab, setActiveTab] = useState<RankingTab>('season');

  const SEASON_END = new Date('2026-04-15');
  const daysLeft = Math.ceil((SEASON_END.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const seasonProgress = Math.max(0, Math.min(1, 1 - daysLeft / 90));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ranking</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Season banner */}
        <View style={styles.seasonBanner}>
          <View style={styles.seasonRow}>
            <Text style={styles.seasonLabel}>Season 1</Text>
            <Text style={styles.seasonDays}>{daysLeft} days left</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${seasonProgress * 100}%` }]} />
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          {(['season', 'alltime', 'mystats'] as RankingTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
                {tab === 'season' ? 'Season' : tab === 'alltime' ? 'All Time' : 'My Stats'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leaderboard */}
        <View style={styles.leaderboard}>
          {MOCK_RANKING.map((entry) => (
            <View
              key={entry.member.id}
              style={[styles.rankRow, entry.isCurrentUser && styles.currentUserRow]}
            >
              <Text style={styles.rankNum}>{entry.rank}</Text>
              <Avatar name={entry.member.name} uri={entry.member.avatar} size={36} />
              <View style={styles.rankInfo}>
                <Text style={styles.rankName}>{entry.member.name}</Text>
                <Text style={styles.rankMeta}>
                  {entry.member.stats.gamesPlayed} games · {entry.member.stats.goals} goals
                </Text>
              </View>
              <View style={styles.rankRight}>
                <Text style={styles.eloScore}>{entry.eloRating}</Text>
                <TrendIcon trend={entry.trend} />
              </View>
            </View>
          ))}
        </View>

        {/* Badge shelf */}
        <Text style={styles.sectionTitle}>Badges</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badges}>
          {(Object.entries(BADGE_LABELS) as [BadgeType, { label: string; emoji: string }][]).map(
            ([type, { label, emoji }]) => (
              <View key={type} style={styles.badgeItem}>
                <Text style={styles.badgeEmoji}>{emoji}</Text>
                <Text style={styles.badgeLabel}>{label}</Text>
              </View>
            )
          )}
        </ScrollView>
      </ScrollView>

      <NavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 64,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
    letterSpacing: typography.tracking.tight,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
    gap: spacing.md,
  },
  seasonBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    gap: spacing.sm,
  },
  seasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seasonLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  seasonDays: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.primaryBorder,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray500,
  },
  activeTabLabel: {
    color: colors.white,
  },
  leaderboard: {
    gap: spacing.sm,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  currentUserRow: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  rankNum: {
    width: 24,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.gray500,
    textAlign: 'center',
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  rankMeta: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  rankRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  eloScore: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  badges: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  badgeItem: {
    alignItems: 'center',
    gap: spacing.xs,
    marginRight: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    minWidth: 72,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray500,
    textAlign: 'center',
  },
});
